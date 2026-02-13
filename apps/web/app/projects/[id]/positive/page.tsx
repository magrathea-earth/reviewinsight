"use client"

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { ProjectTabs } from "@/components/project-tabs";
import { InsightBullet } from "@/components/insight-bullet";
import { Loader2, Sparkles, TrendingUp, PartyPopper, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PositiveStoriesPage({ params }: { params: { id: string } }) {
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

    const praises = project.praises || { summary: "No positive highlights yet.", bullets: [] };
    const bullets = praises.bullets || [];

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-background">
            <Sidebar />
            <ProjectTabs projectId={params.id} />

            <main className="flex-1 overflow-y-auto px-4 py-8 md:px-10 md:py-12">
                <header className="mb-8 md:mb-10">
                    <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{project.name}</div>
                    <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-4">Positive Stories</h1>
                    <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5 md:p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10 hidden sm:block">
                            <PartyPopper className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-green-600 mb-3 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" /> Why Users Love {project.name}
                        </h2>
                        <p className="text-base md:text-xl font-medium leading-relaxed text-foreground max-w-3xl text-pretty">
                            {praises.summary}
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-12">
                    <div className="bg-accent/10 border p-5 md:p-6 rounded-2xl flex flex-col gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Top Praise</div>
                            <div className="text-lg md:text-xl font-black mt-1 text-green-600 leading-tight">{bullets[0]?.title || "N/A"}</div>
                        </div>
                    </div>
                    <div className="bg-accent/10 border p-5 md:p-6 rounded-2xl flex flex-col gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <PartyPopper className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Biggest Win</div>
                            <div className="text-lg md:text-xl font-black mt-1 leading-tight">{bullets[1]?.title || "N/A"}</div>
                        </div>
                    </div>
                    <div className="bg-accent/10 border p-5 md:p-6 rounded-2xl flex flex-col gap-4">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                            <Zap className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Growth Driver</div>
                            <div className="text-lg md:text-xl font-black mt-1 text-yellow-600 leading-tight">{bullets[2]?.title || "N/A"}</div>
                        </div>
                    </div>
                </div>

                <section className="space-y-8 max-w-5xl">
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold tracking-tight">Success Themes</h2>
                    </div>

                    {bullets.length > 0 ? (
                        <div className="grid gap-6">
                            {bullets.map((bullet: any, i: number) => (
                                <div key={i} className="bg-accent/5 border rounded-2xl overflow-hidden hover:border-green-500/30 transition-colors">
                                    <InsightBullet {...bullet} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-accent/5 rounded-3xl border border-dashed">
                            <div className="text-muted-foreground">No positive insights available yet.</div>
                            <p className="text-sm text-muted-foreground/60 mt-2">Sync your project data to allow our AI to find your success stories.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
