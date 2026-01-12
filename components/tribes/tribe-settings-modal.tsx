"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DeleteTribeModal } from "./delete-tribe-modal";
import type { Tribe, TribeAccessType } from "@/lib/types";

interface TribeSettingsModalProps {
  tribe: Tribe;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TribeSettingsModal({ tribe, open, onOpenChange }: TribeSettingsModalProps) {
  const router = useRouter();
  const t = useTranslations("tribes");
  const [isPending, startTransition] = useTransition();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState(tribe.name);
  const [description, setDescription] = useState(tribe.description || "");
  const [accessType, setAccessType] = useState<TribeAccessType>(tribe.access_type);
  const [isListed, setIsListed] = useState(tribe.is_listed);
  const [inviteCode, setInviteCode] = useState(tribe.invite_code);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);

    startTransition(async () => {
      const res = await fetch(`/api/tribes/${tribe.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          access_type: accessType,
          is_listed: isListed,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      router.refresh();
      onOpenChange(false);
    });
  }

  async function handleRegenerateCode() {
    startTransition(async () => {
      const res = await fetch(`/api/tribes/${tribe.slug}/invite-code`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setInviteCode(data.invite_code);
      }
    });
  }

  function handleCopyCode() {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const inviteUrl = inviteCode ? `${window.location.origin}/tribes/join/${inviteCode}` : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tribe-name">Name</Label>
              <Input
                id="tribe-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tribe-description">Description</Label>
              <Textarea
                id="tribe-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("accessType")}</Label>
              <Select value={accessType} onValueChange={(v) => setAccessType(v as TribeAccessType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t("public")}</SelectItem>
                  <SelectItem value="request">{t("request")}</SelectItem>
                  <SelectItem value="invite_only">{t("inviteOnly")}</SelectItem>
                  <SelectItem value="secret">{t("secret")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {accessType !== "secret" && (
              <div className="flex items-center justify-between">
                <Label htmlFor="tribe-listed">Show in search</Label>
                <Switch
                  id="tribe-listed"
                  checked={isListed}
                  onCheckedChange={setIsListed}
                />
              </div>
            )}

            {(accessType === "invite_only" || accessType === "secret") && inviteCode && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <Label>{t("inviteCode")}</Label>
                <div className="flex gap-2">
                  <Input value={inviteCode} readOnly className="font-mono" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                    className="shrink-0 p-2"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRegenerateCode}
                    disabled={isPending}
                    className="shrink-0 p-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                {copied && <p className="text-sm text-green-600">{t("codeCopied")}</p>}
                {inviteUrl && (
                  <p className="text-xs text-muted-foreground break-all">
                    Share link: {inviteUrl}
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
              className="sm:mr-auto px-3 py-2"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t("deleteTribe")}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="px-3 py-2">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending} className="px-3 py-2">
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteTribeModal
        tribeSlug={tribe.slug}
        tribeName={tribe.name}
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
      />
    </>
  );
}
