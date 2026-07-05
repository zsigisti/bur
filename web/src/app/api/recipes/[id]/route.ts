import { unlink } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { isAuthor, isPackageOwner } from "@/lib/permissions";
import { clientIp } from "@/lib/ratelimit";

const REPO_DIR = process.env.REPO1_DIR ?? "/opt/bur/repo1";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await params;

  try {
    const recipe = await prisma.recipe.findUnique({ where: { id }, include: { package: true } });
    if (!recipe) return Response.json({ error: "Recipe not found." }, { status: 404 });

    // The submitter can delete their own recipe (any status); package owners and
    // Authors can delete any recipe in scope.
    const allowed =
      user.id === recipe.submittedById ||
      isAuthor(user) ||
      (await isPackageOwner(user, recipe.packageId));
    if (!allowed) return Response.json({ error: "Not authorized." }, { status: 403 });

    // Remove the published artifact from the mirror directory if present.
    if (recipe.status === "PUBLISHED") {
      const filename = `${recipe.package.name}-${recipe.version}-${recipe.release}-x86_64.bpm`;
      await unlink(`${REPO_DIR}/${filename}`).catch(() => {});
    }

    await prisma.recipe.delete({ where: { id } });

    // If that was the package's last recipe, remove the empty package too.
    const left = await prisma.recipe.count({ where: { packageId: recipe.packageId } });
    if (left === 0) await prisma.package.delete({ where: { id: recipe.packageId } }).catch(() => {});

    await prisma.auditLog.create({
      data: { actorId: user.id, action: "recipe.delete", targetType: "recipe", targetId: id, ip: clientIp(req) },
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not delete the recipe." }, { status: 503 });
  }
}
