//! bur — the Blueberry User Repository client.
//!
//! Talks to the BUR API (bur.blueberrylinux.org) and community mirror
//! (repo1.blueberrylinux.org). `search`/`info`/`install` are public; `submit`
//! and `publish` require `bur login`.

use clap::{Parser, Subcommand};
use std::io::{self, Write};
use std::path::Path;
use std::process::Command;

fn api() -> String {
    std::env::var("BUR_API").unwrap_or_else(|_| "https://bur.blueberrylinux.org".into())
}
fn repo() -> String {
    std::env::var("BUR_REPO").unwrap_or_else(|_| "https://repo1.blueberrylinux.org".into())
}

#[derive(Parser)]
#[command(name = "bur", version, about = "Blueberry User Repository client")]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// Log in (stores a session token for submit/publish).
    Login,
    /// Log out (forget the stored token).
    Logout,
    /// Search community packages.
    Search { query: String },
    /// Show details for a package.
    Info { name: String },
    /// List your own recipes and their status.
    Recipes,
    /// Submit the recipe in <dir> (default: current directory) for review.
    Submit {
        #[arg(default_value = ".")]
        dir: String,
    },
    /// Publish an approved recipe's built .bpm. Pass the recipe id (see `bur recipes`).
    Publish {
        id: String,
        #[arg(default_value = ".")]
        dir: String,
    },
    /// Download and install a published package via bpm.
    Install { name: String },
}

type R = Result<(), String>;

fn main() {
    let r = match Cli::parse().cmd {
        Cmd::Login => login(),
        Cmd::Logout => logout(),
        Cmd::Search { query } => search(&query),
        Cmd::Info { name } => info(&name),
        Cmd::Recipes => recipes(),
        Cmd::Submit { dir } => submit(&dir),
        Cmd::Publish { id, dir } => publish(&id, &dir),
        Cmd::Install { name } => install(&name),
    };
    if let Err(e) = r {
        eprintln!("bur: {e}");
        std::process::exit(1);
    }
}

// ---- token storage --------------------------------------------------------
fn token_path() -> std::path::PathBuf {
    let mut p = dirs::config_dir().unwrap_or_else(|| ".".into());
    p.push("bur");
    p.push("token");
    p
}
fn load_token() -> Option<String> {
    std::fs::read_to_string(token_path()).ok().map(|s| s.trim().to_string()).filter(|s| !s.is_empty())
}
fn require_token() -> Result<String, String> {
    load_token().ok_or_else(|| "not logged in — run `bur login`".into())
}

fn prompt(label: &str) -> Result<String, String> {
    print!("{label}");
    io::stdout().flush().ok();
    let mut s = String::new();
    io::stdin().read_line(&mut s).map_err(|e| e.to_string())?;
    Ok(s.trim().to_string())
}

fn client() -> reqwest::blocking::Client {
    reqwest::blocking::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .expect("http client")
}

// ---- commands -------------------------------------------------------------
fn login() -> R {
    let identifier = prompt("Username: ")?;
    let password = rpassword::prompt_password("Password: ").map_err(|e| e.to_string())?;
    let c = client();

    let res = c
        .post(format!("{}/api/auth/login", api()))
        .json(&serde_json::json!({ "identifier": identifier, "password": password }))
        .send()
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(err_body(res, "login failed"));
    }

    let code = prompt("Email code: ")?;
    let res = c
        .post(format!("{}/api/auth/verify", api()))
        .json(&serde_json::json!({ "identifier": identifier, "code": code }))
        .send()
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(err_body(res, "verification failed"));
    }

    // Capture the bur_session cookie from Set-Cookie.
    let token = res
        .headers()
        .get_all("set-cookie")
        .iter()
        .filter_map(|v| v.to_str().ok())
        .find_map(|c| c.split(';').next())
        .and_then(|kv| kv.strip_prefix("bur_session="))
        .map(|s| s.to_string())
        .ok_or("server did not return a session")?;

    let p = token_path();
    if let Some(dir) = p.parent() {
        std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    std::fs::write(&p, &token).map_err(|e| e.to_string())?;
    println!("Logged in as {identifier}.");
    Ok(())
}

fn logout() -> R {
    let _ = std::fs::remove_file(token_path());
    println!("Logged out.");
    Ok(())
}

fn search(q: &str) -> R {
    let res = client()
        .get(format!("{}/api/packages", api()))
        .query(&[("q", q)])
        .send()
        .map_err(|e| e.to_string())?;
    let arr: Vec<serde_json::Value> = res.json().map_err(|e| e.to_string())?;
    if arr.is_empty() {
        println!("No packages match \"{q}\".");
        return Ok(());
    }
    for p in arr {
        let name = p["name"].as_str().unwrap_or("");
        let ver = p["version"].as_str().unwrap_or("—");
        let desc = p["description"].as_str().unwrap_or("");
        println!("{name:<24} {ver:<12} {desc}");
    }
    Ok(())
}

fn info(name: &str) -> R {
    let res = client().get(format!("{}/api/packages/{name}", api())).send().map_err(|e| e.to_string())?;
    if res.status() == reqwest::StatusCode::NOT_FOUND {
        return Err(format!("package \"{name}\" not found"));
    }
    let p: serde_json::Value = res.json().map_err(|e| e.to_string())?;
    println!("{}", p["name"].as_str().unwrap_or(name));
    if let Some(d) = p["description"].as_str() {
        println!("  {d}");
    }
    println!("  owner: {}", p["owner"].as_str().unwrap_or("?"));
    if let Some(vs) = p["versions"].as_array() {
        println!("  versions:");
        for v in vs {
            println!(
                "    {}  sha256:{}",
                v["version"].as_str().unwrap_or(""),
                v["sha256"].as_str().unwrap_or("").chars().take(16).collect::<String>()
            );
        }
    }
    Ok(())
}

fn recipes() -> R {
    let token = require_token()?;
    let res = client()
        .get(format!("{}/api/recipes/mine", api()))
        .header("cookie", format!("bur_session={token}"))
        .send()
        .map_err(|e| e.to_string())?;
    if res.status() == reqwest::StatusCode::UNAUTHORIZED {
        return Err("session expired — run `bur login`".into());
    }
    let arr: Vec<serde_json::Value> = res.json().map_err(|e| e.to_string())?;
    if arr.is_empty() {
        println!("You have no recipes yet.");
        return Ok(());
    }
    for r in arr {
        println!(
            "{:<26} {:<20} {:<10} {}",
            r["id"].as_str().unwrap_or(""),
            r["package"].as_str().unwrap_or(""),
            r["version"].as_str().unwrap_or(""),
            r["status"].as_str().unwrap_or("")
        );
    }
    Ok(())
}

fn submit(dir: &str) -> R {
    let token = require_token()?;
    let path = Path::new(dir).join("bpm.toml");
    let toml = std::fs::read_to_string(&path).map_err(|_| format!("no bpm.toml in {dir}"))?;
    let res = client()
        .post(format!("{}/api/recipes", api()))
        .header("cookie", format!("bur_session={token}"))
        .json(&serde_json::json!({ "bpmToml": toml }))
        .send()
        .map_err(|e| e.to_string())?;
    let ok = res.status().is_success();
    let body: serde_json::Value = res.json().map_err(|e| e.to_string())?;
    if !ok {
        return Err(body["error"].as_str().unwrap_or("submit failed").to_string());
    }
    println!(
        "Submitted {} — status {}, recipe id {}",
        body["package"].as_str().unwrap_or("?"),
        body["status"].as_str().unwrap_or("?"),
        body["id"].as_str().unwrap_or("?")
    );
    Ok(())
}

fn publish(id: &str, dir: &str) -> R {
    let token = require_token()?;
    // Find a single .bpm in the directory.
    let bpm = std::fs::read_dir(dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok().map(|e| e.path()))
        .find(|p| p.extension().and_then(|s| s.to_str()) == Some("bpm"))
        .ok_or_else(|| format!("no .bpm file found in {dir}"))?;
    let form = reqwest::blocking::multipart::Form::new()
        .file("file", &bpm)
        .map_err(|e| e.to_string())?;
    let res = client()
        .post(format!("{}/api/recipes/{id}/publish", api()))
        .header("cookie", format!("bur_session={token}"))
        .multipart(form)
        .send()
        .map_err(|e| e.to_string())?;
    let ok = res.status().is_success();
    let body: serde_json::Value = res.json().map_err(|e| e.to_string())?;
    if !ok {
        return Err(body["error"].as_str().unwrap_or("publish failed").to_string());
    }
    println!(
        "Published {} ({} bytes, sha256 {})",
        body["filename"].as_str().unwrap_or("?"),
        body["size"].as_u64().unwrap_or(0),
        body["sha256"].as_str().unwrap_or("").chars().take(16).collect::<String>()
    );
    Ok(())
}

fn install(name: &str) -> R {
    let res = client().get(format!("{}/api/packages/{name}", api())).send().map_err(|e| e.to_string())?;
    if res.status() == reqwest::StatusCode::NOT_FOUND {
        return Err(format!("package \"{name}\" not found"));
    }
    let p: serde_json::Value = res.json().map_err(|e| e.to_string())?;
    let v = p["versions"].as_array().and_then(|a| a.first())
        .ok_or_else(|| format!("{name} has no published build yet"))?;
    let file = v["file"].as_str().ok_or("bad server response")?;
    let url = format!("{}/{file}", repo());

    let tmp = std::env::temp_dir().join(file);
    println!("Downloading {url}");
    let bytes = client().get(&url).send().map_err(|e| e.to_string())?.bytes().map_err(|e| e.to_string())?;
    std::fs::write(&tmp, &bytes).map_err(|e| e.to_string())?;

    // Hand off to bpm if present, else tell the user where the file is.
    if which("bpm") {
        println!("Installing with bpm…");
        let status = Command::new("bpm").arg("install").arg(&tmp).status().map_err(|e| e.to_string())?;
        if !status.success() {
            return Err("bpm install failed".into());
        }
    } else {
        println!("Downloaded to {}. Install it with: bpm install {}", tmp.display(), tmp.display());
    }
    Ok(())
}

fn which(bin: &str) -> bool {
    std::env::var("PATH").ok().map_or(false, |paths| {
        std::env::split_paths(&paths).any(|d| d.join(bin).is_file())
    })
}

fn err_body(res: reqwest::blocking::Response, fallback: &str) -> String {
    res.json::<serde_json::Value>()
        .ok()
        .and_then(|v| v["error"].as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| fallback.to_string())
}
