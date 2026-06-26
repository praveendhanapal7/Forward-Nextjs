import { ContactSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ message: "Invalid request" }, { status: 400 });
    }

    const { name, email, message } = parsed.data;
    console.info(`[Contact] From: ${name} <${email}> — ${message}`);

    return Response.json({ message: "Enquiry received. We will be in touch soon." });
  } catch {
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}
