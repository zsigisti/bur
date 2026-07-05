import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// The signed-in user's own recipes (for the CLI to find IDs to publish).
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  const recipes = await prisma.recipe.findMany({
    where: { submittedById: user.id },
    include: { package: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(
    recipes.map((r) => ({
      id: r.id,
      package: r.package.name,
      version: `${r.version}-${r.release}`,
      status: r.status,
    })),
  );
}
