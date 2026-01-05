# Solutions & Explanations

## Part 1: Debug Challenge

### Bug 1: Stale Closure in Event Callback

**What the bug was:**
The `onEventReceived` callback was captured in a stale closure, causing it to always reference the initial undefined/null value instead of the latest callback passed as props.

**Why it occurred:**
React's useEffect closure captures the values at the time the effect runs. Without proper handling, the callback reference becomes stale when the component re-renders with new props.

**How I fixed it:**
Used a custom `useLatestRef` hook to maintain a mutable ref that always points to the latest callback value, ensuring the WebSocket message handler uses the current callback.

---

### Bug 2: Memory Leaks from WebSocket Event Handlers

**What the bug was:**
Event handlers (`onopen`, `onclose`, `onmessage`) were not being properly cleaned up, leading to memory leaks and potential multiple handler registrations.

**Why it occurred:**
The WebSocket event handlers were assigned directly without proper cleanup in the useEffect return function, causing handlers to accumulate on each re-render.

**How I fixed it:**
Explicitly set event handlers to null in the cleanup function and properly closed the WebSocket connection to prevent memory leaks.

---

### Bug 3: Race Conditions in Async Filtering

**What the bug was:**
Async filtering operations could complete out of order, causing stale filter results to overwrite newer ones when multiple filter changes happened rapidly.

**Why it occurred:**
The async filtering didn't use proper cancellation/abort logic, allowing slower operations to complete after faster ones and overwrite the state with outdated results.

**How I fixed it:**
Implemented `useAsyncMemo` hook with AbortController support to cancel previous filtering operations when new ones start, ensuring only the latest filter results are applied.

---

### Bug 4: Excessive Re-renders During Search

**What the bug was:**
The search input was filtering events on every keystroke, causing unnecessary re-renders and poor performance with large event lists.

**Why it occurred:**
Search filtering was applied directly to the search input change without debouncing, triggering expensive filter operations on every character typed.

**How I fixed it:**
Added `useDebouncedValue` hook with 300ms delay to debounce search input, reducing filtering operations and improving performance during typing.

---

## Part 2: Build Challenge

### Architecture Decisions

The LogStreamViewer uses a component-based architecture with clear separation of concerns:

- **Virtual Scrolling**: Implemented with `react-window` FixedSizeList for efficient rendering of large log datasets (10,000+ entries)
- **State Management**: Local state for filters, search, and scroll position with optimized re-renders
- **Performance Hooks**: Custom hooks (`useDebouncedValue`, `useAsyncMemo`) for debouncing and async operations
- **Modular Components**: Separate components for LevelToggles, SearchBox, and LogRow for maintainability

### Performance Optimizations

- **Virtualization**: Only renders visible rows plus overscan (8 rows) to handle 10k+ logs efficiently
- **Debounced Search**: 200ms debounce prevents excessive filtering operations during typing
- **Precomputed Data**: Lowercase message precomputation (`_lc` field) for fast case-insensitive search
- **Memoization**: Extensive use of `useMemo` for filtered indices, item data, and computed values
- **Batch Updates**: Timer-based log generation batches updates to reduce React reconciliation overhead
- **Optimized Filtering**: Tight loops with early returns avoid unnecessary allocations

### Trade-offs

- **Virtual Scrolling Complexity**: Added complexity with react-window but necessary for large datasets
- **Memory Bounds**: Limited to 50,000 logs maximum to prevent unbounded memory growth in long sessions
- **Debounce Delay**: 200ms search debounce improves performance but adds slight input lag
- **Fixed Row Heights**: Assumes consistent row heights for virtualization simplicity

### AI Usage

Used AI assistance for:
- Identifying optimal React patterns for performance-critical components
- Implementing advanced hooks like `useAsyncMemo` with proper cancellation
- Optimizing the filtering algorithm to avoid allocations in tight loops
- Structuring the virtual scrolling implementation with react-window
