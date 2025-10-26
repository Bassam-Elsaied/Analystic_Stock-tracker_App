import { inngest } from "@/lib/inngest/client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "@/lib/inngest/prompts";
import {
  sendNewsSummaryEmail,
  sendWelcomeEmail,
  sendPriceAlertEmail,
} from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user-action";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import { connectToDatabase } from "@/database/mongoose";
import { Alert } from "@/database/models/alert.model";
import { checkEmailSubscription } from "@/lib/actions/email-preferences.actions";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining analystic. You now have the tools to track markets and make smarter moves.";

      const {
        data: { userId, email, name },
      } = event;

      // Check if user is subscribed to welcome emails
      const isSubscribed = await checkEmailSubscription(
        userId,
        "welcomeEmails"
      );

      if (!isSubscribed) {
        console.log(`User ${email} is unsubscribed from welcome emails`);
        return {
          skipped: true,
          reason: "User unsubscribed from welcome emails",
        };
      }

      return await sendWelcomeEmail(email, name, introText, userId);
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  }
);

export const checkPriceAlerts = inngest.createFunction(
  { id: "check-price-alerts" },
  [{ event: "app/check.price.alerts" }, { cron: "*/15 * * * *" }], // Every 15 minutes
  async ({ step }) => {
    // Step #1: Get all active alerts
    const alerts = await step.run("get-active-alerts", async () => {
      await connectToDatabase();
      return await Alert.find({ isActive: true }).lean();
    });

    if (!alerts || alerts.length === 0) {
      return { success: false, message: "No active alerts found" };
    }

    type AlertDocument = {
      _id: unknown;
      userId: string;
      symbol: string;
      company: string;
      alertType: "upper" | "lower";
      threshold: number;
      isActive: boolean;
      checkFrequency: "15min" | "30min" | "hourly" | "daily";
      lastChecked?: Date;
    };

    // Helper function to check if alert should be checked based on frequency
    const shouldCheckAlert = (alert: AlertDocument): boolean => {
      if (!alert.lastChecked) return true; // First time check

      const now = new Date();
      const lastChecked = new Date(alert.lastChecked);
      const minutesSinceLastCheck =
        (now.getTime() - lastChecked.getTime()) / (1000 * 60);

      switch (alert.checkFrequency) {
        case "15min":
          return minutesSinceLastCheck >= 15;
        case "30min":
          return minutesSinceLastCheck >= 30;
        case "hourly":
          return minutesSinceLastCheck >= 60;
        case "daily":
          return minutesSinceLastCheck >= 1440; // 24 hours
        default:
          return false;
      }
    };

    // Step #2: Filter alerts that need to be checked now
    const alertsToCheck = (alerts as AlertDocument[]).filter((alert) =>
      shouldCheckAlert(alert)
    );

    if (alertsToCheck.length === 0) {
      return {
        success: true,
        message: "No alerts need checking at this time",
        checked: 0,
      };
    }

    // Step #3: Group alerts by symbol to minimize API calls
    const symbolsMap = new Map<string, AlertDocument[]>();
    alertsToCheck.forEach((alert) => {
      const existing = symbolsMap.get(alert.symbol) || [];
      symbolsMap.set(alert.symbol, [...existing, alert]);
    });

    const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!FINNHUB_API_KEY) {
      return { success: false, message: "Finnhub API key not configured" };
    }

    // Step #4: Check prices and trigger alerts
    const triggeredAlerts = await step.run("check-prices", async () => {
      const triggered: Array<{
        alert: AlertDocument;
        currentPrice: number;
        userEmail: string;
      }> = [];

      await connectToDatabase();
      const mongoose = await connectToDatabase();
      const db = mongoose.connection.db;

      for (const [symbol, symbolAlerts] of symbolsMap.entries()) {
        try {
          // Fetch current price
          const quoteRes = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
          );
          const quoteData = await quoteRes.json();
          const currentPrice = quoteData.c;

          if (!currentPrice) continue;

          // Check each alert for this symbol
          for (const alert of symbolAlerts) {
            // Update lastChecked for this alert
            await Alert.findByIdAndUpdate(alert._id, {
              lastChecked: new Date(),
            });

            const shouldTrigger =
              alert.alertType === "upper"
                ? currentPrice >= alert.threshold
                : currentPrice <= alert.threshold;

            if (shouldTrigger) {
              // Get user email
              const user = await db
                ?.collection("user")
                .findOne<{ email?: string }>({ id: alert.userId });

              if (user?.email) {
                // Check if user is subscribed to price alerts
                const isSubscribed = await checkEmailSubscription(
                  alert.userId,
                  "priceAlerts"
                );

                if (isSubscribed) {
                  triggered.push({
                    alert,
                    currentPrice,
                    userEmail: user.email,
                  });

                  // Update alert status
                  await Alert.findByIdAndUpdate(alert._id, {
                    lastTriggered: new Date(),
                    isActive: false, // Deactivate after triggering once
                  });
                } else {
                  console.log(
                    `User ${alert.userId} is unsubscribed from price alerts`
                  );
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error checking alerts for ${symbol}:`, error);
        }
      }

      return triggered;
    });

    // Step #5: Send alert emails
    await step.run("send-alert-emails", async () => {
      await Promise.all(
        triggeredAlerts.map(async ({ alert, currentPrice, userEmail }) => {
          try {
            await sendPriceAlertEmail({
              email: userEmail,
              symbol: alert.symbol,
              company: alert.company,
              alertType: alert.alertType,
              currentPrice,
              threshold: alert.threshold,
              timestamp: new Date().toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              }),
              userId: alert.userId,
            });
          } catch (error) {
            console.error(
              `Error sending alert email for ${alert.symbol}:`,
              error
            );
          }
        })
      );
    });

    return {
      success: true,
      message: `Checked ${alertsToCheck.length} alerts, triggered ${triggeredAlerts.length}`,
      checked: alertsToCheck.length,
      triggered: triggeredAlerts.length,
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
  async ({ step }) => {
    // Step #1: Get all users for news delivery
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);

    if (!users || users.length === 0)
      return { success: false, message: "No users found for news email" };

    // Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
    const results = await step.run("fetch-user-news", async () => {
      const perUser: Array<{
        user: User;
        articles: MarketNewsArticle[];
      }> = [];
      for (const user of users as User[]) {
        try {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          let articles = await getNews(symbols);
          // Enforce max 6 articles per user
          articles = (articles || []).slice(0, 6);
          // If still empty, fallback to general
          if (!articles || articles.length === 0) {
            articles = await getNews();
            articles = (articles || []).slice(0, 6);
          }
          perUser.push({ user, articles });
        } catch (e) {
          console.error("daily-news: error preparing user news", user.email, e);
          perUser.push({ user, articles: [] });
        }
      }
      return perUser;
    });

    // Step #3: (placeholder) Summarize news via AI
    const userNewsSummaries: {
      user: User;
      newsContent: string | null;
    }[] = [];

    for (const { user, articles } of results) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(articles, null, 2)
        );

        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
          body: {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          (part && "text" in part ? part.text : null) || "No market news.";

        userNewsSummaries.push({ user, newsContent });
      } catch (error) {
        console.error("Failed to summarize news for : ", user.email, error);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    // Step #4: (placeholder) Send the emails
    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          // Check if user is subscribed to news emails
          const isSubscribed = await checkEmailSubscription(
            user.id,
            "newsEmails"
          );

          if (!isSubscribed) {
            console.log(`User ${user.email} is unsubscribed from news emails`);
            return false;
          }

          return await sendNewsSummaryEmail({
            email: user.email,
            date: getFormattedTodayDate(),
            newsContent,
            userId: user.id,
          });
        })
      );
    });

    return {
      success: true,
      message: "Daily news summary emails sent successfully",
    };
  }
);
