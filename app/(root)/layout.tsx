import Header from "@/components/Header";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Force dynamic rendering to prevent database connection during build
export const dynamic = "force-dynamic";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  let session = null;
  let authError = false;

  try {
    const authInstance = await auth;
    session = await authInstance.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    console.error("Root layout error:", error);
    authError = true;
  }

  if (authError || !session?.user) {
    redirect("/sign-in");
  }

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };

  return (
    <main className="min-h-screen text-gray-400">
      <Header user={user} />

      <div className="container py-10">{children}</div>
    </main>
  );
};
export default Layout;
