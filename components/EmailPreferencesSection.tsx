"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  getEmailPreferences,
  unsubscribeFromEmails,
  resubscribeToEmails,
} from "@/lib/actions/email-preferences.actions";
import { toast } from "sonner";
import { Mail, MailCheck, MailX, Loader2 } from "lucide-react";

interface EmailPreferencesSectionProps {
  userId: string;
}

export default function EmailPreferencesSection({
  userId,
}: EmailPreferencesSectionProps) {
  const [preferences, setPreferences] = useState<{
    email: string;
    subscribedTo: {
      welcomeEmails: boolean;
      newsEmails: boolean;
      priceAlerts: boolean;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const result = await getEmailPreferences(userId);
      if (result.success && result.preferences) {
        setPreferences(result.preferences);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
      toast.error("Failed to load email preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (
    type: "welcomeEmails" | "newsEmails" | "priceAlerts",
    currentValue: boolean
  ) => {
    setUpdating(type);
    try {
      const result = currentValue
        ? await unsubscribeFromEmails(userId, type)
        : await resubscribeToEmails(userId, type);

      if (result.success) {
        toast.success(
          currentValue
            ? "Unsubscribed successfully"
            : "Resubscribed successfully"
        );
        await loadPreferences();
      } else {
        toast.error(result.message || "Failed to update preference");
      }
    } catch (error) {
      console.error("Error updating preference:", error);
      toast.error("An error occurred");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
        <p className="text-gray-400 text-center">
          Failed to load email preferences
        </p>
      </div>
    );
  }

  const getEmailTypeInfo = (
    type: "welcomeEmails" | "newsEmails" | "priceAlerts"
  ) => {
    switch (type) {
      case "welcomeEmails":
        return {
          title: "Welcome Emails",
          description: "Receive a personalized welcome email when you sign up",
        };
      case "newsEmails":
        return {
          title: "Daily News Summary",
          description:
            "Get daily market news summaries based on your watchlist",
        };
      case "priceAlerts":
        return {
          title: "Price Alert Notifications",
          description:
            "Receive email notifications when your price alerts are triggered",
        };
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-6 w-6 text-yellow-500" />
        <h2 className="text-2xl font-bold text-white">Email Preferences</h2>
      </div>

      <p className="text-sm text-gray-400 mb-6">
        Manage your email notification preferences. You can choose which types
        of emails you want to receive.
      </p>

      <div className="space-y-4">
        {(
          ["welcomeEmails", "newsEmails", "priceAlerts"] as Array<
            "welcomeEmails" | "newsEmails" | "priceAlerts"
          >
        ).map((type) => {
          const info = getEmailTypeInfo(type);
          const isSubscribed = preferences.subscribedTo[type];
          const isUpdating = updating === type;

          return (
            <div
              key={type}
              className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {isSubscribed ? (
                    <MailCheck className="h-4 w-4 text-green-500" />
                  ) : (
                    <MailX className="h-4 w-4 text-red-500" />
                  )}
                  <Label className="text-white font-semibold">
                    {info.title}
                  </Label>
                </div>
                <p className="text-sm text-gray-400">{info.description}</p>
              </div>

              <Button
                size="sm"
                onClick={() => handleToggle(type, isSubscribed)}
                disabled={isUpdating}
                className={
                  isSubscribed
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                }
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : isSubscribed ? (
                  "Unsubscribe"
                ) : (
                  "Subscribe"
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Current email:{" "}
          <span className="text-gray-400">{preferences.email}</span>
        </p>
      </div>
    </div>
  );
}
