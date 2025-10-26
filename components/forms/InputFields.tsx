import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { FieldValues, Path } from "react-hook-form";

function InputFields<TFormValues extends FieldValues = FieldValues>({
  name,
  label,
  placeholder,
  type = "text",
  register,
  error,
  validation,
  disabled,
  value,
}: FormInputProps<TFormValues>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="form-label">
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name as Path<TFormValues>, validation)}
        className={cn("form-input", {
          "opacity-50 cursor-not-allowed": disabled,
        })}
      />
      {error && <p className="text-red-500">{error.message}</p>}
    </div>
  );
}

export default InputFields;
