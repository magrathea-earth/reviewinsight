"use client";

import { useState } from "react";

export default function DebugSyncPage() {
    const [projectId, setProjectId] = useState("");
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const testSync = async () => {
        if (!projectId) {
            setLogs(["❌ Please enter a project ID"]);
            return;
        }

        setLoading(true);
        setLogs(["🔄 Starting sync test..."]);

        try {
            const response = await fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId }),
            });

            const data = await response.json();

            if (response.ok) {
                setLogs((prev) => [
                    ...prev,
                    "✅ Sync API call successful",
                    `Response: ${JSON.stringify(data, null, 2)}`,
                    "",
                    "⚠️ Check your terminal (where npm run dev is running) for detailed logs:",
                    "  - [ProjectSyncer] Starting sync...",
                    "  - [ProjectSyncer] Config for X: ...",
                    "  - [XAdapter] Found X results...",
                    "  - [ProjectSyncer] Saving X items...",
                ]);
            } else {
                setLogs((prev) => [
                    ...prev,
                    `❌ Sync failed: ${data.error}`,
                    `Response: ${JSON.stringify(data, null, 2)}`,
                ]);
            }
        } catch (error: any) {
            setLogs((prev) => [
                ...prev,
                `❌ Network error: ${error.message}`,
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">🔍 Sync Debug Tool</h1>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <label className="block text-sm font-medium mb-2">
                        Project ID
                    </label>
                    <input
                        type="text"
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        placeholder="Enter your project ID"
                        className="w-full px-4 py-2 border rounded-lg mb-4"
                    />
                    <button
                        onClick={testSync}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Testing..." : "Test Sync"}
                    </button>
                </div>

                <div className="bg-gray-900 text-green-400 rounded-lg p-6 font-mono text-sm">
                    <div className="mb-2 text-gray-400">Console Output:</div>
                    {logs.length === 0 ? (
                        <div className="text-gray-500">
                            No logs yet. Enter a project ID and click "Test Sync".
                        </div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="mb-1">
                                {log}
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">📝 How to get your Project ID:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Go to your main dashboard</li>
                        <li>Open browser DevTools (F12)</li>
                        <li>Go to Console tab</li>
                        <li>Type: <code className="bg-gray-200 px-1 rounded">window.location.pathname</code></li>
                        <li>If you're on a project page, it will show: /projects/[PROJECT_ID]</li>
                        <li>Copy the PROJECT_ID part and paste it above</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
