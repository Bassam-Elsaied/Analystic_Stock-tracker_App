"use client";

import React, { useState, useMemo } from "react";
import { Label } from "../ui/label";
import { Controller } from "react-hook-form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import countryList from "react-select-country-list";
import * as flags from "country-flag-icons/react/3x2";

function CountrySelectField({
  name,
  label,
  control,
  error,
  required,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const countries = useMemo(() => countryList().getData(), []);

  // Helper function to get flag component
  const getFlagComponent = (countryCode: string) => {
    const code = countryCode.toUpperCase();
    const FlagComponent = (
      flags as Record<string, React.ComponentType<{ className?: string }>>
    )[code];

    if (FlagComponent) {
      return <FlagComponent className="w-6 h-4 rounded-sm" />;
    }
    // Fallback to emoji if SVG flag doesn't exist
    const codePoints = code
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return (
      <span className="text-xl">{String.fromCodePoint(...codePoints)}</span>
    );
  };

  // Helper function to get selected country display
  const getSelectedCountryDisplay = (value: string) => {
    const country = countries.find((c) => c.value === value);
    if (!country) return "Select your country";
    return (
      <span className="flex items-center gap-2">
        {getFlagComponent(country.value)}
        <span>{country.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="form-label">
        {label}
      </Label>
      <Controller
        control={control}
        name={name}
        rules={{
          required: required ? `Please select ${label.toLowerCase()}` : false,
        }}
        render={({ field }) => (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between select-trigger"
              >
                {getSelectedCountryDisplay(field.value)}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-gray-800 border-gray-600">
              <Command className="bg-gray-800">
                <CommandInput placeholder="Search country..." className="h-9" />
                <CommandList className="[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-gray-800 hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {countries.map((country) => (
                      <CommandItem
                        key={country.value}
                        value={country.label}
                        onSelect={() => {
                          field.onChange(country.value);
                          setOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            field.value === country.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span className="flex items-center gap-2">
                          {getFlagComponent(country.value)}
                          <span>{country.label}</span>
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  );
}

export default CountrySelectField;
