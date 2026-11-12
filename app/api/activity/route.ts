import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

    // Agency sees all; brand users see only their brand's activities
    const leadWhere = isAgency(user)
      ? {}
      : user.brandName
        ? { clientName: user.brandName }
        : null;

    if (leadWhere === null) return Response.json([]);

    const activities = await prisma.leadActivity.findMany({
      where: { lead: leadWhere },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        lead: {
          select: { id: true, phoneNumber: true, requirements: true, clientName: true },
        },
      },
    });

    return Response.json(activities);
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
