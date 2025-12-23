import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Senior UI Developer Exam
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Time Budget: 2-4 hours • React 19 / Next.js 16 / TypeScript
          </p>
        </header>

        <div className="space-y-6">
          {/* Part 1 Card */}
          <Link
            href="/debug"
            className="block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg p-3 text-2xl">
                🐛
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Part 1: Debug Challenge
                  </h2>
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                    1-1.5 hours
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Fix 4 subtle bugs in the EventViewer component. Tests your
                  understanding of React fundamentals, closures, and effect
                  lifecycles.
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• Stale closure in event callback</li>
                  <li>• Race condition with async state updates</li>
                  <li>• Memory leak from uncleaned interval</li>
                  <li>• Unnecessary re-renders from reference inequality</li>
                </ul>
              </div>
            </div>
          </Link>

          {/* Part 2 Card */}
          <Link
            href="/build"
            className="block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg p-3 text-2xl">
                🏗️
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Part 2: Build Challenge
                  </h2>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                    1-2.5 hours
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  Build a performant log stream viewer with virtual scrolling.
                  Tests your architectural thinking and performance
                  optimization skills.
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li>• Virtual scrolling for 10,000+ logs</li>
                  <li>• Real-time updates with auto-scroll</li>
                  <li>• Search & filter with debouncing</li>
                  <li>• Performance optimization</li>
                </ul>
              </div>
            </div>
          </Link>
        </div>

        {/* Instructions */}
        <div className="mt-10 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">📋 Instructions</h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
            <li>
              <strong>1.</strong> Complete both parts in order (Part 1 first,
              then Part 2)
            </li>
            <li>
              <strong>2.</strong> Document your solutions in{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs text-gray-800 dark:text-gray-200">
                SOLUTIONS.md
              </code>
            </li>
            <li>
              <strong>3.</strong> Use React DevTools Profiler to verify
              performance
            </li>
            <li>
              <strong>4.</strong> AI tools are allowed — but understand every
              line you submit
            </li>
            <li>
              <strong>5.</strong> Submit your completed project as a zip file
            </li>
          </ul>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Good luck! 🚀
        </footer>
      </div>
    </div>
  );
}
