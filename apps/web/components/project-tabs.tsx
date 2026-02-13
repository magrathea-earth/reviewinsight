"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShieldAlert, Sparkles } from "lucide-react";

export function ProjectTabs({ projectId }: { projectId: string }) {
    const pathname = usePathname();

    const items = [
        { name: "Overview", href: `/projects/${projectId}`, icon: LayoutDashboard, exact: true },
        { name: "AI Insights", href: `/projects/${projectId}/insights`, icon: ShieldAlert },
        { name: "Success Stories", href: `/projects/${projectId}/positive`, icon: Sparkles },
    ];

    return (
        <div className="md:hidden sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b">
            <div className="flex px-2 overflow-x-auto no-scrollbar">
                {items.map((item) => {
                    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-wider transition-all border-b-2 whitespace-nowrap",
                                isActive
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-3.5 h-3.5" />
                            {item.name}
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
