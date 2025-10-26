"use client";

import FooterLink from "@/components/forms/FooterLink";
import InputFields from "@/components/forms/InputFields";
import { Button } from "@/components/ui/button";
import { signInWithEmail } from "@/lib/actions/auth-action";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function SignIn() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignInFormData) => {
    const response = await signInWithEmail(data);
    if (response.success) {
      toast.success(response.message);
      // Refresh the router to update session state
      router.refresh();
      // Small delay to ensure session is updated
      setTimeout(() => {
        router.push("/");
      }, 100);
    } else {
      toast.error(response.message);
    }
  };

  return (
    <>
      <h1 className="form-title">Log in to your account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputFields
          name="email"
          label="Email"
          placeholder="Contact@Beso.com"
          register={register}
          error={errors.email}
          validation={{
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Invalid email address",
            },
          }}
          type="email"
        />
        <InputFields
          name="password"
          label="Password"
          placeholder="********"
          register={register}
          error={errors.password}
          validation={{
            required: "Password is required",
          }}
          type="password"
        />
        <Button type="submit" className="yellow-btn w-full mt-5">
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>
        <FooterLink
          text="Don't have an account?"
          href="/sign-up"
          linkText="Sign Up"
        />
      </form>
    </>
  );
}

export default SignIn;
