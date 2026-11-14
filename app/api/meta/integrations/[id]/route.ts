import { resolveUser, isAgency } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await resolveUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const { status, name, clientName } = body ?? {};

  const integration = await prisma.metaIntegration.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(name !== undefined && { name }),
      ...(clientName !== undefined && isAgency(user) && { clientName }),
    },
  });

  return Response.json(integration);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await resolveUser();
  if (!user) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const integration = await prisma.metaIntegration.findUnique({ where: { id } });

  if (integration) {
    // Try to unsubscribe — best effort
    try {
      await fetch(
        `https://graph.facebook.com/v19.0/${integration.pageId}/subscribed_apps?subscribed_fields=leadgen&access_token=${integration.pageAccessToken}`,
        { method: "DELETE" },
      );
    } catch {
      /* noop */
    }
  }

  await prisma.metaIntegration.delete({ where: { id } });
  return Response.json({ success: true });
}
