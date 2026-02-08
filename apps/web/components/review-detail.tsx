"use client"

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, MessageSquare, Star, Reply, ThumbsUp, AlertTriangle } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ReviewDetailProps {
    review: {
        text: string;
        platform: string;
        rating?: number;
        sentiment?: string;
        author: string;
        time: string;
    } | null;
    onClose: () => void;
}

export function ReviewDetail({ review, onClose }: ReviewDetailProps) {
    if (!review) return null;

    return (
        <AnimatePresence>
            {review && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 cursor-zoom-out"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-background shadow-2xl z-[60] border-l overflow-y-auto"
                    >
                        <div className="p-8 space-y-8">
                            <header className="flex items-center justify-between">
                                <Badge variant="outline" className="rounded-sm uppercase font-bold tracking-widest text-[10px]">
                                    Manual Audit
                                </Badge>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </header>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center font-bold text-lg">
                                        {review.author.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg">{review.author}</h2>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="uppercase font-bold tracking-tighter text-[10px] bg-accent/50 px-1.5 py-0.5 rounded">
                                                {review.platform}
                                            </span>
                                            <span>•</span>
                                            <span>{review.time}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 py-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            className={cn(
                                                "w-4 h-4",
                                                (review.rating && s <= review.rating) ? "fill-red-500 text-red-500" : "text-muted fill-muted"
                                            )}
                                        />
                                    ))}
                                    {review.sentiment === 'NEG' && (
                                        <Badge className="bg-red-500/10 text-red-500 border-0 ml-2">Negative Sentiment</Badge>
                                    )}
                                </div>

                                <div className="bg-accent/10 p-6 rounded-3xl relative">
                                    <AlertTriangle className="absolute top-2 right-2 w-4 h-4 text-red-500 opacity-20" />
                                    <p className="text-lg leading-relaxed text-foreground/90 italic">
                                        "{review.text}"
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">AI Context</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl border-2 border-dashed border-accent flex flex-col gap-2">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Category</span>
                                        <span className="font-semibold text-sm">UI/UX Issues</span>
                                    </div>
                                    <div className="p-4 rounded-2xl border-2 border-dashed border-accent flex flex-col gap-2">
                                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Urgency</span>
                                        <span className="font-semibold text-sm text-red-500">High</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 pt-8">
                                <Button className="w-full h-12 rounded-2xl gap-2 premium">
                                    <Reply className="w-4 h-4" /> Generate AI Reply
                                </Button>
                                <Button variant="outline" className="w-full h-12 rounded-2xl gap-2">
                                    <ThumbsUp className="w-4 h-4" /> Acknowledge
                                </Button>
                                <Button variant="ghost" className="w-full h-12 rounded-2xl gap-2 text-muted-foreground">
                                    <ExternalLink className="w-4 h-4" /> View Original Post
                                </Button>
                            </div>

                            <footer className="pt-12 border-t mt-12 text-center">
                                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                    <MessageSquare className="w-3 h-3" />
                                    Indexed by ReviewInsight AI v2.4
                                </div>
                            </footer>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
