"use server";

import { headers } from "next/headers";
import { auth } from "../better-auth/auth";
import { inngest } from "../inngest/client";

export const signUpWithEmail = async (data: SignUpFormData) => {
  try {
    const authInstance = await auth;
    const respone = await authInstance.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.fullName,
      },
    });
    if (respone) {
      await inngest.send({
        name: "app/user.created",
        data: {
          email: data.email,
          name: data.fullName,
          country: data.country,
          investmentGoals: data.investmentGoals,
          riskTolerance: data.riskTolerance,
          preferredIndustry: data.preferredIndustry,
        },
      });
    }
    return {
      success: true,
      message: "Sign up with email successful",
      data: respone,
    };
  } catch (error) {
    console.log(`Error signing up with email`);
    return {
      success: false,
      message: `Error signing up with email`,
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
    const authInstance = await auth;
    const respone = await authInstance.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
      },
    });
    return {
      success: true,
      message: "Sign in with email successful",
      data: respone,
    };
  } catch (error) {
    console.log(`Error signing in with email: ${error}`);
    return {
      success: false,
      message: `Error signing in with email`,
    };
  }
};
