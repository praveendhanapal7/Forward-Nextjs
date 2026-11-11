import { resolveUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await resolveUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const integrationId = searchParams.get("integrationId") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const where = {
    ...(status && { status }),
    ...(integrationId && { integrationId }),
  };

  const [logs, total] = await Promise.all([
    prisma.leadLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        integration: {
          select: { name: true, pageName: true, formName: true },
        },
      },
    }),
    prisma.leadLog.count({ where }),
  ]);

  return Response.json({ logs, total });
}
