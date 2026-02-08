"use client"

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Filter, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewDetail } from "@/components/review-detail";

export default function GlobalBadReviewsPage() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        // Fetch projects first, then aggregate all poor reviews
        // This is a bit heavy but works for now as a "Workspace" view
        fetch("/api/projects")
            .then(res => res.json())
            .then(async (projects) => {
                if (!Array.isArray(projects)) {
                    setReviews([]);
                    setLoading(false);
                    return;
                }

                const allPoorReviews: any[] = [];
                for (const p of projects) {
                    try {
                        const res = await fetch(`/api/projects/${p.id}`);
                        const data = await res.json();
                        if (data.recentReviews) {
                            const poor = data.recentReviews.filter((r: any) =>
                                (r.rating && r.rating <= 3) || r.sentiment === 'NEG'
                            ).map((r: any) => ({ ...r, projectName: data.name }));
                            allPoorReviews.push(...poor);
                        }
                    } catch (e) {
                        console.error(`Failed to fetch reviews for project ${p.id}`, e);
                    }
                }

                // Sort by date (descending)
                allPoorReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setReviews(allPoorReviews);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load workspace reviews", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex bg-background min-h-screen">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    const filteredReviews = reviews.filter(r =>
        r.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-y-auto px-10 py-12">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Workspace Bad Reviews</h1>
                        <p className="text-muted-foreground mt-2">Aggregated critical feedback across all your projects.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search all bad reviews..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-accent/20 border-transparent rounded-xl pl-10 pr-4 py-2 text-sm focus:bg-background focus:border-primary transition-all outline-none w-64"
                            />
                        </div>
                    </div>
                </header>

                <section className="bg-accent/5 rounded-2xl border overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                            <tr className="border-b bg-background/50">
                                <th className="px-6 py-4">Review Content</th>
                                <th className="px-6 py-4">Project</th>
                                <th className="px-6 py-4 text-center">Score</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredReviews.map((review: any, i: number) => (
                                <tr
                                    key={i}
                                    className="hover:bg-accent/40 transition-colors group cursor-pointer"
                                    onClick={() => setSelectedReview(review)}
                                >
                                    <td className="px-6 py-5 max-w-xl">
                                        <div className="font-medium leading-relaxed">{review.text}</div>
                                        <div className="text-xs text-muted-foreground mt-1">User: {review.author}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                                            {review.projectName}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex justify-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <div
                                                    key={s}
                                                    className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        s <= (review.rating || 0) ? "bg-red-500" : "bg-muted"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-muted-foreground whitespace-nowrap">{review.date}</td>
                                    <td className="px-6 py-5 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (review.url) window.open(review.url, '_blank');
                                            }}
                                        >
                                            <ArrowUpRight className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredReviews.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground text-lg">
                                        No bad reviews found in your entire workspace! 🌟
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>
            </main>

            <ReviewDetail review={selectedReview} onClose={() => setSelectedReview(null)} />
        </div>
    );
}
