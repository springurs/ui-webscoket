"use client";

import { useEffect, useState } from "react";
import { LogStreamViewer, type LogEntry } from "./components/LogStreamViewer";

// Mock log generator
function generateMockLogs(count: number = 1000): LogEntry[] {
    const levels: ("DEBUG" | "INFO" | "WARN" | "ERROR")[] = ["DEBUG", "INFO", "WARN", "ERROR"];
    const messages = [
        "User authentication successful",
        "Database query executed",
        "Cache miss for key: user_profile_123",
        "API request received: POST /api/orders",
        "Payment processing started",
        "Email notification queued",
        "Background job completed",
        "WebSocket connection established",
        "Session expired for user",
        "File upload completed: invoice.pdf",
        "Rate limit exceeded for IP",
        "Configuration reloaded",
        "Health check passed",
        "Metrics collected and sent to monitoring service",
        "Deprecated API endpoint accessed",
    ];

    const logs: LogEntry[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
        const level = levels[Math.floor(Math.random() * levels.length)];
        const message = messages[Math.floor(Math.random() * messages.length)];
        logs.push({
            id: `log-${i}`,
            ts: now - (count - i) * 100, // Spread over time
            level,
            message,
            _lc: message.toLowerCase(),
        });
    }

    return logs;
}

export default function BuildChallengePage() {
    const [logs, setLogs] = useState<LogEntry[]>(() => generateMockLogs(1000));

    // Simulate real-time log additions
    useEffect(() => {
        const interval = setInterval(() => {
            const newLog: LogEntry = {
                id: `log-${Date.now()}`,
                ts: Date.now(),
                level: ["DEBUG", "INFO", "WARN", "ERROR"][Math.floor(Math.random() * 4)] as any,
                message: "New log entry generated",
                _lc: "new log entry generated",
            };
            setLogs(prev => [...prev.slice(-999), newLog]); // Keep last 1000 logs
        }, 2000); // Add a log every 2 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container mx-auto py-8 max-w-6xl">
            <h1 className="text-3xl font-bold mb-2">Part 2: Build Challenge</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                Build a performant log stream viewer with virtual scrolling.
                Create your components in{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-gray-800 dark:text-gray-200">
                    app/build/components/
                </code>
            </p>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
                <h2 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Requirements:</h2>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li>Virtual scrolling for 10,000+ logs</li>
                    <li>Real-time updates with auto-scroll behavior</li>
                    <li>Filter by log level (INFO, WARN, ERROR, DEBUG)</li>
                    <li>Text search with debouncing</li>
                    <li>Optimized rendering (use React DevTools Profiler to verify)</li>
                </ul>
            </div>

            {/* LogStreamViewer implementation */}
            <div className="mt-8">
                <LogStreamViewer logs={logs} height={600} />
            </div>
        </div>
    );
}
