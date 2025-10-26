"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteUserAccount } from "@/lib/actions/user-action";
import { signOut } from "@/lib/actions/auth-action";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface DeleteAccountDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  userEmail: string;
}

export default function DeleteAccountDialog({
  open,
  setOpen,
  userEmail,
}: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmValid = confirmText === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmValid) {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteUserAccount();

      if (result.success) {
        // Sign out the user
        await signOut();

        toast.success("Account deleted successfully");
        setOpen(false);

        // Force redirect to sign-in page
        window.location.href = "/sign-in";
      } else {
        toast.error(result.message || "Failed to delete account");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("An error occurred while deleting your account");
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmText("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-red-500 flex items-center gap-2">
            <Trash2 className="h-6 w-6" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-gray-400 pt-2">
            This action cannot be undone. This will permanently delete your
            account and remove all your data from our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-red-400 mb-2">
              The following data will be permanently deleted:
            </h4>
            <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
              <li>Your account ({userEmail})</li>
              <li>All your watchlist items</li>
              <li>All your price alerts</li>
              <li>All your sessions</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-gray-300">
              Type <span className="font-bold text-red-500">DELETE</span> to
              confirm
            </Label>
            <Input
              id="confirm"
              type="text"
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-red-500"
              disabled={isDeleting}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
