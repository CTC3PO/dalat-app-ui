import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { EventsFeed } from "@/components/events/events-feed";
import type { Event } from "@/lib/types";

// Reuse the server action logic (we should probably extract this to a shared lib eventually)
async function getUpcomingEvents() {
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

export default async function EventsPage() {
    const events = await getUpcomingEvents();

    return (
        <Suspense
            fallback={
                <div className="h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-gray-500">Loading events...</div>
                </div>
            }
        >
            <EventsFeed events={events} />
        </Suspense>
    );
}
