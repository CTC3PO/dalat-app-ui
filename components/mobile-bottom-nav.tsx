"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Calendar, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
    const pathname = usePathname();

    // Remove locale prefix for comparison
    const currentPath = pathname?.replace(/^\/[a-z]{2}/, "") || "/";

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/map", icon: MapPin, label: "Map" },
        { href: "/calendar", icon: Calendar, label: "Calendar" },
        { href: "/events/new", icon: Plus, label: "Add" },
        { href: "/settings", icon: User, label: "Me" },
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom">
            <div className="grid grid-cols-5 h-16">
                {navItems.map((item) => {
                    const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/");
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
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
