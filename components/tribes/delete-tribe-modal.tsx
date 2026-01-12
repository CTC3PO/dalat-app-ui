"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface DeleteTribeModalProps {
  tribeSlug: string;
  tribeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTribeModal({ tribeSlug, tribeName, open, onOpenChange }: DeleteTribeModalProps) {
  const router = useRouter();
  const t = useTranslations("tribes");
  const [isPending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmation.toLowerCase() === tribeName.toLowerCase();

  async function handleDelete() {
    if (!canDelete) return;

    setError(null);

    startTransition(async () => {
      const res = await fetch(`/api/tribes/${tribeSlug}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete tribe");
        return;
      }

      router.push("/");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            {t("deleteTribe")}
          </DialogTitle>
          <DialogDescription>
            {t("deleteConfirm")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Type <strong>{tribeName}</strong> to confirm deletion.
          </p>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={tribeName}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-3 py-2">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || isPending}
            className="px-3 py-2"
          >
            {isPending ? "Deleting..." : "Delete Tribe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
