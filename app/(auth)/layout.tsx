import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

// Force dynamic rendering to prevent database connection during build
export const dynamic = "force-dynamic";

async function layout({ children }: { children: React.ReactNode }) {
  try {
    const authInstance = await auth;
    const session = await authInstance.api.getSession({
      headers: await headers(),
    });
    if (session?.user) redirect("/");
  } catch (error) {
    // Re-throw redirect errors - they're not actual errors
    const isRedirect =
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" ||
        ("digest" in error &&
          typeof error.digest === "string" &&
          error.digest.startsWith("NEXT_REDIRECT")));

    if (isRedirect) {
      throw error;
    }
    console.error("Auth layout error:", error);
    // Allow rendering even if auth check fails
  }

  return (
    <main className="auth-layout">
      <section className="auth-left-section scrollbar-hide-default">
        <Link href="/" className="auth-logo">
          <Image
            src="/assets/images/logo.png"
            alt="analystic"
            width={140}
            height={32}
            className="cursor-pointer"
          />
        </Link>
        <div className="pb-6 lg:pb-8 flex-1">{children}</div>
      </section>
      <section className="auth-right-section">
        <div className="z-10 relative lg:mt-4 lg:mb-16">
          <blockquote className="auth-blockquote">
            analystic turned my watchlist into a winning list. The alerts are
            spot-on, and I feel more confident making moves in the market
          </blockquote>
          <div className="flex items-center justify-between ">
            <div>
              <cite className="auth-testimonial-author">- Ethan R.</cite>
              <p className="max-md:text-xs text-gray-500">Retail Investor</p>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((item) => (
                <Image
                  key={item}
                  src={`/assets/icons/star.svg`}
                  alt="star"
                  width={20}
                  height={20}
                  className="size-5 "
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 relative">
          <Image
            src="/assets/images/dashboard.png"
            alt="analystic"
            width={1440}
            height={1150}
            className="auth-dashboard-preview absolute top-0"
          />
        </div>
      </section>
    </main>
  );
}

export default layout;
