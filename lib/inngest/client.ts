import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "market-app",
  ai: { gemini: { apiKey: process.env.GEMIN_API_KEY! } },
});
