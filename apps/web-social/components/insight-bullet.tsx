"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageSquare, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

interface InsightBulletProps {
    title: string;
    details: string;
    count: number;
    platforms?: string[];
    examples: (string | { snippet: string; url?: string; platform: string })[];
    trend?: "up" | "down" | "steady";
}

export function InsightBullet({ title, details, count, platforms, examples, trend }: InsightBulletProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="group border-b last:border-0">
            <div
                className="py-6 cursor-pointer flex items-start justify-between gap-4"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                        {trend === "up" && (
                            <Badge variant="destructive" className="gap-1 bg-red-500/10 text-red-500 border-0">
                                <TrendingUp className="w-3 h-3" /> Spiking
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground text-sm max-w-2xl">{details}</p>

                    <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Mentioned by {count} users</span>
                        </div>
                        <div className="flex gap-2">
                            {platforms?.map(p => (
                                <span key={p} className="px-1.5 py-0.5 bg-accent rounded uppercase text-[10px] font-bold tracking-wider">
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-transform",
                    isExpanded ? "rotate-180" : "group-hover:bg-accent"
                )}>
                    <ChevronDown className="w-5 h-5" />
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="pb-6 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Example Snippets</h4>
                            <div className="grid gap-3">
                                {examples.map((ex, i) => {
                                    const snippet = typeof ex === 'string' ? ex : ex.snippet;
                                    const url = typeof ex === 'string' ? null : ex.url;
                                    return (
                                        <div key={i} className="bg-accent/30 p-4 rounded-xl relative group/item">
                                            <p className="text-sm italic text-foreground/80 leading-relaxed">"{snippet}"</p>
                                            {url && (
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    className="absolute top-4 right-4 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                >
                                                    <ExternalLink className="w-4 h-4 text-primary" />
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
