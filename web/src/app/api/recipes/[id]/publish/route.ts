import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { canPublish } from "@/lib/permissions";
import { clientIp } from "@/lib/ratelimit";

const REPO_DIR = process.env.REPO1_DIR ?? "/opt/bur/repo1";
const MAX_BYTES = 512 * 1024 * 1024;
const REPO_HOST = process.env.COMMUNITY_REPO_HOST ?? "repo1.blueberrylinux.org";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in to publish." }, { status: 401 });
  const { id } = await params;

  try {
    const recipe = await prisma.recipe.findUnique({ where: { id }, include: { package: true } });
    if (!recipe) return Response.json({ error: "Recipe not found." }, { status: 404 });
    if (!(await canPublish(user, recipe.packageId, recipe.submittedById))) {
      return Response.json({ error: "Not authorized to publish this package." }, { status: 403 });
    }
    if (recipe.status !== "APPROVED" && recipe.status !== "PUBLISHED") {
      return Response.json({ error: "Only approved recipes can be published." }, { status: 409 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "No file uploaded." }, { status: 400 });
    if (file.size === 0 || file.size > MAX_BYTES) {
      return Response.json({ error: "File is empty or too large." }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(buf).digest("hex");
    // Canonical, path-safe filename derived from the recipe (never the upload name).
    const filename = `${recipe.package.name}-${recipe.version}-${recipe.release}-x86_64.bpm`;
    await mkdir(REPO_DIR, { recursive: true });
    await writeFile(`${REPO_DIR}/${filename}`, buf);

    await prisma.recipe.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        builtLocally: true,
        artifactSha256: sha256,
        artifactSize: buf.length,
        publishedRepo: REPO_HOST,
        publishedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id, action: "recipe.publish", targetType: "recipe", targetId: id,
        metadata: JSON.stringify({ filename, sha256, size: buf.length }), ip: clientIp(req),
      },
    });

    return Response.json({ ok: true, filename, sha256, size: buf.length });
  } catch {
    return Response.json({ error: "Publish failed." }, { status: 503 });
  }
}
