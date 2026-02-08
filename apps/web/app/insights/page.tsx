"use client"

import { Sidebar } from "@/components/sidebar";
import { InsightBullet } from "@/components/insight-bullet";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter } from "lucide-react";

export default function InsightsPage() {
    const bullets = [
        {
            title: "Navigation is Non-Intuitive",
            details: "Users are struggling to find the 'Settings' and 'Profile' menus within the main dashboard.",
            count: 142,
            platforms: ["GOOGLE_PLAY", "X"],
            trend: "up" as const,
            examples: [
                { snippet: "I spent 10 minutes trying to find how to change my password lol", platform: "X" },
                { snippet: "Menu is hidden behind too many taps.", platform: "GOOGLE_PLAY" },
            ]
        },
        {
            title: "Subscription Pricing Feedback",
            details: "A significant number of users find the 'Pro' plan overpriced for personal use.",
            count: 89,
            platforms: ["INSTAGRAM"],
            trend: "steady" as const,
            examples: [
                { snippet: "Why $20/mo just for basic insights?", platform: "INSTAGRAM" },
            ]
        }
    ];

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-y-auto px-10 py-12">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">AI Insights</h1>
                        <p className="text-muted-foreground mt-2">Deep-dive into what your customers are saying.</p>
                    </div>

                    <Button className="gap-2 premium">
                        <RefreshCw className="w-4 h-4" /> Recalculate
                    </Button>
                </header>

                <section className="space-y-12 max-w-5xl">
                    <div>
                        <div className="flex items-center justify-between mb-8 border-b pb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Top Issues
                                <span className="text-xs font-normal bg-accent px-2 py-0.5 rounded-full text-muted-foreground">Across all projects</span>
                            </h2>
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                                <Filter className="w-3.5 h-3.5" /> Filter
                            </Button>
                        </div>

                        <div className="divide-y border-t border-b">
                            {bullets.map((bullet, i) => (
                                <InsightBullet key={i} {...bullet} />
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
