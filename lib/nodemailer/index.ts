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
  intro: string
) => {
  const mailOptions = {
    from: `"Signalist" <signalist@gmail.com>`,
    to: email,
    subject: "Welcome to Signalist",
    html: WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name).replace(
      "{{intro}}",
      intro
    ),
  };

  await transporter.sendMail(mailOptions);
};

export const sendNewsSummaryEmail = async ({
  email,
  date,
  newsContent,
}: {
  email: string;
  date: string;
  newsContent: string;
}): Promise<void> => {
  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace(
    "{{date}}",
    date
  ).replace("{{newsContent}}", newsContent);

  const mailOptions = {
    from: `"Signalist News" <signalist@gmail.com>`,
    to: email,
    subject: `📈 Market News Summary Today - ${date}`,
    text: `Today's market news summary from Signalist`,
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
}: {
  email: string;
  symbol: string;
  company: string;
  alertType: "upper" | "lower";
  currentPrice: number;
  threshold: number;
  timestamp: string;
}): Promise<void> => {
  const template =
    alertType === "upper"
      ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE
      : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;

  const htmlTemplate = template
    .replace(/{{symbol}}/g, symbol)
    .replace(/{{company}}/g, company)
    .replace(/{{currentPrice}}/g, `$${currentPrice.toFixed(2)}`)
    .replace(/{{targetPrice}}/g, `$${threshold.toFixed(2)}`)
    .replace(/{{timestamp}}/g, timestamp);

  const emoji = alertType === "upper" ? "📈" : "📉";
  const actionText = alertType === "upper" ? "Above" : "Below";

  const mailOptions = {
    from: `"Signalist Alerts" <signalist@gmail.com>`,
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
