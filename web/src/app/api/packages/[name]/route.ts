import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const REPO = process.env.COMMUNITY_REPO_HOST ?? "repo1.blueberrylinux.org";

// Public package info for the CLI.
export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const pkg = await prisma.package.findUnique({
    where: { name },
    include: {
      owner: { select: { username: true } },
      recipes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!pkg) return Response.json({ error: "Package not found." }, { status: 404 });

  const versions = pkg.recipes
    .filter((r) => r.status === "PUBLISHED")
    .map((r) => ({
      version: `${r.version}-${r.release}`,
      sha256: r.artifactSha256,
      size: r.artifactSize,
      file: `${pkg.name}-${r.version}-${r.release}-x86_64.bpm`,
      url: `https://${REPO}/${pkg.name}-${r.version}-${r.release}-x86_64.bpm`,
    }));

  return Response.json({
    name: pkg.name,
    description: pkg.description,
    homepage: pkg.homepage,
    owner: pkg.owner.username,
    versions,
  });
}
