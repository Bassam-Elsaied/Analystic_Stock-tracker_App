"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, RotateCw } from "lucide-react";
import { deleteAlert, reactivateAlert } from "@/lib/actions/alert.actions";
import { toast } from "sonner";
import AlertModal from "./AlertModal";

export default function AlertsList({ alertData }: AlertsListProps) {
  const [alerts, setAlerts] = useState<Alert[]>(alertData || []);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<{
    id: string;
    data: AlertData;
  } | null>(null);

  const handleDelete = async (alertId: string) => {
    setDeletingId(alertId);
    try {
      const result = await deleteAlert(alertId);
      if (result.success) {
        setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
        toast.success("Alert deleted successfully");
      } else {
        toast.error(result.message || "Failed to delete alert");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error("Error deleting alert:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (alert: Alert) => {
    setEditingAlert({
      id: alert.id,
      data: {
        symbol: alert.symbol,
        company: alert.company,
        alertName: alert.alertName,
        alertType: alert.alertType,
        threshold: alert.threshold.toString(),
        checkFrequency: alert.checkFrequency,
      },
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingAlert(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAlert(null);
  };

  const handleReactivate = async (alertId: string) => {
    setReactivatingId(alertId);
    try {
      const result = await reactivateAlert(alertId);
      if (result.success) {
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId
              ? { ...alert, isActive: true, lastTriggered: undefined }
              : alert
          )
        );
        toast.success("Alert reactivated successfully");
      } else {
        toast.error(result.message || "Failed to reactivate alert");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error("Error reactivating alert:", error);
    } finally {
      setReactivatingId(null);
    }
  };

  const getPriceColor = (
    alertType: "upper" | "lower",
    currentPrice: number,
    threshold: number
  ) => {
    if (alertType === "upper" && currentPrice >= threshold) {
      return "text-green-500";
    } else if (alertType === "lower" && currentPrice <= threshold) {
      return "text-red-500";
    }
    return "text-gray-100";
  };

  return (
    <div className="watchlist-alerts flex">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-100">
            My Alerts
          </h2>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Alert</span>
          </button>
        </div>
        <div className="alert-list">
          {alerts.length === 0 ? (
            <div className="alert-empty">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/30 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                  </svg>
                </div>
                <p className="text-base text-gray-400 font-medium mb-2">
                  No alerts yet
                </p>
                <p className="text-sm text-gray-500">
                  Create your first alert to get notified
                </p>
              </div>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="alert-item group">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-100">
                        {alert.symbol}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          alert.isActive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-600/30 text-gray-400"
                        }`}
                      >
                        {alert.isActive ? "Active" : "Triggered"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{alert.company}</p>
                  </div>
                </div>

                {/* Price Info */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-600">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Current Price</p>
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-2xl font-bold ${getPriceColor(
                          alert.alertType,
                          alert.currentPrice,
                          alert.threshold
                        )}`}
                      >
                        ${alert.currentPrice.toFixed(2)}
                      </span>
                      {alert.changePercent !== undefined && (
                        <span
                          className={`text-sm font-medium ${
                            alert.changePercent >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {alert.changePercent >= 0 ? "+" : ""}
                          {alert.changePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">
                      {alert.alertType === "upper" ? "Above" : "Below"}
                    </p>
                    <span className="text-lg font-semibold text-gray-300">
                      ${alert.threshold.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Alert Name */}
                <div className="mb-3">
                  <p className="text-sm text-gray-400">
                    <span className="text-gray-500">Alert: </span>
                    {alert.alertName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="text-yellow-600">Checks: </span>
                    {(() => {
                      const frequency = alert.checkFrequency || "hourly";
                      switch (frequency) {
                        case "15min":
                          return "Every 15 minutes";
                        case "30min":
                          return "Every 30 minutes";
                        case "hourly":
                          return "Every hour";
                        case "daily":
                          return "Once daily";
                        default:
                          return "Every hour";
                      }
                    })()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1">
                    {!alert.isActive && (
                      <button
                        onClick={() => handleReactivate(alert.id)}
                        disabled={reactivatingId === alert.id}
                        className="p-2 rounded-lg bg-gray-700/50 hover:bg-green-500/20 text-gray-400 hover:text-green-400 transition-all"
                        aria-label="Reactivate alert"
                        title="Reactivate alert"
                      >
                        <RotateCw
                          className={`h-4 w-4 ${
                            reactivatingId === alert.id ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(alert)}
                      className="p-2 rounded-lg bg-gray-700/50 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-all"
                      aria-label="Edit alert"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      disabled={deletingId === alert.id}
                      className="p-2 rounded-lg bg-gray-700/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all disabled:opacity-50"
                      aria-label="Delete alert"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {alert.alertType === "upper" ? "📈" : "📉"}{" "}
                    {alert.alertType.charAt(0).toUpperCase() +
                      alert.alertType.slice(1)}{" "}
                    Alert
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        alertId={editingAlert?.id}
        alertData={editingAlert?.data}
        action={editingAlert ? "update" : "create"}
        open={isModalOpen}
        setOpen={handleCloseModal}
      />
    </div>
  );
}
