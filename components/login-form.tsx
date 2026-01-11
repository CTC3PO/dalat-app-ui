"use client";

import { Link } from "@/lib/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations("auth");

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("backToEvents")}
      </Link>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("welcomeTitle")}</CardTitle>
          <CardDescription>
            {t("signInDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OAuthButtons />
        </CardContent>
      </Card>
    </div>
  );
}
