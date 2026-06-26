import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (token) {
      await prisma.userSession.delete({ where: { token } }).catch(() => null);
    }

    const headers = new Headers();
    headers.set("Set-Cookie", clearSessionCookie());
    return new Response(null, { status: 204, headers });
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
