import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

function InputFields({
  name,
  label,
  placeholder,
  type = "text",
  register,
  error,
  validation,
  disabled,
  value,
}: FormInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="form-label">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name, validation)}
        className={cn("form-input", {
          "opacity-50 cursor-not-allowed": disabled,
        })}
      />
      {error && <p className="text-red-500">{error.message}</p>}
    </div>
  );
}

export default InputFields;
