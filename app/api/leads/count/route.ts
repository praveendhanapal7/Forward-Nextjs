import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const count = isAgency(user)
      ? await prisma.lead.count()
      : user.brandName
        ? await prisma.lead.count({ where: { clientName: user.brandName } })
        : 0;

    return Response.json({ count });
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
