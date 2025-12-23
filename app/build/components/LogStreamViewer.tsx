import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FixedSizeList } from "react-window";

// --- Types ---
type ListOnScrollProps = {
  scrollOffset: number;
  scrollUpdateWasRequested: boolean;
};
export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";
export type LogEntry = {
  id: string;
  ts: number; // epoch ms
  level: LogLevel;
  message: string;
  // Precomputed lowercased message for fast search.
  _lc: string;
};

// --- Small utilities ---
const LEVELS: LogLevel[] = ["DEBUG", "INFO", "WARN", "ERROR"];

function formatTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

// --- Viewer props ---
export type LogStreamViewerProps = {
  logs: LogEntry[];
  height?: number;
  rowHeight?: number;
  className?: string;
  /** Optional: called when user clicks a row. */
  onSelectLog?: (log: LogEntry) => void;
};

// --- Row renderer ---
type RowData = {
  filteredIndices: number[];
  logs: LogEntry[];
  onSelectLog?: (log: LogEntry) => void;
};

const LogRow = memo(
  function LogRow({
    index,
    style,
    data,
  }: {
    index: number;
    style: React.CSSProperties;
    data: RowData;
  }) {
    const realIndex = data.filteredIndices[index];
    const log = data.logs[realIndex];

    // Tailwind classes for level color. Keep minimal DOM & avoid heavy formatting.
    const levelClass =
      log.level === "ERROR"
        ? "text-red-600"
        : log.level === "WARN"
          ? "text-amber-600"
          : log.level === "DEBUG"
            ? "text-slate-500"
            : "text-emerald-700";

    return (
      <div
        style={style}
        className="px-3 text-[12px] leading-6 font-mono border-b border-slate-100 flex items-center gap-3 select-text"
        onClick={() => data.onSelectLog?.(log)}
        title={log.message}
      >
        <span className="text-slate-500 tabular-nums shrink-0 w-[95px]">
          {formatTime(log.ts)}
        </span>
        <span className={`${levelClass} shrink-0 w-[58px] font-semibold`}>
          {log.level}
        </span>
        <span className="text-slate-900 truncate">{log.message}</span>
      </div>
    );
  }
);

// --- Controls ---
function LevelToggles({
  enabled,
  onChange,
}: {
  enabled: Record<LogLevel, boolean>;
  onChange: (next: Record<LogLevel, boolean>) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {LEVELS.map((lvl) => (
        <label
          key={lvl}
          className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={enabled[lvl]}
            onChange={(e) => onChange({ ...enabled, [lvl]: e.target.checked })}
          />
          <span>{lvl}</span>
        </label>
      ))}
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        className="w-[260px] max-w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
        value={value}
        placeholder={placeholder ?? "Search logs"}
        onChange={(e) => onChange(e.target.value)}
      />
      {value.length > 0 && (
        <button
          className="text-sm px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
          onClick={() => onChange("")}
          type="button"
        >
          Clear
        </button>
      )}
    </div>
  );
}

// --- Main viewer ---
export function LogStreamViewer({
  logs,
  height = 520,
  rowHeight = 24,
  className,
  onSelectLog,
}: LogStreamViewerProps) {
  const listRef = useRef<FixedSizeList>(null);

  // Filters
  const [enabledLevels, setEnabledLevels] = useState<Record<LogLevel, boolean>>({
    DEBUG: true,
    INFO: true,
    WARN: true,
    ERROR: true,
  });

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);
  const debouncedSearchLc = useMemo(
    () => debouncedSearch.trim().toLowerCase(),
    [debouncedSearch]
  );

  // Auto-follow behavior: user toggle + "at bottom" detection.
  const [autoFollowEnabled, setAutoFollowEnabled] = useState(true);
  const [atBottom, setAtBottom] = useState(true);

  // Derived: indices of logs that match filters.
  const filteredIndices = useMemo(() => {
    // Tight loop: avoids allocations. Works well for 10k+ logs.
    const out: number[] = [];
    const q = debouncedSearchLc;
    const useQuery = q.length > 0;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      if (!enabledLevels[log.level]) continue;
      if (useQuery && !log._lc.includes(q)) continue;
      out.push(i);
    }
    return out;
  }, [logs, enabledLevels, debouncedSearchLc]);

  const itemCount = filteredIndices.length;

  // Build stable itemData reference.
  const itemData = useMemo<RowData>(
    () => ({ filteredIndices, logs, onSelectLog }),
    [filteredIndices, logs, onSelectLog]
  );

  // Compute bottom detection for fixed-size list.
  const onScroll = useCallback(
    ({ scrollOffset, scrollUpdateWasRequested }: ListOnScrollProps) => {
      if (scrollUpdateWasRequested) return;
      const total = itemCount * rowHeight;
      const maxOffset = Math.max(0, total - height);
      // Within ~2 rows of the bottom counts as bottom.
      const threshold = rowHeight * 2;
      setAtBottom(scrollOffset >= maxOffset - threshold);
    },
    [itemCount, rowHeight, height]
  );

  const effectiveFollow = autoFollowEnabled && atBottom;

  // When new logs arrive, keep the view pinned to the latest (if in follow mode).
  // useLayoutEffect avoids visible flicker.
  useLayoutEffect(() => {
    if (!effectiveFollow) return;
    if (itemCount <= 0) return;
    // Scroll to last *visible* row given current filters.
    listRef.current?.scrollToItem(itemCount - 1, "end");
  }, [effectiveFollow, itemCount]);

  const jumpToLatest = useCallback(() => {
    if (itemCount <= 0) return;
    listRef.current?.scrollToItem(itemCount - 1, "end");
  }, [itemCount]);

  const shownCount = itemCount;
  const totalCount = logs.length;

  return (
    <div className={`w-full ${className ?? ""}`.trim()}>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <LevelToggles enabled={enabledLevels} onChange={setEnabledLevels} />
              <div className="h-6 w-px bg-slate-200 hidden md:block" />
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Search (debounced)"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoFollowEnabled}
                  onChange={(e) => setAutoFollowEnabled(e.target.checked)}
                />
                <span>Auto-follow</span>
              </label>

              {!effectiveFollow && (
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800"
                  onClick={jumpToLatest}
                >
                  Jump to latest
                </button>
              )}

              <div className="text-sm text-slate-600 tabular-nums">
                Showing <span className="font-semibold">{shownCount}</span> of{" "}
                <span className="font-semibold">{totalCount}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 text-xs text-slate-600 font-mono flex gap-3">
              <span className="w-[95px] shrink-0">time</span>
              <span className="w-[58px] shrink-0">level</span>
              <span className="truncate">message</span>
            </div>
            <FixedSizeList
              ref={listRef}
              height={height}
              width="100%"
              itemCount={itemCount}
              itemSize={rowHeight}
              itemData={itemData}
              onScroll={onScroll}
              // Helps keep scroll position stable when filters change.
              overscanCount={8}
            >
              {LogRow}
            </FixedSizeList>
          </div>

          {!atBottom && autoFollowEnabled && (
            <div className="text-xs text-slate-600">
              Auto-follow paused while you scroll. Scroll to the bottom or click{" "}
              <span className="font-semibold">Jump to latest</span>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Demo / Example: generates logs in real-time ---
// Remove this section if you already have a source of log events.

function randomId() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function randomPick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeLog(level?: LogLevel): LogEntry {
  const lvl = level ?? randomPick(LEVELS);
  const msgBase =
    lvl === "ERROR"
      ? "Request failed"
      : lvl === "WARN"
        ? "Retrying with backoff"
        : lvl === "DEBUG"
          ? "Cache miss"
          : "Request completed";

  const extra =
    lvl === "ERROR"
      ? ` status=${randomPick([400, 401, 403, 404, 429, 500, 502, 503])}`
      : lvl === "WARN"
        ? ` attempt=${randomPick([2, 3, 4])}`
        : lvl === "DEBUG"
          ? ` key=user:${randomPick(["a1", "b2", "c3", "d4"])}`
          : ` ms=${randomPick([12, 21, 34, 55, 89, 144])}`;

  const message = `${msgBase}${extra} trace=${randomPick([
    "9f31",
    "b81c",
    "0aa2",
    "7d0f",
    "e3c9",
  ])}`;

  return {
    id: randomId(),
    ts: Date.now(),
    level: lvl,
    message,
    _lc: message.toLowerCase(),
  };
}

export function LogStreamDemo() {
  const [running, setRunning] = useState(true);
  const [rate, setRate] = useState(20); // logs / second
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    // Seed with 10k logs to validate virtualization.
    const seed: LogEntry[] = [];
    const now = Date.now();
    for (let i = 0; i < 10000; i++) {
      const l = makeLog();
      l.ts = now - (10000 - i) * 5;
      seed.push(l);
    }
    return seed;
  });

  // Keep a bounded buffer to avoid unlimited growth in long sessions.
  const MAX_LOGS = 50000;

  useEffect(() => {
    if (!running) return;

    // Use a timer chunking strategy to reduce state updates.
    // We accumulate multiple logs per tick for better perf.
    const intervalMs = 100;
    const perTick = Math.max(1, Math.round((rate * intervalMs) / 1000));

    const t = window.setInterval(() => {
      setLogs((prev) => {
        const next = prev.length > MAX_LOGS ? prev.slice(prev.length - MAX_LOGS) : prev;
        const batch: LogEntry[] = new Array(perTick);
        for (let i = 0; i < perTick; i++) batch[i] = makeLog();
        return next.concat(batch);
      });
    }, intervalMs);

    return () => window.clearInterval(t);
  }, [running, rate]);

  const clear = useCallback(() => setLogs([]), []);

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800"
          onClick={() => setRunning((v) => !v)}
          type="button"
        >
          {running ? "Pause" : "Resume"}
        </button>
        <button
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50"
          onClick={clear}
          type="button"
        >
          Clear
        </button>

        <div className="flex items-center gap-2 text-sm text-slate-700">
          <span>Rate</span>
          <input
            type="range"
            min={1}
            max={200}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
          <span className="tabular-nums w-[60px]">{rate}/s</span>
        </div>

        <div className="text-sm text-slate-600">
          Tip: open React DevTools Profiler and scroll — only visible rows should render.
        </div>
      </div>

      <LogStreamViewer logs={logs} height={520} rowHeight={24} />
    </div>
  );
}

/*
Installation:
  npm i react-window

Usage:
  <LogStreamViewer logs={logs} />

Performance notes:
- Virtualization via react-window renders only visible rows (plus overscan).
- Search is debounced (200ms) and uses precomputed lowercased message to avoid repeated allocations.
- Auto-follow sticks to the latest log only when you're at the bottom and Auto-follow is enabled.
- Real-time ingestion batches updates (per tick) to reduce React work.
*/
