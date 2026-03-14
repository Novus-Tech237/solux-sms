"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Occurrence {
  id: number;
  title: string;
  description: string | null;
  occurrenceStart: string;
  occurrenceEnd: string;
}

const EventList = () => {
  const searchParams = useSearchParams();
  const dateParam = searchParams?.get("date") || undefined;

  const [events, setEvents] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);

      try {
        const query = dateParam
          ? `?date=${encodeURIComponent(dateParam)}`
          : "";
        const res = await fetch(`/api/events${query}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch events");
        }
        const data: Occurrence[] = await res.json();
        setEvents(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [dateParam]);

  if (loading) {
    return <p className="text-gray-500">Loading events...</p>;
  }
  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (events.length === 0) {
    return <p className="text-gray-500">No events for selected date.</p>;
  }

  return (
    <>
      {events.map((occ) => {
        const occurrenceStart = new Date(occ.occurrenceStart);
        return (
          <div
            className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
            key={occ.id}
          >
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-gray-600">{occ.title}</h1>
              <span className="text-gray-300 text-xs">
                {occurrenceStart.toLocaleTimeString("en-UK", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </span>
            </div>
            <p className="mt-2 text-gray-400 text-sm">
              {occ.description}
            </p>
          </div>
        );
      })}
    </>
  );
};

export default EventList;
