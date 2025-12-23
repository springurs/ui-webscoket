"use client";

import { useLayoutEffect, useState } from "react";
import { EventViewer } from "./components/EventViewer";
import { startMockEventServer } from "@/lib/mock-event-stream";

export default function DebugChallengePage() {
    const [mockStarted, setMockStarted] = useState(false);

    useLayoutEffect(() => {
        startMockEventServer();
        setMockStarted(true);
    }, []);

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">Part 1: Debug Challenge</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                Fix the 4 bugs in the EventViewer component below.
            </p>

            <EventViewer
                mockStarted={mockStarted}
                onEventReceived={(event) => {
                    console.log("Event received callback:", event);
                }}
            />

            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded">
                <h2 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-100">Expected Behavior:</h2>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                    <li>Filter dropdown should correctly filter events by type</li>
                    <li>Search should work on incoming events in real-time</li>
                    <li>No memory leaks (check Chrome DevTools Memory profiler)</li>
                    <li>Minimal re-renders (check React DevTools Profiler)</li>
                    <li>onEventReceived callback should be called for every event</li>
                </ul>
            </div>
        </div>
    );
}
