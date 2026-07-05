import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { canReviewRecipes } from "@/lib/permissions";
import { clientIp } from "@/lib/ratelimit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user || !canReviewRecipes(user)) {
    return Response.json({ error: "Not authorized." }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const reason = String(body?.reason ?? "").slice(0, 1000) || "No reason given.";

  try {
    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) return Response.json({ error: "Recipe not found." }, { status: 404 });
    if (recipe.status !== "PENDING") {
      return Response.json({ error: `Recipe is already ${recipe.status.toLowerCase()}.` }, { status: 409 });
    }

    await prisma.recipe.update({
      where: { id },
      data: { status: "REJECTED", reviewedById: user.id, reviewedAt: new Date(), rejectionReason: reason },
    });
    await prisma.auditLog.create({
      data: { actorId: user.id, action: "recipe.reject", targetType: "recipe", targetId: id, ip: clientIp(req) },
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not reject the recipe." }, { status: 503 });
  }
}
