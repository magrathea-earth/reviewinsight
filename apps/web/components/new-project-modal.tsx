"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Smartphone, MessageCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate?: (name: string, platform: string, configInput: string) => void;
}

export function NewProjectModal({ isOpen, onClose, onCreate }: NewProjectModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [platform, setPlatform] = useState<string | null>(null);
    const [projectName, setProjectName] = useState("");
    const [configValue, setConfigValue] = useState("");

    const platforms = [
        {
            id: "google",
            name: "Google Play",
            logo: (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.60938 20.8805C3.3855 21.1118 3.14175 21.3148 2.87285 21.4939C2.45785 21.7616 2.0125 21.8488 1.5975 21.727C1.1825 21.6052 0.8175 21.284 0.5425 20.8262C-0.0075 19.9105 -0.0075 18.784 -0.0075 16.5312V7.46875C-0.0075 5.21602 -0.0075 4.08965 0.5425 3.17383C0.8175 2.71602 1.1825 2.39482 1.5975 2.27305C2.0125 2.15127 2.45785 2.23848 2.87285 2.50615C3.14175 2.68523 3.3855 2.88824 3.60938 3.11953L12.4883 12L3.60938 20.8805Z" fill="#2196F3" />
                    <path d="M17.4819 6.9157L12.4883 12L17.4819 17.0843C19.1432 18.7738 19.9739 19.6186 21.011 19.4627C22.0481 19.3068 22.5833 18.2575 23.6536 16.1589C24.1165 15.251 24.1165 14.35 24.1165 12.5469V11.4531C24.1165 9.64998 24.1165 8.74842 23.6536 7.84055C22.5833 5.74195 22.0481 4.69264 21.011 4.53676C19.9739 4.38088 19.1432 5.22564 17.4819 6.9157Z" fill="#4CAF50" />
                    <path d="M12.4883 12L3.60938 3.11953C4.85465 1.83291 6.3475 1.34375 8.5 1.34375H13.5C15.6525 1.34375 17.1454 1.83291 18.3906 3.11953L12.4883 12Z" fill="#FFC107" />
                    <path d="M12.4883 12L18.3906 20.8805C17.1454 22.1671 15.6525 22.6562 13.5 22.6562H8.5C6.3475 22.6562 4.85465 22.1671 3.60938 20.8805L12.4883 12Z" fill="#F44336" />
                </svg>
            ),
            color: "bg-green-500"
        },
        /* */
        {
            id: "apple",
            name: "App Store",
            logo: (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.82a3.69 3.69 0 00-1.273 3.74c1.339.104 2.715-.715 3.559-1.73z" />
                </svg>
            ),
            color: "bg-blue-500"
        },
    ];

    const handleCreate = async () => {
        setLoading(true);
        if (onCreate) {
            await onCreate(projectName || "New Project", platform || "Unknown", configValue);
        }
        setLoading(false);
        setProjectName("");
        setConfigValue("");
        setPlatform(null);
        setStep(1);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[500px] bg-background rounded-[32px] shadow-2xl z-[110] border overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-8 overflow-y-auto">
                                <header className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight">Create Project</h2>
                                        <p className="text-sm text-muted-foreground">Step {step} of 2</p>
                                    </div>
                                    <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </header>

                                {step === 1 ? (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <label className="text-sm font-bold ml-1">Project Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Acme Mobile App"
                                                value={projectName}
                                                onChange={(e) => setProjectName(e.target.value)}
                                                className="w-full bg-accent/30 border-transparent rounded-2xl px-5 py-3.5 text-sm focus:bg-background focus:border-primary transition-all outline-none"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-sm font-bold ml-1">Select Primary Platform</label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {platforms.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => setPlatform(p.id)}
                                                        className={cn(
                                                            "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                                                            platform === p.id ? "border-primary bg-primary/5" : "border-transparent bg-accent/20 hover:bg-accent/30"
                                                        )}
                                                    >
                                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", p.color)}>
                                                            {p.logo}
                                                        </div>
                                                        <span className="font-bold">{p.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full h-12 rounded-2xl premium font-bold mt-4"
                                            disabled={!platform}
                                            onClick={() => setStep(2)}
                                        >
                                            Next Step <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-4 text-center py-4">
                                            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
                                                <Globe className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-lg font-bold">Connect your platform</h3>
                                            <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
                                                Enter the account handle or profile URL you want ReviewInsight to monitor.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                placeholder={
                                                    platform === 'google' ? "com.example.app" :
                                                        platform === 'apple' ? "83485435" :
                                                            "https://..."
                                                }
                                                value={configValue}
                                                onChange={(e) => setConfigValue(e.target.value)}
                                                className="w-full bg-accent/30 border-transparent rounded-2xl px-5 py-3.5 text-sm focus:bg-background focus:border-primary transition-all outline-none"
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-bold" onClick={() => setStep(1)}>
                                                Back
                                            </Button>
                                            <Button className="flex-[2] h-12 rounded-2xl premium font-bold" onClick={handleCreate} disabled={loading}>
                                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Analyzing"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
