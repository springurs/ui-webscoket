"use client";

export default function BuildChallengePage() {
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

            {/* Candidate implements LogStreamViewer here */}
            <div className="mt-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
                Import and render your LogStreamViewer component here
            </div>
        </div>
    );
}
