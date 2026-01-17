"use client";

import { Link, usePathname } from "@/lib/i18n/routing"; // Adjust import path if needed
import { Users, Plus, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopNav() {
    const pathname = usePathname();

    return (
        <div className="bg-white border-b border-gray-100 sticky top-0 z-[2000]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center gap-2">
                        <Link href="/" className="font-bold text-xl text-foreground">
                            dalat.app
                        </Link>
                        <span className="text-xl">🇬🇧</span>
                        <ThemeToggle />
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
                                            ? "text-gray-900 border-b-2 border-green-600" // Updated to green accent
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
                        <Button className="hidden sm:flex bg-[#16a34a] hover:bg-[#15803d] text-white rounded-full px-4 h-9">
                            + Add Event
                        </Button>

                        {/* Notification Bell - Minimalist White/Gray style */}
                        <button className="p-2 text-gray-400 hover:text-[#16a34a] transition-colors rounded-full hover:bg-gray-50">
                            <Bell className="w-5 h-5" />
                        </button>

                        {/* Profile Icon */}
                        <Link href="/settings" className="block">
                            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors">
                                <Users className="w-4 h-4 text-gray-500" />
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
