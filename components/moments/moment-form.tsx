"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ImageIcon, X, Upload, Loader2, Send, Type } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  validateMediaFile,
  ALL_ALLOWED_TYPES,
} from "@/lib/media-utils";
import { triggerHaptic } from "@/lib/haptics";
import { triggerTranslation } from "@/lib/translations-client";

interface MomentFormProps {
  eventId: string;
  eventSlug: string;
  userId: string;
  onSuccess?: () => void;
}

type ContentMode = "media" | "text";

export function MomentForm({ eventId, eventSlug, userId, onSuccess }: MomentFormProps) {
  const t = useTranslations("moments");
  const router = useRouter();

  const [mode, setMode] = useState<ContentMode>("media");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsVideo, setPreviewIsVideo] = useState(false);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMedia = async (file: File) => {
    setError(null);

    const validationError = validateMediaFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPreviewIsVideo(file.type.startsWith("video/"));

    setIsUploading(true);

    try {
      const supabase = createClient();

      // Generate unique filename: {event_id}/{user_id}/{timestamp}.{ext}
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${eventId}/${userId}/${Date.now()}.${ext}`;

      // Upload media
      const { error: uploadError } = await supabase.storage
        .from("moments")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("moments")
        .getPublicUrl(fileName);

      setMediaUrl(publicUrl);
      triggerHaptic("light");
    } catch (err) {
      console.error("Upload error:", err);
      setError(t("errors.uploadFailed"));
      setPreviewUrl(null);
      setPreviewIsVideo(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMedia(file);
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadMedia(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleRemoveMedia = () => {
    setMediaUrl(null);
    setPreviewUrl(null);
    setPreviewIsVideo(false);
  };

  const handlePost = async () => {
    // Validate content
    if (mode === "media" && !mediaUrl) {
      setError(t("errors.uploadFailed"));
      return;
    }
    if (mode === "text" && !caption.trim()) {
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      const supabase = createClient();

      const contentType = mode === "text" ? "text" : (previewIsVideo ? "video" : "photo");

      const { data, error: postError } = await supabase.rpc("create_moment", {
        p_event_id: eventId,
        p_content_type: contentType,
        p_media_url: mode === "media" ? mediaUrl : null,
        p_text_content: caption.trim() || null,
      });

      if (postError) {
        if (postError.message.includes("not_allowed_to_post")) {
          setError(t("errors.notAllowed"));
        } else {
          throw postError;
        }
        return;
      }

      // Trigger translation for text content (fire-and-forget)
      const textContent = caption.trim();
      if (data?.moment_id && textContent) {
        triggerTranslation("moment", data.moment_id, [
          { field_name: "text_content", text: textContent },
        ]);
      }

      triggerHaptic("medium");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/events/${eventSlug}/moments`);
        router.refresh();
      }
    } catch (err) {
      console.error("Post error:", err);
      setError(t("errors.postFailed"));
    } finally {
      setIsPosting(false);
    }
  };

  const canPost = mode === "text"
    ? caption.trim().length > 0
    : !!mediaUrl;

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "media" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("media")}
          className="flex-1"
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          {t("uploadMedia")}
        </Button>
        <Button
          type="button"
          variant={mode === "text" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("text")}
          className="flex-1"
        >
          <Type className="w-4 h-4 mr-2" />
          {t("textOnly")}
        </Button>
      </div>

      {/* Media upload area */}
      {mode === "media" && (
        <div
          className={cn(
            "relative aspect-square rounded-lg overflow-hidden bg-muted border-2 transition-colors cursor-pointer group",
            isDragOver
              ? "border-primary border-dashed"
              : previewUrl
                ? "border-transparent"
                : "border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !previewUrl && fileInputRef.current?.click()}
        >
          {previewUrl ? (
            <>
              {previewIsVideo ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveMedia();
                }}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Upload overlay on hover */}
              {!isUploading && (
                <div
                  className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="w-8 h-8 text-white" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              ) : (
                <>
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center px-4">
                    {t("uploadMedia")}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Caption / Text input */}
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder={mode === "text" ? t("captionPlaceholder") : t("addCaption")}
        className="w-full min-h-[100px] p-3 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        maxLength={500}
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Post button */}
      <Button
        onClick={handlePost}
        disabled={!canPost || isUploading || isPosting}
        className="w-full"
        size="lg"
      >
        {isPosting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t("posting")}
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            {t("postMoment")}
          </>
        )}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALL_ALLOWED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
