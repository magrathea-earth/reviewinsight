"use client"

import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Settings2, ExternalLink, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { NewProjectModal } from "@/components/new-project-modal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpgradeModal } from "@/components/upgrade-modal";

export default function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/projects")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setProjects(data);
                } else {
                    console.error("Expected array but got:", data);
                    setProjects([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load projects", err);
                setProjects([]);
                setLoading(false);
            });
    }, []);

    const handleAddProject = async (name: string, platform: string, configInput?: string) => {
        try {
            const platformMap: Record<string, string> = {
                'google': 'GOOGLE_PLAY',
                'apple': 'APP_STORE',
                'instagram': 'INSTAGRAM',
                'twitter': 'X'
            };

            const dbPlatform = platformMap[platform] || platform;

            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    platform: dbPlatform,
                    config: dbPlatform === 'GOOGLE_PLAY' ? { packageName: configInput } :
                        dbPlatform === 'APP_STORE' ? { appId: configInput } :
                            dbPlatform === 'INSTAGRAM' ? { postUrls: [configInput] } :
                                { query: configInput }
                })
            });

            if (res.status === 403) {
                const errorData = await res.json();
                console.log("[Dashboard] 403 Error Data:", errorData);
                if (errorData.code === "LIMIT_REACHED") {
                    setUpgradeModalOpen(true);
                    return;
                }
            }

            const newProject = await res.json();

            if (res.status !== 200) {
                alert(`Error: ${newProject.error || "Failed to create project"}`);
                return;
            }

            // Refetch to get formatted stats
            const refreshRes = await fetch("/api/projects");
            const refreshedData = await refreshRes.json();
            if (Array.isArray(refreshedData)) {
                setProjects(refreshedData);
            }

            setIsModalOpen(false);

            // Trigger initial sync (non-blocking)
            fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId: newProject.id })
            }).catch(e => console.error("Initial sync error", e));

        } catch (err) {
            console.error("Failed to create project", err);
        }
    };

    const getPlatformLogo = (project: any) => {
        const platform = project.sources?.[0]?.platform;

        const logoClasses = "w-6 h-6";

        if (platform === 'GOOGLE_PLAY') {
            return (
                <svg viewBox="0 0 24 24" className={logoClasses} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.012 11.968l5.247-3.036c.604-.347.604-.908 0-1.256l-.057-.033L4.992.518a.637.637 0 00-.332-.088.66.66 0 00-.472.197L15.012 11.968z" fill="#4CAF50" />
                    <path d="M15.012 11.968L4.188 22.793c.123.128.293.207.472.207.116 0 .23-.033.332-.093l15.207-8.807c.306-.177.492-.496.492-.857s-.186-.68-.492-.857L15.012 11.968z" fill="#FFC107" />
                    <path d="M.663 3.687v16.626c0 .366.195.698.508.868l.495.272 13.346-13.346L4.188 1.206l-.495.272a.985.985 0 00-.508.868z" fill="#2196F3" />
                    <path d="M15.012 11.968L1.666 21.453c-.313-.17-.508-.502-.508-.868V3.687c0-.366.195-.698.508-.868l13.346 9.149z" fill="#F44336" />
                </svg>
            );
        } else if (platform === 'APP_STORE') {
            return (
                <svg viewBox="0 0 24 24" className={logoClasses} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.82a3.69 3.69 0 00-1.273 3.74c1.339.104 2.715-.715 3.559-1.73z" />
                </svg>
            );
        } else if (platform === 'INSTAGRAM') {
            return (
                <svg viewBox="0 0 24 24" className={logoClasses} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        } else if (platform === 'X') {
            return (
                <svg viewBox="0 0 24 24" className={logoClasses} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153ZM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644Z" />
                </svg>
            );
        }

        return <span className="text-lg">{project.name.charAt(0)}</span>;
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-y-auto px-10 py-12">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Projects</h1>
                        <p className="text-muted-foreground mt-2">Manage your products and data sources.</p>
                    </div>

                    <Button className="gap-2 premium" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4" /> New Project
                    </Button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.isArray(projects) && projects.map((project) => (
                        <Link key={project.id} href={`/projects/${project.id}`}>
                            <div className="group border rounded-2xl p-6 bg-card hover:border-primary/50 transition-all hover:shadow-[0_0_20px_rgba(0,0,0,0.03)] relative overflow-hidden min-h-[220px] flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center font-bold text-primary">
                                        {getPlatformLogo(project)}
                                    </div>
                                    <div className="flex items-center gap-2 relative" onClick={(e) => e.preventDefault()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-1 hover:bg-accent rounded-full transition-colors">
                                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive cursor-pointer group"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // prevent navigation
                                                        if (confirm(`Are you sure you want to delete "${project.name}"? This cannot be undone.`)) {
                                                            fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
                                                                .then(res => {
                                                                    if (res.ok) {
                                                                        setProjects(projects.filter(p => p.id !== project.id));
                                                                    } else {
                                                                        alert("Failed to delete project");
                                                                    }
                                                                });
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">{project.name}</h3>
                                <div className="text-sm text-muted-foreground mb-6">
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {project.sources && project.sources.map((s: any, idx: number) => (
                                            <span key={idx} className="text-xs bg-accent/50 px-1.5 py-0.5 rounded font-medium">
                                                {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t pt-4 text-xs font-medium">
                                    <span className="text-muted-foreground">Last sync {project.lastSync}</span>
                                    <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        View Insights <ExternalLink className="w-3 h-3" />
                                    </div>
                                </div>

                                {/* Subtle background decoration */}
                                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                            </div>
                        </Link>
                    ))}

                    <div
                        onClick={() => setIsModalOpen(true)}
                        className="border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-accent/20 transition-colors cursor-pointer min-h-[220px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                            <Plus className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-bold">Add another project</p>
                            <p className="text-sm text-muted-foreground">Track more products or apps.</p>
                        </div>
                    </div>
                </div>
            </main>

            <NewProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleAddProject}
            />
            <UpgradeModal
                isOpen={upgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
                title="Limit Reached"
                description="You've reached the 1-project limit on the Free tier. Upgrade to Pro to create unlimited projects."
            />
        </div>
    );
}
