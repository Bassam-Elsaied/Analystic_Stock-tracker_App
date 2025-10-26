"use client";

import { Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { toast } from "sonner";
import { WATCHLIST_TABLE_HEADER } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import AlertModal from "./AlertModal";

export default function WatchlistTable({ watchlist }: WatchlistTableProps) {
  const [stocks, setStocks] = useState<StockWithData[]>(watchlist);
  const [deletingSymbol, setDeletingSymbol] = useState<string | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{
    symbol: string;
    company: string;
    currentPrice?: number;
  } | null>(null);

  const handleRemove = async (symbol: string) => {
    setDeletingSymbol(symbol);
    try {
      const result = await removeFromWatchlist(symbol);
      if (result.success) {
        setStocks((prev) => prev.filter((s) => s.symbol !== symbol));
        toast.success(`${symbol} removed from watchlist`);
      } else {
        toast.error(result.message || "Failed to remove from watchlist");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error("Error removing from watchlist:", error);
    } finally {
      setDeletingSymbol(null);
    }
  };

  const handleAddAlert = (stock: StockWithData) => {
    setSelectedStock({
      symbol: stock.symbol,
      company: stock.company,
      currentPrice: stock.currentPrice,
    });
    setIsAlertModalOpen(true);
  };

  if (stocks.length === 0) {
    return (
      <div className="watchlist-empty-container">
        <div className="watchlist-empty">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="watchlist-star"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
          <h2 className="empty-title">Your Watchlist is Empty</h2>
          <p className="empty-description">
            Start building your watchlist by searching for stocks and adding
            them to track their performance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-table">
      <Table>
        <TableHeader>
          <TableRow className="table-header-row">
            {WATCHLIST_TABLE_HEADER.map((header) => (
              <TableHead key={header} className="table-header">
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock) => (
            <TableRow key={stock.symbol} className="table-row">
              <TableCell className="table-cell">{stock.company}</TableCell>
              <TableCell className="table-cell">
                <Link
                  href={`/stocks/${stock.symbol}`}
                  className="text-yellow-500 hover:text-yellow-400"
                >
                  {stock.symbol}
                </Link>
              </TableCell>
              <TableCell className="table-cell">
                {stock.priceFormatted || "N/A"}
              </TableCell>
              <TableCell
                className={`table-cell ${
                  stock.changePercent
                    ? stock.changePercent > 0
                      ? "text-green-500"
                      : "text-red-500"
                    : ""
                }`}
              >
                {stock.changeFormatted || "N/A"}
              </TableCell>
              <TableCell className="table-cell">
                {stock.marketCap || "N/A"}
              </TableCell>
              <TableCell className="table-cell">
                {stock.peRatio || "N/A"}
              </TableCell>
              <TableCell className="table-cell">
                <button
                  onClick={() => handleAddAlert(stock)}
                  className="add-alert"
                >
                  <Plus className="h-4 w-4" />
                  <span>Alert</span>
                </button>
              </TableCell>
              <TableCell className="table-cell">
                <button
                  onClick={() => handleRemove(stock.symbol)}
                  disabled={deletingSymbol === stock.symbol}
                  className="p-2 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
                  aria-label={`Remove ${stock.symbol} from watchlist`}
                >
                  <Trash2 className="trash-icon" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Alert Modal */}
      {selectedStock && (
        <AlertModal
          alertData={{
            symbol: selectedStock.symbol,
            company: selectedStock.company,
            alertName: `${selectedStock.symbol} Price Alert`,
            alertType: "upper",
            threshold: selectedStock.currentPrice?.toFixed(2) || "",
            checkFrequency: "hourly",
          }}
          action="create"
          open={isAlertModalOpen}
          setOpen={setIsAlertModalOpen}
        />
      )}
    </div>
  );
}
