"use client";

import { useTranslations } from "next-intl";
import { Play, Pause, RotateCcw, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BulkUploadStats } from "@/lib/bulk-upload/types";
import Link from "next/link";

interface UploadControlsProps {
  status: "idle" | "uploading" | "paused" | "complete" | "error";
  stats: BulkUploadStats;
  eventSlug: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRetryAll: () => void;
  onClearComplete: () => void;
}

export function UploadControls({
  status,
  stats,
  eventSlug,
  onStart,
  onPause,
  onResume,
  onRetryAll,
  onClearComplete,
}: UploadControlsProps) {
  const t = useTranslations("moments.proUpload");

  const hasFiles = stats.total > 0;
  const hasQueued = stats.queued > 0;
  const hasFailed = stats.failed > 0;
  const hasComplete = stats.complete > 0;
  const isUploading = status === "uploading";
  const isPaused = status === "paused";
  const isComplete = status === "complete";

  return (
    <div className="flex flex-wrap gap-2">
      {/* Start / Pause / Resume */}
      {!isComplete && hasFiles && (
        <>
          {status === "idle" && hasQueued && (
            <Button onClick={onStart} size="sm">
              <Play className="w-4 h-4 mr-2" />
              {t("startUpload")}
            </Button>
          )}

          {isUploading && (
            <Button onClick={onPause} variant="outline" size="sm">
              <Pause className="w-4 h-4 mr-2" />
              {t("pause")}
            </Button>
          )}

          {isPaused && hasQueued && (
            <Button onClick={onResume} size="sm">
              <Play className="w-4 h-4 mr-2" />
              {t("resume")}
            </Button>
          )}
        </>
      )}

      {/* Retry failed */}
      {hasFailed && (
        <Button onClick={onRetryAll} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" />
          {t("retryFailed")} ({stats.failed})
        </Button>
      )}

      {/* Clear complete */}
      {hasComplete && !isComplete && (
        <Button onClick={onClearComplete} variant="ghost" size="sm">
          <Trash2 className="w-4 h-4 mr-2" />
          {t("clearComplete")}
        </Button>
      )}

      {/* View gallery when complete */}
      {isComplete && (
        <Button asChild>
          <Link href={`/events/${eventSlug}/moments`}>
            <Eye className="w-4 h-4 mr-2" />
            {t("viewGallery")}
          </Link>
        </Button>
      )}
    </div>
  );
}
