"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ExternalLink,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import type { VerificationRequest, OrganizerType } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface VerificationRequestCardProps {
  request: VerificationRequest & {
    profiles: {
      id: string;
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
    };
    reviewer: {
      id: string;
      username: string | null;
      display_name: string | null;
    } | null;
  };
  isPending: boolean;
}

const ORGANIZER_TYPE_LABELS: Record<OrganizerType, string> = {
  ward: "Ward (Phường)",
  city: "City Government",
  venue: "Venue",
  cultural_org: "Cultural Organization",
  committee: "Festival Committee",
  business: "Business",
  other: "Other",
};

export function VerificationRequestCard({
  request,
  isPending,
}: VerificationRequestCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("approve_verification_request", {
        request_id: request.id,
        admin_notes_input: adminNotes || null,
      });

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request. Please try again.");
    } finally {
      setIsLoading(false);
      setShowActions(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("reject_verification_request", {
        request_id: request.id,
        rejection_reason_input: rejectionReason,
        admin_notes_input: adminNotes || null,
      });

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request. Please try again.");
    } finally {
      setIsLoading(false);
      setShowActions(false);
    }
  };

  const handleRequestMoreInfo = async () => {
    if (!adminNotes.trim()) {
      alert("Please provide details about what info is needed");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("request_more_info_verification", {
        request_id: request.id,
        admin_notes_input: adminNotes,
      });

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error("Error requesting more info:", error);
      alert("Failed to request more info. Please try again.");
    } finally {
      setIsLoading(false);
      setShowActions(false);
    }
  };

  const createdDate = new Date(request.created_at).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-lg border bg-card p-6">
      {/* Header: User + Request Date */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {request.profiles.avatar_url ? (
            <Image
              src={request.profiles.avatar_url}
              alt={request.profiles.display_name || "User"}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {(request.profiles.display_name || request.profiles.username || "U")[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium">
              {request.profiles.display_name || request.profiles.username || "Unknown User"}
            </p>
            <p className="text-sm text-muted-foreground">
              @{request.profiles.username || "no-username"}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Submitted {createdDate}</p>
      </div>

      {/* Organizer Info */}
      <div className="p-4 rounded-lg bg-muted/50 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">{request.organizer_name}</h3>
        </div>
        <div className="flex flex-wrap gap-4 text-sm mb-3">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
            {ORGANIZER_TYPE_LABELS[request.organizer_type]}
          </span>
        </div>
        {request.organizer_description && (
          <p className="text-sm text-muted-foreground mb-3">
            {request.organizer_description}
          </p>
        )}

        {/* Contact Info */}
        <div className="flex flex-wrap gap-4 text-sm">
          {request.contact_email && (
            <a
              href={`mailto:${request.contact_email}`}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              {request.contact_email}
            </a>
          )}
          {request.contact_phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {request.contact_phone}
            </span>
          )}
        </div>
      </div>

      {/* Proof Message */}
      {request.proof_message && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-1">Message from requester:</p>
          <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
            {request.proof_message}
          </p>
        </div>
      )}

      {/* Proof Links */}
      {request.proof_links && request.proof_links.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Proof / References:</p>
          <div className="flex flex-wrap gap-2">
            {request.proof_links.map((link, index) => (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="truncate max-w-[200px]">{new URL(link).hostname}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Admin Notes (if reviewed) */}
      {request.admin_notes && (
        <div className="mb-4 p-3 rounded bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
            Admin Notes:
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {request.admin_notes}
          </p>
        </div>
      )}

      {/* Rejection Reason (if rejected) */}
      {request.rejection_reason && (
        <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
            Rejection Reason:
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            {request.rejection_reason}
          </p>
        </div>
      )}

      {/* Reviewer Info (if reviewed) */}
      {request.reviewer && request.reviewed_at && (
        <div className="mb-4 text-sm text-muted-foreground">
          Reviewed by {request.reviewer.display_name || request.reviewer.username} on{" "}
          {new Date(request.reviewed_at).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      )}

      {/* Actions for Pending Requests */}
      {isPending && (
        <div className="pt-4 border-t">
          {!showActions ? (
            <button
              onClick={() => setShowActions(true)}
              className="w-full py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              Review Request
            </button>
          ) : (
            <div className="space-y-4">
              {/* Admin Notes Input */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Admin Notes (internal)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes (not shown to user)..."
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
                  rows={2}
                />
              </div>

              {/* Rejection Reason (for reject action) */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Rejection Reason (shown to user, required for rejection)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection (visible to user)..."
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve
                </button>
                <button
                  onClick={handleRequestMoreInfo}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <HelpCircle className="h-4 w-4" />
                  )}
                  Request More Info
                </button>
                <button
                  onClick={handleReject}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject
                </button>
                <button
                  onClick={() => setShowActions(false)}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
