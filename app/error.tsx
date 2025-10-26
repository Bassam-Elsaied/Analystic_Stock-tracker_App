"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          We apologize for the inconvenience. An error occurred while loading
          this page.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => reset()}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
          >
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}

