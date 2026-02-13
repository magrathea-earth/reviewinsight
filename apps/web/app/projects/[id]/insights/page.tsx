"use client"

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { ProjectTabs } from "@/components/project-tabs";
import { InsightBullet } from "@/components/insight-bullet";
import { Loader2, Sparkles, TrendingDown, Target, Zap, Lightbulb, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectInsightsPage({ params }: { params: { id: string } }) {
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

    const criticisms = project.criticisms || { summary: "No critical feedback yet.", bullets: [], suggestions: [] };
    const bullets = criticisms.bullets || [];
    const suggestions = criticisms.suggestions || [];

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-background">
            <Sidebar />
            <ProjectTabs projectId={params.id} />

            <main className="flex-1 overflow-y-auto px-4 py-8 md:px-10 md:py-12">
                <header className="mb-8 md:mb-10">
                    <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{project.name}</div>
                    <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">AI Insights</h1>
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 md:p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10 hidden sm:block">
                            <Sparkles className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" /> AI Executive Summary
                        </h2>
                        <p className="text-base md:text-xl font-medium leading-relaxed text-foreground max-w-3xl text-pretty">
                            {criticisms.summary}
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-12">
                    <div className="bg-accent/10 border p-5 md:p-6 rounded-2xl flex flex-col gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                            <TrendingDown className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Top Complaint</div>
                            <div className="text-lg md:text-xl font-black mt-1 text-red-500 leading-tight">{bullets[0]?.title || "N/A"}</div>
                        </div>
                    </div>
                    <div className="bg-accent/10 border p-5 md:p-6 rounded-2xl flex flex-col gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Target className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Improvement Focus</div>
                            <div className="text-lg md:text-xl font-black mt-1 leading-tight">{bullets[1]?.title || "N/A"}</div>
                        </div>
                    </div>
                    <div className="bg-accent/10 border p-5 md:p-6 rounded-2xl flex flex-col gap-4">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                            <Zap className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Quick Win</div>
                            <div className="text-lg md:text-xl font-black mt-1 text-yellow-600 leading-tight">{bullets[2]?.title || "N/A"}</div>
                        </div>
                    </div>
                </div>

                <section className="space-y-8 max-w-5xl">
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold tracking-tight">Identified Themes</h2>
                    </div>

                    {bullets.length > 0 ? (
                        <div className="grid gap-4 md:gap-6">
                            {bullets.map((bullet: any, i: number) => (
                                <div key={i} className="bg-accent/5 border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors">
                                    <InsightBullet {...bullet} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-accent/5 rounded-3xl border border-dashed">
                            <div className="text-muted-foreground">No analysis available yet.</div>
                            <p className="text-sm text-muted-foreground/60 mt-2">Sync your project data to trigger the AI analysis engine.</p>
                        </div>
                    )}

                    {/* AI Suggestions Section */}
                    <div className="pt-12 mt-12 border-t">
                        <div className="flex items-center gap-2 mb-8">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            <h2 className="text-xl font-bold tracking-tight">Top AI Suggestions for You</h2>
                        </div>

                        {suggestions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {suggestions.map((s: string, i: number) => (
                                    <div key={i} className="relative group bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-2xl p-6 transition-all duration-300">
                                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-background border border-primary/20 rounded-full flex items-center justify-center text-xs font-black shadow-sm group-hover:scale-110 transition-transform">
                                            {i + 1}
                                        </div>
                                        <div className="flex flex-col h-full">
                                            <div className="mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                                                    {s.split(':')[0]}
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground leading-relaxed">
                                                {s.includes(':') ? s.split(':')[1].trim() : "Actionable improvement based on recent critical feedback."}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-accent/5 border border-dashed rounded-3xl py-12 text-center">
                                <div className="text-muted-foreground font-medium italic">No specific suggestions analyzed yet.</div>
                                <p className="text-xs text-muted-foreground/60 mt-2">Hit "Sync Now" on the Overview page to generate fresh AI suggestions.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
