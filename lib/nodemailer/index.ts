import nodemailer from "nodemailer";
import { WELCOME_EMAIL_TEMPLATE } from "./templates";

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
