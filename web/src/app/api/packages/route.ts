import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Public search/list for the CLI and site.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const pkgs = await prisma.package.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      recipes: { where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 1 },
    },
  });
  return Response.json(
    pkgs.map((p) => ({
      name: p.name,
      description: p.description,
      version: p.recipes[0] ? `${p.recipes[0].version}-${p.recipes[0].release}` : null,
      sha256: p.recipes[0]?.artifactSha256 ?? null,
    })),
  );
}
