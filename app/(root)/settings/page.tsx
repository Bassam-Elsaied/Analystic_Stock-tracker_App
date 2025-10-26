import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import EmailPreferencesSection from "../../../components/EmailPreferencesSection";

export default async function SettingsPage() {
  try {
    const session = await (
      await auth
    ).api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      redirect("/sign-in");
    }

    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400 mb-8">Manage your account preferences</p>

          <EmailPreferencesSection userId={session.user.id} />
        </div>
      </div>
    );
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
    console.error("Settings page error:", error);
    redirect("/sign-in");
  }
}
