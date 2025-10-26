"use client";

import { useState } from "react";
import { Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/actions/watchlist.actions";

export default function WatchlistButton({
  symbol,
  company,
  isInWatchlist: initialIsInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleWatchlist = async () => {
    setIsLoading(true);
    try {
      if (isInWatchlist) {
        const result = await removeFromWatchlist(symbol);
        if (result.success) {
          setIsInWatchlist(false);
          toast.success(`${symbol} removed from watchlist`);
          onWatchlistChange?.(symbol, false);
        } else {
          toast.error(result.message || "Failed to remove from watchlist");
        }
      } else {
        const result = await addToWatchlist(symbol, company);
        if (result.success) {
          setIsInWatchlist(true);
          toast.success(`${symbol} added to watchlist`);
          onWatchlistChange?.(symbol, true);
        } else {
          toast.error(result.message || "Failed to add to watchlist");
        }
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error("Error toggling watchlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (type === "icon") {
    return (
      <button
        onClick={handleToggleWatchlist}
        disabled={isLoading}
        className="p-2 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
        aria-label={
          isInWatchlist ? "Remove from watchlist" : "Add to watchlist"
        }
      >
        {isInWatchlist ? (
          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ) : (
          <StarOff className="w-5 h-5 text-gray-400" />
        )}
      </button>
    );
  }

  return (
    <Button
      onClick={handleToggleWatchlist}
      disabled={isLoading}
      variant={isInWatchlist ? "outline" : "default"}
      className="w-full"
    >
      {isInWatchlist ? (
        <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
      ) : (
        <StarOff className="w-4 h-4 mr-2 text-gray-400" />
      )}
      {isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
    </Button>
  );
}
