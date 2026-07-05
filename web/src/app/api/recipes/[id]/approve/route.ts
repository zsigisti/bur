import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { canReviewRecipes } from "@/lib/permissions";
import { TRUST_THRESHOLD } from "@/lib/types";
import { clientIp } from "@/lib/ratelimit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user || !canReviewRecipes(user)) {
    return Response.json({ error: "Not authorized." }, { status: 403 });
  }
  const { id } = await params;

  try {
    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) return Response.json({ error: "Recipe not found." }, { status: 404 });
    if (recipe.status !== "PENDING") {
      return Response.json({ error: `Recipe is already ${recipe.status.toLowerCase()}.` }, { status: 409 });
    }

    await prisma.recipe.update({
      where: { id },
      data: { status: "APPROVED", reviewedById: user.id, reviewedAt: new Date(), rejectionReason: null },
    });

    // Credit the submitter and promote to trusted at the threshold.
    const submitter = await prisma.user.update({
      where: { id: recipe.submittedById },
      data: { approvedCount: { increment: 1 } },
      select: { approvedCount: true, trusted: true },
    });
    if (!submitter.trusted && submitter.approvedCount >= TRUST_THRESHOLD) {
      await prisma.user.update({ where: { id: recipe.submittedById }, data: { trusted: true } });
    }

    await prisma.auditLog.create({
      data: { actorId: user.id, action: "recipe.approve", targetType: "recipe", targetId: id, ip: clientIp(req) },
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not approve the recipe." }, { status: 503 });
  }
}
