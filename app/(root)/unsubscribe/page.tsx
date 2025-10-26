"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  unsubscribeFromEmails,
  resubscribeToEmails,
  getEmailPreferences,
} from "@/lib/actions/email-preferences.actions";
import { toast } from "sonner";
import { Mail, MailCheck, MailX, Loader2 } from "lucide-react";
import Link from "next/link";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const emailType = searchParams.get("type") as
    | "welcomeEmails"
    | "newsEmails"
    | "priceAlerts"
    | "all"
    | null;

  const [isLoading, setIsLoading] = useState(false);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const [preferences, setPreferences] = useState<{
    email: string;
    subscribedTo: {
      welcomeEmails: boolean;
      newsEmails: boolean;
      priceAlerts: boolean;
    };
  } | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const loadPreferences = useCallback(async () => {
    if (!userId) return;

    setLoadingPrefs(true);
    try {
      const result = await getEmailPreferences(userId);
      if (result.success && result.preferences) {
        setPreferences(result.preferences);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoadingPrefs(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadPreferences();
    } else {
      setLoadingPrefs(false);
    }
  }, [userId, loadPreferences]);

  const handleUnsubscribe = async (type: typeof emailType) => {
    if (!userId) {
      toast.error("Invalid unsubscribe link");
      return;
    }

    setIsLoading(true);
    try {
      const result = await unsubscribeFromEmails(userId, type || "all");

      if (result.success) {
        setIsUnsubscribed(true);
        toast.success("You have been unsubscribed successfully");
        await loadPreferences();
      } else {
        toast.error(result.message || "Failed to unsubscribe");
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResubscribe = async (
    type: "welcomeEmails" | "newsEmails" | "priceAlerts" | "all"
  ) => {
    if (!userId) {
      toast.error("Invalid link");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resubscribeToEmails(userId, type);

      if (result.success) {
        toast.success("You have been resubscribed successfully");
        await loadPreferences();
        if (type === "all") {
          setIsUnsubscribed(false);
        }
      } else {
        toast.error(result.message || "Failed to resubscribe");
      }
    } catch (error) {
      console.error("Error resubscribing:", error);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          <MailX className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
          <p className="text-gray-400 mb-6">
            This unsubscribe link is invalid or has expired.
          </p>
          <Link href="/">
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loadingPrefs) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  const getEmailTypeLabel = (type: string | null) => {
    switch (type) {
      case "welcomeEmails":
        return "Welcome Emails";
      case "newsEmails":
        return "Daily News Summary Emails";
      case "priceAlerts":
        return "Price Alert Emails";
      default:
        return "All Emails";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-lg p-8 border border-gray-700">
        {!isUnsubscribed ? (
          <>
            <div className="text-center mb-8">
              <Mail className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">
                Unsubscribe from Emails
              </h1>
              <p className="text-gray-400">
                We&apos;re sorry to see you go. You can unsubscribe from
                specific types of emails or all emails.
              </p>
            </div>

            {preferences && (
              <div className="bg-gray-900 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Your Email Preferences
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {preferences.email}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <Label className="text-gray-300">Welcome Emails</Label>
                    <div className="flex items-center gap-2">
                      {preferences.subscribedTo.welcomeEmails ? (
                        <>
                          <MailCheck className="h-4 w-4 text-green-500" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnsubscribe("welcomeEmails")}
                            disabled={isLoading}
                            className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            Unsubscribe
                          </Button>
                        </>
                      ) : (
                        <>
                          <MailX className="h-4 w-4 text-red-500" />
                          <Button
                            size="sm"
                            onClick={() => handleResubscribe("welcomeEmails")}
                            disabled={isLoading}
                            className="text-xs bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                          >
                            Resubscribe
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <Label className="text-gray-300">Daily News Summary</Label>
                    <div className="flex items-center gap-2">
                      {preferences.subscribedTo.newsEmails ? (
                        <>
                          <MailCheck className="h-4 w-4 text-green-500" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnsubscribe("newsEmails")}
                            disabled={isLoading}
                            className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            Unsubscribe
                          </Button>
                        </>
                      ) : (
                        <>
                          <MailX className="h-4 w-4 text-red-500" />
                          <Button
                            size="sm"
                            onClick={() => handleResubscribe("newsEmails")}
                            disabled={isLoading}
                            className="text-xs bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                          >
                            Resubscribe
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                    <Label className="text-gray-300">Price Alerts</Label>
                    <div className="flex items-center gap-2">
                      {preferences.subscribedTo.priceAlerts ? (
                        <>
                          <MailCheck className="h-4 w-4 text-green-500" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnsubscribe("priceAlerts")}
                            disabled={isLoading}
                            className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            Unsubscribe
                          </Button>
                        </>
                      ) : (
                        <>
                          <MailX className="h-4 w-4 text-red-500" />
                          <Button
                            size="sm"
                            onClick={() => handleResubscribe("priceAlerts")}
                            disabled={isLoading}
                            className="text-xs bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                          >
                            Resubscribe
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-red-400 mb-2">
                Unsubscribe from All Emails
              </h4>
              <p className="text-sm text-gray-400 mb-3">
                This will stop all email communications from analystic including
                welcome emails, news summaries, and price alerts.
              </p>
              <Button
                onClick={() => handleUnsubscribe("all")}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Unsubscribe from All"
                )}
              </Button>
            </div>

            <div className="text-center">
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center">
            <MailCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              Successfully Unsubscribed
            </h1>
            <p className="text-gray-400 mb-6">
              You have been unsubscribed from{" "}
              <span className="font-semibold text-white">
                {getEmailTypeLabel(emailType)}
              </span>
              . You won&apos;t receive these emails anymore.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Changed your mind? You can resubscribe anytime by managing your
              email preferences above or in your account settings.
            </p>
            <Link href="/">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                Return to Home
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
