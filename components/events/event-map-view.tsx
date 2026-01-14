"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, List, Filter as FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "./event-card";
import type { Event, EventCounts } from "@/lib/types";

// Dynamically import map to avoid SSR issues
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false }
);

interface EventMapViewProps {
    events: Event[];
    counts: Record<string, EventCounts>;
    onFilterClick?: () => void;
}

export function EventMapView({ events, counts, onFilterClick }: EventMapViewProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [showList, setShowList] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Default center: Da Lat, Vietnam
    const defaultCenter: [number, number] = [11.9404, 108.4583];
    const defaultZoom = 13;

    // Filter events that have coordinates
    const eventsWithCoords = events.filter(
        (event) => event.latitude && event.longitude
    );

    if (!isMounted) {
        return (
            <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">Loading map...</div>
            </div>
        );
    }

    return (
        <div className="relative h-[calc(100vh-4rem)]">
            {/* Map Container */}
            <div className="absolute inset-0">
                <MapContainer
                    center={defaultCenter}
                    zoom={defaultZoom}
                    className="h-full w-full"
                    style={{ background: "#f9fafb" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {eventsWithCoords.map((event) => (
                        <Marker
                            key={event.id}
                            position={[event.latitude!, event.longitude!]}
                            eventHandlers={{
                                click: () => setSelectedEvent(event),
                            }}
                        >
                            <Popup>
                                <div className="p-2 min-w-[200px]">
                                    <h3 className="font-semibold text-sm mb-1">{event.title}</h3>
                                    <p className="text-xs text-gray-600 mb-2">
                                        {new Date(event.starts_at).toLocaleDateString("en-US", {
                                            weekday: "short",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </p>
                                    {event.location_name && (
                                        <p className="text-xs text-gray-500 mb-2">
                                            📍 {event.location_name}
                                        </p>
                                    )}
                                    {counts[event.id] && (
                                        <p className="text-xs text-green-600 font-medium">
                                            🎫 {counts[event.id].going_count} going
                                        </p>
                                    )}
                                    <a
                                        href={`/events/${event.slug}`}
                                        className="text-xs text-green-600 hover:text-green-700 font-medium mt-2 inline-block"
                                    >
                                        View Details →
                                    </a>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Mobile: Bottom Sheet */}
            <div className="lg:hidden">
                {/* Toggle Button */}
                <div className="absolute top-4 right-4 z-[1000] flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onFilterClick}
                        className="bg-white shadow-lg border-gray-200 hover:bg-gray-50"
                    >
                        <FilterIcon className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowList(!showList)}
                        className="bg-white shadow-lg border-gray-200 hover:bg-gray-50"
                    >
                        {showList ? <MapPin className="w-4 h-4" /> : <List className="w-4 h-4" />}
                    </Button>
                </div>

                {/* Bottom Sheet */}
                <div
                    className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-all duration-300 z-[999] ${showList ? "h-[70vh]" : "h-24"
                        }`}
                >
                    <div className="p-4">
                        <div
                            className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 cursor-pointer"
                            onClick={() => setShowList(!showList)}
                        />
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-lg">
                                {eventsWithCoords.length} events nearby
                            </h2>
                        </div>

                        {showList && (
                            <div className="overflow-y-auto h-[calc(70vh-8rem)] space-y-4">
                                {eventsWithCoords.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        counts={counts[event.id]}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop: Sidebar */}
            <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-96 bg-white shadow-xl z-[999] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-xl">Events Map</h2>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onFilterClick}
                            className="border-gray-200"
                        >
                            <FilterIcon className="w-4 h-4 mr-2" />
                            Filters
                        </Button>
                    </div>

                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600">
                            Showing <span className="font-semibold text-green-600">{eventsWithCoords.length}</span> events
                        </p>
                    </div>

                    <div className="space-y-4">
                        {eventsWithCoords.map((event) => (
                            <div
                                key={event.id}
                                className={`cursor-pointer transition-all ${selectedEvent?.id === event.id
                                        ? "ring-2 ring-green-500 rounded-lg"
                                        : ""
                                    }`}
                                onClick={() => setSelectedEvent(event)}
                            >
                                <EventCard event={event} counts={counts[event.id]} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
