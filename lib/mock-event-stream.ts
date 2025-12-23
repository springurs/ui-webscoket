/**
 * Mock WebSocket server simulation for the debug challenge
 * This runs in the browser and simulates a WebSocket server
 */

export function startMockEventServer() {
    // Polyfill WebSocket for testing
    if (typeof window === "undefined") return;

    const originalWebSocket = window.WebSocket;

    class MockWebSocket extends EventTarget {
        url: string;
        onopen: ((ev: Event) => void) | null = null;
        onclose: ((ev: CloseEvent) => void) | null = null;
        onmessage: ((ev: MessageEvent) => void) | null = null;
        onerror: ((ev: Event) => void) | null = null;
        readyState = 0; // CONNECTING

        private interval: NodeJS.Timeout | null = null;

        constructor(url: string) {
            super();
            this.url = url;

            // Simulate connection delay
            setTimeout(() => {
                this.readyState = 1; // OPEN
                const event = new Event("open");
                this.onopen?.(event);
                this.dispatchEvent(event);
                this.startSendingEvents();
            }, 100);
        }

        private startSendingEvents() {
            const eventTypes = ["click", "navigation", "error", "api"] as const;
            const messages = [
                "User clicked submit button",
                "Navigated to /dashboard",
                "Failed to load user profile",
                "GET /api/users returned 200",
                "Form validation error",
                "WebSocket connection established",
            ];

            let counter = 0;
            this.interval = setInterval(() => {
                if (this.readyState !== 1) return;

                const event = {
                    id: `evt-${Date.now()}-${counter++}`,
                    type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
                    timestamp: Date.now(),
                    message: messages[Math.floor(Math.random() * messages.length)],
                };

                const messageEvent = new MessageEvent("message", {
                    data: JSON.stringify(event),
                });
                this.onmessage?.(messageEvent);
                this.dispatchEvent(messageEvent);
            }, 800);
        }

        close() {
            this.readyState = 3; // CLOSED
            if (this.interval) {
                clearInterval(this.interval);
            }
            const event = new CloseEvent("close");
            this.onclose?.(event);
            this.dispatchEvent(event);
        }

        send(data: string) {
            // Not used in this mock
        }
    }

    // Replace global WebSocket for localhost:3001
    (window as any).WebSocket = function (url: string) {
        if (url.includes("localhost:3001")) {
            return new MockWebSocket(url);
        }
        return new originalWebSocket(url);
    };
}
