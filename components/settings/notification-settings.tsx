"use client";

import { Bell, BellOff, BellRing, Loader2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePushNotifications } from "@/lib/hooks/use-push-notifications";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

export function NotificationSettings() {
  const t = useTranslations("notifications");
  const {
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    isSupported,
  } = usePushNotifications();

  const handleToggle = async () => {
    triggerHaptic("selection");
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 text-muted-foreground">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium">{t("unavailable")}</p>
          <p className="text-xs">
            {t("unavailableDescription")}
          </p>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
        <BellOff className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium">{t("blocked")}</p>
          <p className="text-xs opacity-80">
            {t("blockedDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200",
          isSubscribed
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : isSubscribed ? (
            <BellRing className="w-5 h-5 text-primary" />
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground" />
          )}
          <div className="text-left">
            <p className={cn("text-sm font-medium", isSubscribed ? "text-primary" : "text-foreground")}>
              {isSubscribed ? t("enabled") : t("enable")}
            </p>
            <p className="text-xs text-muted-foreground">
              {isSubscribed
                ? t("enabledDescription")
                : t("disabledDescription")}
            </p>
          </div>
        </div>
        <div
          className={cn(
            "w-11 h-6 rounded-full transition-colors relative",
            isSubscribed ? "bg-primary" : "bg-muted"
          )}
        >
          <div
            className={cn(
              "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
              isSubscribed ? "translate-x-6" : "translate-x-1"
            )}
          />
        </div>
      </button>

      {isSubscribed && (
        <p className="text-xs text-muted-foreground px-1">
          {t("detailedInfo")}
        </p>
      )}
    </div>
  );
}
