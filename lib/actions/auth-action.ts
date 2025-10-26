"use server";

import { headers } from "next/headers";
import { auth } from "../better-auth/auth";
import { inngest } from "../inngest/client";

export const signUpWithEmail = async (data: SignUpFormData) => {
  try {
    console.log("Starting sign up process for:", data.email);
    const authInstance = await auth;
    console.log("Auth instance obtained successfully");

    const response = await authInstance.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.fullName,
      },
    });

    console.log("Sign up response received:", response);

    if (response) {
      // Get userId from response
      const userId = (response as { user?: { id?: string } })?.user?.id || "";
      console.log("User ID:", userId);

      try {
        await inngest.send({
          name: "app/user.created",
          data: {
            userId,
            email: data.email,
            name: data.fullName,
            country: data.country,
            investmentGoals: data.investmentGoals,
            riskTolerance: data.riskTolerance,
            preferredIndustry: data.preferredIndustry,
          },
        });
        console.log("Inngest event sent successfully");
      } catch (inngestError) {
        console.error("Inngest error (non-critical):", inngestError);
        // Don't fail the signup if inngest fails
      }
    }

    return {
      success: true,
      message: "Sign up successful! Welcome aboard!",
      data: response,
    };
  } catch (error) {
    console.error("Error signing up with email:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));

    // Check if it's a database connection error
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("connect") || errorMessage.includes("database")) {
      return {
        success: false,
        message: "Unable to connect to database. Please try again later.",
      };
    }

    if (errorMessage.includes("duplicate") || errorMessage.includes("exists")) {
      return {
        success: false,
        message: "This email is already registered. Please sign in instead.",
      };
    }

    return {
      success: false,
      message: errorMessage || "Error signing up. Please try again.",
    };
  }
};

export const signOut = async () => {
  try {
    const authInstance = await auth;
    await authInstance.api.signOut({ headers: await headers() });
  } catch (error) {
    console.log(`Error signing out: ${error}`);
  }
};

export const signInWithEmail = async (data: SignInFormData) => {
  try {
    console.log("Starting sign in process for:", data.email);
    const authInstance = await auth;
    console.log("Auth instance obtained successfully");

    const response = await authInstance.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
      },
    });

    console.log("Sign in response received:", response);

    return {
      success: true,
      message: "Sign in successful! Welcome back!",
      data: response,
    };
  } catch (error) {
    console.error("Error signing in with email:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("connect") || errorMessage.includes("database")) {
      return {
        success: false,
        message: "Unable to connect to database. Please try again later.",
      };
    }

    if (
      errorMessage.includes("credentials") ||
      errorMessage.includes("Invalid")
    ) {
      return {
        success: false,
        message: "Invalid email or password. Please try again.",
      };
    }

    return {
      success: false,
      message: errorMessage || "Error signing in. Please try again.",
    };
  }
};
