"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { createAlert, updateAlert } from "@/lib/actions/alert.actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHECK_FREQUENCY_OPTIONS } from "@/lib/data";

export default function AlertModal({
  alertId,
  alertData,
  action = "create",
  open,
  setOpen,
}: AlertModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AlertData>({
    defaultValues: {
      symbol: alertData?.symbol || "",
      company: alertData?.company || "",
      alertName: alertData?.alertName || "",
      alertType: alertData?.alertType || "upper",
      threshold: alertData?.threshold || "",
      checkFrequency: alertData?.checkFrequency || "hourly",
    },
  });

  const alertType = watch("alertType");
  const checkFrequency = watch("checkFrequency");

  useEffect(() => {
    if (alertData && action === "update") {
      setValue("symbol", alertData.symbol);
      setValue("company", alertData.company);
      setValue("alertName", alertData.alertName);
      setValue("alertType", alertData.alertType);
      setValue("threshold", alertData.threshold);
      setValue("checkFrequency", alertData.checkFrequency || "hourly");
    }
  }, [alertData, action, setValue]);

  const onSubmit = async (data: AlertData) => {
    setIsLoading(true);
    try {
      const result =
        action === "update" && alertId
          ? await updateAlert(alertId, data)
          : await createAlert(data);

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        reset();
      } else {
        toast.error(result.message || "Something went wrong");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error("Error with alert:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="alert-dialog">
        <DialogHeader>
          <DialogTitle className="alert-title">
            {action === "update" ? "Update Alert" : "Create New Alert"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alertName" className="form-label">
              Alert Name
            </Label>
            <Input
              id="alertName"
              placeholder="e.g., AAPL Price Alert"
              className="form-input"
              {...register("alertName", { required: "Alert name is required" })}
            />
            {errors.alertName && (
              <p className="text-sm text-red-500">{errors.alertName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol" className="form-label">
              Stock Symbol
            </Label>
            <Input
              id="symbol"
              placeholder="e.g., AAPL"
              className="form-input"
              {...register("symbol", {
                required: "Stock symbol is required",
                pattern: {
                  value: /^[A-Z]+$/i,
                  message: "Only letters are allowed",
                },
              })}
            />
            {errors.symbol && (
              <p className="text-sm text-red-500">{errors.symbol.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="form-label">
              Company Name
            </Label>
            <Input
              id="company"
              placeholder="e.g., Apple Inc."
              className="form-input"
              {...register("company", { required: "Company name is required" })}
            />
            {errors.company && (
              <p className="text-sm text-red-500">{errors.company.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="alertType" className="form-label">
              Alert Type
            </Label>
            <Select
              value={alertType}
              onValueChange={(value) =>
                setValue("alertType", value as "upper" | "lower")
              }
            >
              <SelectTrigger className="select-trigger">
                <SelectValue placeholder="Select alert type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem
                  value="upper"
                  className="text-white hover:bg-gray-600 cursor-pointer"
                >
                  Upper (Price Above)
                </SelectItem>
                <SelectItem
                  value="lower"
                  className="text-white hover:bg-gray-600 cursor-pointer"
                >
                  Lower (Price Below)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold" className="form-label">
              Price Threshold ($)
            </Label>
            <Input
              id="threshold"
              type="number"
              step="0.01"
              placeholder="e.g., 150.00"
              className="form-input"
              {...register("threshold", {
                required: "Threshold is required",
                min: { value: 0.01, message: "Must be greater than 0" },
              })}
            />
            {errors.threshold && (
              <p className="text-sm text-red-500">{errors.threshold.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkFrequency" className="form-label">
              Check Frequency
            </Label>
            <Select
              value={checkFrequency}
              onValueChange={(value) =>
                setValue(
                  "checkFrequency",
                  value as "15min" | "30min" | "hourly" | "daily"
                )
              }
            >
              <SelectTrigger className="select-trigger">
                <SelectValue placeholder="Select check frequency" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {CHECK_FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-white hover:bg-gray-600 cursor-pointer"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              How often to check if the price has reached your threshold
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 yellow-btn"
              disabled={isLoading}
            >
              {isLoading
                ? "Saving..."
                : action === "update"
                ? "Update Alert"
                : "Create Alert"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
