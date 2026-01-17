"use client";

import { useState } from "react";
import { Link } from "@/lib/i18n/routing";
import { Search, Calendar, MapPin, Users, Heart, Share2, Filter } from "lucide-react";
import { format } from "date-fns";
import { TopNav } from "@/components/navigation/top-nav";
import type { Event } from "@/lib/types";

// Mock data (replace with actual data fetching)
interface EventsPageProps {
    events: Event[]; // We'll need to fetch these in the page.tsx
}

export function EventsFeed({ events }: EventsPageProps) {
    const [view, setView] = useState<"upcoming" | "past">("upcoming");

    return (
        <div className="min-h-screen bg-white">
            {/* Shared Header */}
            <TopNav />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Events in Da Lat</h1>
                        <p className="text-gray-500">Discover what's happening in Da Lat</p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-10 py-2 border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                            placeholder="Search events..."
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-400">×</span>
                        </div>
                    </div>
                </div>

                {/* Filters/Tabs */}
                <div className="w-full bg-gray-100 p-1 rounded-lg flex mb-8">
                    <button
                        onClick={() => setView("upcoming")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${view === "upcoming"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Upcoming
                    </button>
                    <button
                        onClick={() => setView("past")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${view === "past"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <span className="text-lg">↺</span>
                        Past
                    </button>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <div key={event.id} className="group bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
                            {/* Image */}
                            <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                                {event.image_url ? (
                                    <img
                                        src={event.image_url}
                                        alt={event.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Calendar className="w-12 h-12" />
                                    </div>
                                )}

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                                {/* Top Actions */}
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/40 transition-colors">
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/40 transition-colors">
                                        <Heart className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
                                    {event.title}
                                </h3>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>{format(new Date(event.starts_at), "EEE, MMM d • h:mm a")}</span>
                                    </div>

                                    {event.location_name && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span className="line-clamp-1">{event.location_name}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 pt-2">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white" />
                                            ))}
                                        </div>
                                        <span className="text-xs font-medium">12 going • 4 interested</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
