import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/better-auth/auth";

export const GET = async (request: Request) => {
  const authInstance = await auth;
  const handlers = toNextJsHandler(authInstance);
  return handlers.GET(request);
};

export const POST = async (request: Request) => {
  const authInstance = await auth;
  const handlers = toNextJsHandler(authInstance);
  return handlers.POST(request);
};
