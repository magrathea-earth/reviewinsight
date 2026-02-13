"use client"

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { ProjectTabs } from "@/components/project-tabs";
import { InsightBullet } from "@/components/insight-bullet";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { RefreshCw, ArrowUpRight, Filter, Download, Loader2, ChevronDown, User, Quote, AlertCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { UpgradeModal } from "@/components/upgrade-modal";

export default function ProjectPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
    const [typeFilter, setTypeFilter] = useState("all");
    const [periodFilter, setPeriodFilter] = useState("all");
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        console.log(">>> LOADING PROJECT UI V3.1.2 <<<");
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
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!project || project.error) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Project not found</h2>
                    <p className="text-muted-foreground">The project you are looking for does not exist or you don't have access.</p>
                </div>
            </div>
        );
    }

    const stats = project.stats;
    const bullets = project.bullets;

    const getPlatformDisplay = (sources: any[]) => {
        if (!sources || sources.length === 0) return null;
        const platform = sources[0].platform;

        let icon = null;
        let name = "";

        if (platform === 'GOOGLE_PLAY') {
            name = "Google Play";
            icon = (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.012 11.968l5.247-3.036c.604-.347.604-.908 0-1.256l-.057-.033L4.992.518a.637.637 0 00-.332-.088.66.66 0 00-.472.197L15.012 11.968z" fill="#4CAF50" />
                    <path d="M15.012 11.968L4.188 22.793c.123.128.293.207.472.207.116 0 .23-.033.332-.093l15.207-8.807c.306-.177.492-.496.492-.857s-.186-.68-.492-.857L15.012 11.968z" fill="#FFC107" />
                    <path d="M.663 3.687v16.626c0 .366.195.698.508.868l.495.272 13.346-13.346L4.188 1.206l-.495.272a.985.985 0 00-.508.868z" fill="#2196F3" />
                    <path d="M15.012 11.968L1.666 21.453c-.313-.17-.508-.502-.508-.868V3.687c0-.366.195-.698.508-.868l13.346 9.149z" fill="#F44336" />
                </svg>
            );
        } else if (platform === 'APP_STORE') {
            name = "App Store";
            icon = (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.82a3.69 3.69 0 00-1.273 3.74c1.339.104 2.715-.715 3.559-1.73z" />
                </svg>
            );
        } else if (platform === 'INSTAGRAM') {
            name = "Instagram";
            icon = (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        } else if (platform === 'X') {
            name = "X";
            icon = (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153ZM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644Z" />
                </svg>
            );
        }

        return (
            <div className="flex items-center gap-2 bg-accent/50 px-3 py-1.5 rounded-lg border">
                {icon}
                <span className="text-sm font-semibold">{name}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-background">
            <Sidebar />
            <ProjectTabs projectId={params.id} />

            <main className="flex-1 overflow-y-auto px-4 py-8 md:px-10 md:py-12">
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-6 md:gap-0">
                    <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">Project</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{project.name}</h1>
                            <div className="flex">
                                {getPlatformDisplay(project.sources)}
                            </div>
                        </div>
                        <div className="text-muted-foreground mt-2 text-sm md:text-base">Customer sentiment across all platforms.</div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button
                            className="gap-2 premium w-full sm:w-auto"
                            onClick={async () => {
                                try {
                                    const res = await fetch('/api/sync', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ projectId: project.id })
                                    });
                                    if (res.ok) {
                                        toast({ title: "Sync started!", description: "Refreshing project data..." });
                                    } else if (res.status === 429) {
                                        const errorData = await res.json();
                                        setUpgradeMessage(errorData.message);
                                        setUpgradeModalOpen(true);
                                    } else {
                                        toast({ title: "Failed to start sync", variant: "destructive" });
                                    }
                                } catch (e) {
                                    toast({ title: "An error occurred", variant: "destructive" });
                                }
                            }}
                        >
                            <RefreshCw className="w-4 h-4" /> Sync Now
                        </Button>
                    </div>
                </header>

                {/* KPI Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-16">
                    {stats.map((stat: any, i: number) => (
                        <div key={i} className={cn(
                            "flex flex-col p-4 bg-accent/10 border rounded-xl md:p-0 md:bg-transparent md:border-0 md:rounded-none",
                            i === 2 && "col-span-2 md:col-span-1" // Last KPI spans 2 cols on mobile
                        )}>
                            <span className="text-xs md:text-sm text-muted-foreground mb-1 font-medium">{stat.label}</span>
                            <span className={cn("text-2xl md:text-3xl font-bold tracking-tight", stat.color)}>{stat.value}</span>
                            <span className="text-[10px] md:text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                {stat.sub}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Main Content Sections */}
                <section className="space-y-16 max-w-5xl">

                    {/* Latest Review Highlight */}
                    {project.recentReviews && project.recentReviews.length > 0 ? (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Latest Customer Feedback
                            </h2>
                            <a
                                href={project.recentReviews[0].url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    "block relative group overflow-hidden bg-accent/30 border border-primary/20 rounded-xl px-4 py-4 md:px-5 md:py-4 shadow-sm transition-all duration-300",
                                    project.recentReviews[0].url ? "hover:bg-accent/50 hover:border-primary/40 cursor-pointer" : "cursor-default"
                                )}
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Quote className="w-8 h-8 rotate-180" />
                                </div>
                                <div className="relative z-10 text-pretty">
                                    <div className="flex items-center gap-1.5 mb-2 text-primary">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <div key={s} className={cn("w-1 h-1 rounded-full", s <= (project.recentReviews[0].rating || 0) ? "bg-primary" : "bg-primary/20")} />
                                        ))}
                                        <span className="text-[9px] font-bold ml-1 uppercase tracking-widest">{project.recentReviews[0].platform}</span>
                                    </div>
                                    <p className="text-sm mb-3 leading-relaxed text-foreground/90 font-medium italic">
                                        "{project.recentReviews[0].text}"
                                    </p>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <User className="w-3 h-3 text-primary" />
                                            </div>
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="font-bold text-xs truncate">{project.recentReviews[0].author}</div>
                                                <div className="text-[10px] text-muted-foreground shrink-0">• {project.recentReviews[0].date}</div>
                                            </div>
                                        </div>
                                        {project.recentReviews[0].url && (
                                            <ArrowUpRight className="hidden sm:block w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                        )}
                                    </div>
                                </div>
                            </a>

                            {/* Show All Reviews Toggle */}
                            <div className="flex flex-col items-center gap-4 pt-4">
                                <Button
                                    variant="ghost"
                                    className="gap-2 text-muted-foreground hover:text-primary group w-full sm:w-auto"
                                    onClick={() => setShowAllReviews(!showAllReviews)}
                                >
                                    <span>{showAllReviews ? "Hide all reviews" : "See all fetched reviews"}</span>
                                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", showAllReviews && "rotate-180")} />
                                </Button>
                            </div>

                            {showAllReviews && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center justify-end gap-3 px-3 py-3 md:px-4 md:py-3 bg-accent/5 border rounded-xl">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            <Filter className="w-3 h-3" /> Filters:
                                        </div>

                                        <div className="flex bg-background border rounded-lg p-0.5 overflow-x-auto no-scrollbar">
                                            {[
                                                { label: "All", value: "all" },
                                                { label: "Today", value: "today" },
                                                { label: "Week", value: "week" },
                                                { label: "Month", value: "month" },
                                            ].map((p) => (
                                                <button
                                                    key={p.value}
                                                    onClick={() => {
                                                        setPeriodFilter(p.value);
                                                    }}
                                                    className={cn(
                                                        "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all whitespace-nowrap",
                                                        periodFilter === p.value ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-muted-foreground"
                                                    )}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="hidden md:block h-4 w-px bg-border mx-1" />

                                        <select
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                            className="bg-background border rounded-lg px-2 py-1 text-xs outline-none focus:border-primary cursor-pointer font-bold h-9 md:h-7 w-full md:w-auto"
                                        >
                                            <option value="all">All Feedback</option>
                                            <option value="good">Good Reviews (4-5★)</option>
                                            <option value="bad">Bad Reviews (1-3★)</option>
                                        </select>
                                        {(typeFilter !== "all" || periodFilter !== "all") && (
                                            <button
                                                onClick={() => { setTypeFilter("all"); setPeriodFilter("all"); }}
                                                className="text-[10px] text-primary hover:underline font-bold text-center py-1"
                                            >
                                                RESET
                                            </button>
                                        )}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden lg:block bg-accent/10 rounded-2xl overflow-hidden border">
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                                                <tr className="border-b bg-background/50">
                                                    <th className="px-6 py-4">Review</th>
                                                    <th className="px-6 py-4">Platform</th>
                                                    <th className="px-6 py-4 text-center">Rating</th>
                                                    <th className="px-6 py-4">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {project.recentReviews?.filter((r: any) => {
                                                    const reviewDate = new Date(r.dateISO || r.date);
                                                    const now = new Date();

                                                    // Period Filtering
                                                    let matchesPeriod = true;
                                                    if (periodFilter === "today") {
                                                        matchesPeriod = reviewDate.toDateString() === now.toDateString();
                                                    } else if (periodFilter === "week") {
                                                        const weekAgo = new Date();
                                                        weekAgo.setDate(now.getDate() - 7);
                                                        matchesPeriod = reviewDate >= weekAgo;
                                                    } else if (periodFilter === "month") {
                                                        const monthAgo = new Date();
                                                        monthAgo.setMonth(now.getMonth() - 1);
                                                        matchesPeriod = reviewDate >= monthAgo;
                                                    }

                                                    const isGood = (r.rating && r.rating >= 4) || r.sentiment === 'POS';
                                                    const matchesType = typeFilter === "all" || (typeFilter === "good" ? isGood : !isGood);

                                                    return matchesPeriod && matchesType;
                                                }).map((review: any, i: number) => (
                                                    <tr key={i} className="hover:bg-accent/40 transition-colors">
                                                        <td className="px-6 py-5 max-w-md">
                                                            <div className={cn("font-medium transition-all duration-300", !expandedReviews[i] && "line-clamp-2")}>
                                                                {review.url ? (
                                                                    <a href={review.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline transition-colors">
                                                                        {review.text}
                                                                    </a>
                                                                ) : review.text}
                                                            </div>
                                                            <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                                                                <span>User: {review.author}</span>
                                                                {review.text.length > 100 && (
                                                                    <button
                                                                        onClick={() => setExpandedReviews(prev => ({ ...prev, [i]: !prev[i] }))}
                                                                        className="text-primary font-bold hover:underline"
                                                                    >
                                                                        {expandedReviews[i] ? "Show less" : "Show more"}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-0">{review.platform}</Badge>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <div className="flex justify-center gap-0.5">
                                                                {[1, 2, 3, 4, 5].map(s => (
                                                                    <div key={s} className={cn("w-1.5 h-1.5 rounded-full", s <= (review.rating || 0) ? "bg-red-500" : "bg-muted")} />
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-muted-foreground whitespace-nowrap">{review.date}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile/Tablet Card View */}
                                    <div className="lg:hidden space-y-4">
                                        {project.recentReviews?.filter((r: any) => {
                                            const reviewDate = new Date(r.dateISO || r.date);
                                            const now = new Date();

                                            // Period Filtering
                                            let matchesPeriod = true;
                                            if (periodFilter === "today") {
                                                matchesPeriod = reviewDate.toDateString() === now.toDateString();
                                            } else if (periodFilter === "week") {
                                                const weekAgo = new Date();
                                                weekAgo.setDate(now.getDate() - 7);
                                                matchesPeriod = reviewDate >= weekAgo;
                                            } else if (periodFilter === "month") {
                                                const monthAgo = new Date();
                                                monthAgo.setMonth(now.getMonth() - 1);
                                                matchesPeriod = reviewDate >= monthAgo;
                                            }

                                            const isGood = (r.rating && r.rating >= 4) || r.sentiment === 'POS';
                                            const matchesType = typeFilter === "all" || (typeFilter === "good" ? isGood : !isGood);

                                            return matchesPeriod && matchesType;
                                        }).map((review: any, i: number) => (
                                            <div key={i} className="bg-card border rounded-xl px-4 py-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <div key={s} className={cn("w-1.5 h-1.5 rounded-full", s <= (review.rating || 0) ? "bg-red-500" : "bg-muted")} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground font-medium uppercase">{review.date}</span>
                                                </div>
                                                <div className={cn("text-sm leading-relaxed", !expandedReviews[i] && "line-clamp-3")}>
                                                    {review.text}
                                                </div>
                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-0 text-[9px] px-1.5 py-0">{review.platform}</Badge>
                                                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{review.author}</span>
                                                    </div>
                                                    {review.text.length > 100 && (
                                                        <button
                                                            onClick={() => setExpandedReviews(prev => ({ ...prev, [i]: !prev[i] }))}
                                                            className="text-[10px] text-primary font-bold hover:underline"
                                                        >
                                                            {expandedReviews[i] ? "Less" : "More"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-accent/10 border border-dashed rounded-2xl py-12 px-6 text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto opacity-50">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">No reviews found yet</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                                    Sync your project to pull the latest reviews from your connected data sources.
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => (document.querySelector('.premium') as any)?.click()}>
                                Sync Now
                            </Button>
                        </div>
                    )}

                </section>
            </main>
            <UpgradeModal
                isOpen={upgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
                title="Rate Limit Reached"
                description={upgradeMessage || "You've reached the sync limit for the Free plan. Upgrade to Pro for unlimited syncs."}
            />
        </div>
    );
}

