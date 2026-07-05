//! bur — the Blueberry User Repository client.
//!
//! Works like `bpm` but against the community repo (repo1.mmzsigmond.me) and the
//! BUR API (bur.mmzsigmond.me). Installed on demand via `bpm install bur`; it is
//! NOT part of the base system.
//!
//! Scaffold: the subcommands are wired up; network/build bodies are stubbed and
//! filled in incrementally.

use clap::{Parser, Subcommand};

const API: &str = "https://bur.mmzsigmond.me";
const REPO: &str = "https://repo1.mmzsigmond.me";

#[derive(Parser)]
#[command(name = "bur", version, about = "Blueberry User Repository client")]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// Search community packages on the BUR.
    Search { query: String },
    /// Show details for a package.
    Info { name: String },
    /// Build the recipe in <dir> locally into a .bpm (default: current dir).
    Build {
        #[arg(default_value = ".")]
        dir: String,
    },
    /// Build then install a community package from repo1.
    Install { name: String },
    /// Log in to the BUR (stores a token for submit/publish).
    Login,
    /// Submit the recipe in <dir> for review.
    Submit {
        #[arg(default_value = ".")]
        dir: String,
    },
    /// Publish an approved package's built .bpm to repo1.
    Publish {
        #[arg(default_value = ".")]
        dir: String,
    },
}

fn main() {
    let cli = Cli::parse();
    let r = match cli.cmd {
        Cmd::Search { query } => search(&query),
        Cmd::Info { name } => info(&name),
        Cmd::Build { dir } => build(&dir),
        Cmd::Install { name } => install(&name),
        Cmd::Login => login(),
        Cmd::Submit { dir } => submit(&dir),
        Cmd::Publish { dir } => publish(&dir),
    };
    if let Err(e) = r {
        eprintln!("bur: {e}");
        std::process::exit(1);
    }
}

type R = Result<(), String>;

fn search(_q: &str) -> R {
    println!("(todo) GET {API}/api/packages?q=…");
    Ok(())
}
fn info(_n: &str) -> R {
    println!("(todo) GET {API}/api/packages/<name>");
    Ok(())
}
fn build(dir: &str) -> R {
    // Delegates to the same bpmbuild path bpm uses.
    println!("(todo) build {dir}/bpm.toml -> .bpm (via bpmbuild in an arch container)");
    Ok(())
}
fn install(_n: &str) -> R {
    println!("(todo) resolve from {REPO}, build locally, install via bpm");
    Ok(())
}
fn login() -> R {
    println!("(todo) POST {API}/api/auth/login (+ email 2FA), cache token in ~/.config/bur/token");
    Ok(())
}
fn submit(dir: &str) -> R {
    println!("(todo) POST {API}/api/recipes with {dir}/bpm.toml + local build metadata");
    Ok(())
}
fn publish(dir: &str) -> R {
    println!("(todo) upload approved {dir}/*.bpm to {REPO} (author/contributor/owner only)");
    Ok(())
}
