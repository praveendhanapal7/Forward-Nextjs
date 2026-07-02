import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await resolveUser();
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    if (!isAgency(user))
      return Response.json({ message: "Forbidden" }, { status: 403 });

    const models = await prisma.accessModel.findMany({
      select: { brandName: true },
    });
    const brands = models
      .map((m) => m.brandName)
      .filter((b): b is string => Boolean(b));

    return Response.json(brands);
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
