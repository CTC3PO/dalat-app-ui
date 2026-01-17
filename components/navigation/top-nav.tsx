"use client";

import { Link, usePathname } from "@/lib/i18n/routing"; // Adjust import path if needed
import { Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

export function TopNav() {
    const pathname = usePathname();

    return (
        <div className="bg-white border-b border-gray-100 sticky top-0 z-[2000]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center gap-2">
                        <Link href="/" className="font-bold text-xl text-gray-900">
                            dalat.app
                        </Link>
                        <span className="text-xl">🇬🇧</span>
                    </div>

                    {/* Navigation Tabs (Desktop) */}
                    <nav className="hidden md:flex space-x-8">
                        {MAIN_NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== '/' && pathname?.startsWith(item.href));

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "text-gray-900 border-b-2 border-black"
                                            : "text-gray-500 hover:text-gray-900"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        <button className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 text-gray-700">
                            <Plus className="w-4 h-4" />
                            <span>Events</span>
                        </button>
                        <button className="p-2 text-gray-500 hover:text-gray-900">
                            <span className="sr-only">Notifications</span>
                            🔔
                        </button>

                        {/* Profile Icon */}
                        <Link href="/settings" className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                            <Users className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
