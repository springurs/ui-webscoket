"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface Event {
  id: string;
  type: "click" | "navigation" | "error" | "api";
  timestamp: number;
  message: string;
}

interface EventViewerProps {
  onEventReceived?: (event: Event) => void;
  mockStarted?: boolean;
}


function isAbortError(err: unknown) {
  return err instanceof DOMException && err.name === "AbortError";
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));

    const t = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Keeps a ref always pointing at the latest value */
function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

/** Async memo with cancellation so stale/racing results never win */
function useAsyncMemo<T>(
  factory: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList,
  initialValue: T
) {
  const [value, setValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    factory(controller.signal)
      .then((next) => {
        if (!controller.signal.aborted) setValue(next);
      })
      .catch((err) => {
        if (!isAbortError(err)) setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { value, loading, error };
}

/** Debounce any value (cancels pending update on change/unmount) */
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

/** ---------- component ---------- */

export function EventViewer({ onEventReceived, mockStarted }: EventViewerProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<Event["type"] | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  // Stable options object (and a nice single source of truth)
  const searchOptions = useMemo(
    () => ({ caseSensitive: false, debounceMs: 300 }),
    []
  );

  // Debounced search query (avoids filtering on every keystroke)
  const debouncedSearchQuery = useDebouncedValue(
    searchQuery,
    searchOptions.debounceMs
  );

  // Fix stale closure for callback via reusable hook
  const onEventReceivedRef = useLatestRef(onEventReceived);

  useEffect(() => {
    if (!mockStarted) return;

    const ws = new WebSocket("ws://localhost:3001/events");

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (evt) => {
      try {
        const event: Event = JSON.parse(evt.data);
        setEvents((prev) => [...prev, event]);
        onEventReceivedRef.current?.(event);
      } catch {
        // optionally push an "error" event here
      }
    };

    return () => {
      ws.onopen = null;
      ws.onclose = null;
      ws.onmessage = null;
      ws.close();
    };
  }, [onEventReceivedRef, mockStarted]);

  // Async filter function (abortable)
  const applyFilterAsync = useCallback(
    async (
      eventsList: Event[],
      filterValue: Event["type"] | "all",
      signal: AbortSignal
    ) => {
      await delay(50, signal); // simulate async work
      if (filterValue === "all") return eventsList;
      return eventsList.filter((e) => e.type === filterValue);
    },
    []
  );

  // Async filtering (race-proof)
  const { value: filteredEvents } = useAsyncMemo<Event[]>(
    (signal) => applyFilterAsync(events, filter, signal),
    [events, filter, applyFilterAsync],
    []
  );

  // Blink indicator with cleanup
  const [blinkState, setBlinkState] = useState(false);
  useEffect(() => {
    if (!isConnected) {
      setBlinkState(false);
      return;
    }
    const interval = setInterval(() => setBlinkState((p) => !p), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Search on top of filtered events, using debounced query
  const searchedEvents = useMemo(() => {
    const qRaw = debouncedSearchQuery;
    if (!qRaw) return filteredEvents;

    if (searchOptions.caseSensitive) {
      return filteredEvents.filter((e) => e.message.includes(qRaw));
    }

    const q = qRaw.toLowerCase();
    return filteredEvents.filter((e) => e.message.toLowerCase().includes(q));
  }, [filteredEvents, debouncedSearchQuery, searchOptions.caseSensitive]);

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? blinkState
                  ? "bg-green-500"
                  : "bg-green-300"
                : "bg-red-500"
            }`}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Event["type"] | "all")}
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">All Events</option>
          <option value="click">Clicks</option>
          <option value="navigation">Navigation</option>
          <option value="error">Errors</option>
          <option value="api">API Calls</option>
        </select>

        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {searchedEvents.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-sm py-8 text-center">
            No events yet
          </div>
        ) : (
          searchedEvents.map((event) => (
            <div
              key={event.id}
              className="border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-800 p-2 text-sm"
            >
              <div className="flex justify-between">
                <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                  {event.type}
                </span>
              </div>
              <div className="mt-1 text-gray-900 dark:text-gray-100">
                {event.message}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Showing {searchedEvents.length} of {events.length} events
      </div>
    </div>
  );
}
