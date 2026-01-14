import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { EventMapView } from "@/components/events/event-map-view";
import type { Event, EventCounts } from "@/lib/types";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

async function getEvents() {
    const supabase = await createClient();

    const { data: events, error } = await supabase
        .rpc("get_events_by_lifecycle", {
            p_lifecycle: "upcoming",
            p_limit: 100,
        });

    if (error) {
        console.error("Error fetching events:", error);
        return [];
    }

    return events as Event[];
}

async function getEventCounts(eventIds: string[]) {
    if (eventIds.length === 0) return {};

    const supabase = await createClient();

    const { data: rsvps } = await supabase
        .from("rsvps")
        .select("event_id, status, plus_ones")
        .in("event_id", eventIds);

    const counts: Record<string, EventCounts> = {};

    for (const eventId of eventIds) {
        const eventRsvps = rsvps?.filter((r) => r.event_id === eventId) || [];
        const goingRsvps = eventRsvps.filter((r) => r.status === "going");
        const waitlistRsvps = eventRsvps.filter((r) => r.status === "waitlist");
        const interestedRsvps = eventRsvps.filter((r) => r.status === "interested");

        counts[eventId] = {
            event_id: eventId,
            going_count: goingRsvps.length,
            waitlist_count: waitlistRsvps.length,
            going_spots: goingRsvps.reduce((sum, r) => sum + 1 + (r.plus_ones || 0), 0),
            interested_count: interestedRsvps.length,
        };
    }

    return counts;
}

export default async function MapPage() {
    const events = await getEvents();
    const eventIds = events.map((e) => e.id);
    const counts = await getEventCounts(eventIds);
    const t = await getTranslations("nav");

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <div className="container flex h-14 max-w-7xl items-center justify-between mx-auto px-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-sm font-medium hover:text-green-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Link>
                        <h1 className="font-bold text-lg">Events Map</h1>
                    </div>
                </div>
            </header>

            {/* Map View */}
            <Suspense
                fallback={
                    <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
                        <div className="text-gray-500">Loading map...</div>
                    </div>
                }
            >
                <EventMapView events={events} counts={counts} />
            </Suspense>
        </div>
    );
}
