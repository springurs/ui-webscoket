"use client";

import { useEffect, useState, useCallback } from "react";

export interface LogEntry {
    id: string;
    timestamp: number;
    level: "INFO" | "WARN" | "ERROR" | "DEBUG";
    message: string;
    metadata?: Record<string, unknown>;
}

const LOG_MESSAGES = [
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

const LOG_LEVELS: LogEntry["level"][] = ["INFO", "INFO", "INFO", "WARN", "ERROR", "DEBUG"];

function generateRandomLog(id: number): LogEntry {
    const level = LOG_LEVELS[Math.floor(Math.random() * LOG_LEVELS.length)];
    const message = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];

    return {
        id: `log-${id}`,
        timestamp: Date.now(),
        level,
        message,
        metadata:
            Math.random() > 0.7
                ? {
                    userId: `user-${Math.floor(Math.random() * 1000)}`,
                    duration: Math.floor(Math.random() * 1000),
                    endpoint: "/api/v1/resource",
                }
                : undefined,
    };
}

/**
 * Mock hook that simulates a WebSocket log stream
 * Generates new logs every 100-500ms
 */
export function useLogStream() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Simulate connection delay
        const connectTimeout = setTimeout(() => {
            setIsConnected(true);
        }, 500);

        let counter = 0;
        let interval: NodeJS.Timeout;

        const startStreaming = () => {
            interval = setInterval(() => {
                const newLog = generateRandomLog(counter++);
                setLogs((prev) => [...prev, newLog]);
            }, Math.random() * 400 + 100); // 100-500ms
        };

        const streamTimeout = setTimeout(startStreaming, 500);

        return () => {
            clearTimeout(connectTimeout);
            clearTimeout(streamTimeout);
            if (interval) clearInterval(interval);
        };
    }, []);

    const clear = useCallback(() => {
        setLogs([]);
    }, []);

    return { logs, isConnected, clear };
}

/**
 * Generate initial batch of logs for testing
 */
export function generateInitialLogs(count: number = 1000): LogEntry[] {
    return Array.from({ length: count }, (_, i) => generateRandomLog(i));
}
