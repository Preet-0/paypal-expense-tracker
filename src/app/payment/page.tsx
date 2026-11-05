import { auth } from "@/auth";
import PayPalCheckout from "@/components/PayPalCheckout";
import SandboxCredentials from "@/components/SandboxCredentials";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function PaymentPage() {
  const session = await auth();

  let isDemoUser = false;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        isDemoUser: true,
      },
    });

    isDemoUser = user?.isDemoUser ?? false;
  }

  const buyerEmail = process.env.DEMO_PAYPAL_BUYER_EMAIL;
  const buyerPassword = process.env.DEMO_PAYPAL_BUYER_PASSWORD;

  return (
    <div className="space-y-6">
      {isDemoUser && buyerEmail && buyerPassword && (
        <div className="mx-auto max-w-2xl">
          <SandboxCredentials
            email={buyerEmail}
            password={buyerPassword}
          />
        </div>
      )}

      <PayPalCheckout />
    </div>
  );
}