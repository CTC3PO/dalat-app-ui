"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarStep } from "./avatar-step";
import { ProfileStep } from "./profile-step";

type Step = "avatar" | "profile";

interface OnboardingFlowProps {
  userId: string;
  defaultDisplayName?: string;
  oauthAvatarUrl?: string | null;
  redirectTo?: string;
}

export function OnboardingFlow({
  userId,
  defaultDisplayName,
  oauthAvatarUrl,
  redirectTo = "/",
}: OnboardingFlowProps) {
  const t = useTranslations("onboarding");
  const [currentStep, setCurrentStep] = useState<Step>("avatar");
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);

  const handleAvatarComplete = (avatarUrl: string | null) => {
    setSelectedAvatarUrl(avatarUrl);
    setCurrentStep("profile");
  };

  const handleAvatarSkip = () => {
    setSelectedAvatarUrl(null);
    setCurrentStep("profile");
  };

  const handleBackToAvatar = () => {
    setCurrentStep("avatar");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">{t("welcome")}</h1>
        <p className="text-muted-foreground">
          {currentStep === "avatar" ? t("avatarStep.subtitle") : t("profileStep.subtitle")}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center gap-2">
        <div
          className={`w-2 h-2 rounded-full transition-colors ${
            currentStep === "avatar" ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        />
        <div
          className={`w-2 h-2 rounded-full transition-colors ${
            currentStep === "profile" ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        />
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === "avatar" ? (
            <AvatarStep
              userId={userId}
              displayName={defaultDisplayName}
              oauthAvatarUrl={oauthAvatarUrl}
              onComplete={handleAvatarComplete}
              onSkip={handleAvatarSkip}
            />
          ) : (
            <ProfileStep
              userId={userId}
              defaultDisplayName={defaultDisplayName}
              avatarUrl={selectedAvatarUrl}
              onBack={handleBackToAvatar}
              redirectTo={redirectTo}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
