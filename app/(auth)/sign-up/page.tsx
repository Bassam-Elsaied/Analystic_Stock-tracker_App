"use client";

import InputFields from "@/components/forms/InputFields";
import SelectField from "@/components/forms/SelectField";
import CountrySelectField from "@/components/forms/CountrySelectField";
import { Button } from "@/components/ui/button";
import {
  INVESTMENT_GOALS,
  PREFERRED_INDUSTRIES,
  RISK_TOLERANCE_OPTIONS,
} from "@/lib/data";
import { useForm } from "react-hook-form";
import FooterLink from "@/components/forms/FooterLink";
import { signUpWithEmail } from "@/lib/actions/auth-action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function SignUp() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      country: "EG",
      investmentGoals: "Growth",
      riskTolerance: "Medium",
      preferredIndustry: "Technology",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const response = await signUpWithEmail(data);
      if (response.success) {
        toast.success(response.message);
        // Use window.location for full page reload to ensure cookies are properly set
        window.location.href = "/";
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Sign up with email failed");
    }
  };

  return (
    <>
      <h1 className="form-title">Sign Up & Personalize</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputFields
          name="fullName"
          label="Full Name"
          placeholder="Enter your full name"
          register={register}
          error={errors.fullName}
          validation={{ required: "Full Name is required" }}
          type="text"
        />
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
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters long",
            },
          }}
          type="password"
        />

        <CountrySelectField
          name="country"
          label="Country"
          control={control}
          error={errors.country}
          required
        />

        <SelectField
          name="investmentGoals"
          label="Investment Goals"
          placeholder="Select your investmentGoals"
          options={INVESTMENT_GOALS}
          control={control}
          error={errors.investmentGoals}
          required
        />
        <SelectField
          name="riskTolerance"
          label="Risk Tolerance"
          placeholder="Select your riskTolerance"
          options={RISK_TOLERANCE_OPTIONS}
          control={control}
          error={errors.riskTolerance}
          required
        />
        <SelectField
          name="preferredIndustry"
          label="Preferred Industry"
          placeholder="Select your preferredIndustry"
          options={PREFERRED_INDUSTRIES}
          control={control}
          error={errors.preferredIndustry}
          required
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="yellow-btn w-full mt-5"
        >
          {isSubmitting
            ? "Creating Account..."
            : "Start Your Investment Journey"}
        </Button>
        <FooterLink
          text="Already have an account?"
          href="/sign-in"
          linkText="Sign In"
        />
      </form>
    </>
  );
}

export default SignUp;
