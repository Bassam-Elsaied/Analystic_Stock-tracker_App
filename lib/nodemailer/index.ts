import nodemailer from "nodemailer";
import {
  NEWS_SUMMARY_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  STOCK_ALERT_UPPER_EMAIL_TEMPLATE,
  STOCK_ALERT_LOWER_EMAIL_TEMPLATE,
} from "./templates";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

export const sendWelcomeEmail = async (
  email: string,
  name: string,
  intro: string,
  userId?: string
) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const unsubscribeUrl = userId
    ? `${baseUrl}/unsubscribe?userId=${userId}&type=welcomeEmails`
    : `${baseUrl}/unsubscribe`;
  const dashboardUrl = `${baseUrl}`;

  const mailOptions = {
    from: `"analystic" <analystic@gmail.com>`,
    to: email,
    subject: "Welcome to analystic",
    html: WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name)
      .replace("{{intro}}", intro)
      .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl)
      .replace(/{{dashboardUrl}}/g, dashboardUrl),
  };

  await transporter.sendMail(mailOptions);
};

export const sendNewsSummaryEmail = async ({
  email,
  date,
  newsContent,
  userId,
}: {
  email: string;
  date: string;
  newsContent: string;
  userId?: string;
}): Promise<void> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const unsubscribeUrl = userId
    ? `${baseUrl}/unsubscribe?userId=${userId}&type=newsEmails`
    : `${baseUrl}/unsubscribe`;
  const dashboardUrl = `${baseUrl}`;

  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace("{{date}}", date)
    .replace("{{newsContent}}", newsContent)
    .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl)
    .replace(/{{dashboardUrl}}/g, dashboardUrl);

  const mailOptions = {
    from: `"analystic News" <analystic@gmail.com>`,
    to: email,
    subject: `📈 Market News Summary Today - ${date}`,
    text: `Today's market news summary from analystic`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPriceAlertEmail = async ({
  email,
  symbol,
  company,
  alertType,
  currentPrice,
  threshold,
  timestamp,
  userId,
}: {
  email: string;
  symbol: string;
  company: string;
  alertType: "upper" | "lower";
  currentPrice: number;
  threshold: number;
  timestamp: string;
  userId?: string;
}): Promise<void> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const unsubscribeUrl = userId
    ? `${baseUrl}/unsubscribe?userId=${userId}&type=priceAlerts`
    : `${baseUrl}/unsubscribe`;
  const dashboardUrl = `${baseUrl}`;

  const template =
    alertType === "upper"
      ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE
      : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;

  const htmlTemplate = template
    .replace(/{{symbol}}/g, symbol)
    .replace(/{{company}}/g, company)
    .replace(/{{currentPrice}}/g, `$${currentPrice.toFixed(2)}`)
    .replace(/{{targetPrice}}/g, `$${threshold.toFixed(2)}`)
    .replace(/{{timestamp}}/g, timestamp)
    .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl)
    .replace(/{{dashboardUrl}}/g, dashboardUrl);

  const emoji = alertType === "upper" ? "📈" : "📉";
  const actionText = alertType === "upper" ? "Above" : "Below";

  const mailOptions = {
    from: `"analystic Alerts" <analystic@gmail.com>`,
    to: email,
    subject: `${emoji} Price Alert: ${symbol} ${actionText} $${threshold.toFixed(
      2
    )}`,
    text: `${symbol} has reached your ${alertType} price threshold of $${threshold.toFixed(
      2
    )}. Current price: $${currentPrice.toFixed(2)}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};
