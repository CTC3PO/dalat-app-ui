"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Briefcase, Grid, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS } from "@/lib/navigation";

const Icons = {
    Home,
    Calendar,
    Briefcase,
    Grid,
    User,
} as const;

export function BottomNav() {
    const pathname = usePathname();

    // Remove locale prefix for comparison
    const currentPath = pathname?.replace(/^\/[a-z]{2}/, "") || "/";

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
            <div className="grid grid-cols-5 h-16">
                {BOTTOM_NAV_ITEMS.map((item) => {
                    const isActive =
                        currentPath === item.href ||
                        (item.href !== "/" && currentPath.startsWith(item.href));
                    const Icon = Icons[item.icon];

                    return (
                        <Link
                            key={item.href + item.label}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-colors",
                                isActive
                                    ? "text-green-600"
                                    : "text-gray-600 hover:text-gray-900"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
