"use client"

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Filter, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewDetail } from "@/components/review-detail";

export default function ProjectBadReviewsPage({ params }: { params: { id: string } }) {
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetch(`/api/projects/${params.id}`)
            .then(res => res.json())
            .then(data => {
                setProject(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load project", err);
                setLoading(false);
            });
    }, [params.id]);

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

    if (!project || project.error) return <div>Project not found</div>;

    // Filter for bad reviews (Rating <= 3)
    const badReviews = project.recentReviews?.filter((r: any) =>
        (r.rating && r.rating <= 3) || r.sentiment === 'NEG'
    ).filter((r: any) =>
        r.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.author.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-y-auto px-10 py-12">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{project.name}</div>
                        <h1 className="text-4xl font-bold tracking-tight">Bad Reviews</h1>
                        <p className="text-muted-foreground mt-2">Feedback items flagged as poor or negative for this project.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search bad reviews..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-accent/20 border-transparent rounded-xl pl-10 pr-4 py-2 text-sm focus:bg-background focus:border-primary transition-all outline-none w-64"
                            />
                        </div>
                        <Button variant="outline" className="gap-2">
                            <Filter className="w-4 h-4" /> Filter
                        </Button>
                    </div>
                </header>

                <section className="bg-accent/5 rounded-2xl border overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                            <tr className="border-b bg-background/50">
                                <th className="px-6 py-4">Review Content</th>
                                <th className="px-6 py-4">Source</th>
                                <th className="px-6 py-4 text-center">Score</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {badReviews.map((review: any, i: number) => (
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
                                        <Badge variant="secondary" className="bg-accent text-accent-foreground border-0 font-bold text-[10px] uppercase tracking-tighter">
                                            {review.platform}
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
                            {badReviews.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground text-lg">
                                        No bad reviews found. Everything looks great! 🌟
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
