import { resolveUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await resolveUser();
    if (!user) return Response.json({ user: null });

    return Response.json({
      user: {
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        brandName: user.brandName,
        phoneNumber: user.phoneNumber,
        location: user.location,
      },
    });
  } catch {
    return Response.json({ user: null });
  }
}
