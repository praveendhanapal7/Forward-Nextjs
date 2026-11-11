import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/integrations/sheets/[id] — disconnect a sheet
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const source = await prisma.leadSource.findUnique({ where: { id } });
    if (!source) return Response.json({ message: "Not found" }, { status: 404 });

    if (!isAgency(user) && source.clientName !== user.brandName) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.leadSource.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
