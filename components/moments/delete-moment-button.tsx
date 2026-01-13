"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { triggerHaptic } from "@/lib/haptics";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DeleteMomentButtonProps {
  momentId: string;
  eventSlug: string;
  isOwner: boolean;
  canModerate: boolean; // true if user is event creator, admin, or moderator
}

export function DeleteMomentButton({
  momentId,
  eventSlug,
  isOwner,
  canModerate,
}: DeleteMomentButtonProps) {
  const router = useRouter();
  const t = useTranslations("moments");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    triggerHaptic("selection");

    startTransition(async () => {
      const supabase = createClient();

      // Use delete_own_moment for owners, remove_moment for moderators
      const rpcName = isOwner ? "delete_own_moment" : "remove_moment";
      const params = isOwner
        ? { p_moment_id: momentId }
        : { p_moment_id: momentId, p_reason: "Removed by moderator" };

      const { data, error: rpcError } = await supabase.rpc(rpcName, params);

      if (rpcError) {
        console.error("Delete moment error:", rpcError);
        setError(t("deleteError"));
        return;
      }

      if (!data?.ok) {
        setError(t("deleteError"));
        return;
      }

      triggerHaptic("medium");
      setOpen(false);
      router.push(`/events/${eventSlug}/moments`);
      router.refresh();
    });
  }

  // Only show if user can delete
  if (!isOwner && !canModerate) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          triggerHaptic("selection");
          setOpen(true);
        }}
        className="text-muted-foreground hover:text-destructive px-3 py-2"
      >
        <Trash2 className="w-4 h-4" />
        <span className="ml-2">{t("delete")}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t("deleteTitle")}
            </DialogTitle>
            <DialogDescription>{t("deleteConfirm")}</DialogDescription>
          </DialogHeader>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="px-3 py-2"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="px-3 py-2"
            >
              {isPending ? t("deleting") : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
