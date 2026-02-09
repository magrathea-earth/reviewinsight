use client";

import { motion } from "framer-motion";
import {
    BarChart3,
    Zap,
    Shield,
    TrendingUp,
    MessageSquare,
    CheckCircle2,
    ArrowRight,
    Star,
    LayoutDashboard,
    Search,
    BrainCircuit,
    MinusCircle,
    PlusCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 glass border-b">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Image src="/logo.svg" alt="ReviewInsight Logo" width={32} height={32} className="w-8 h-8 rounded-lg" />
                        <span className="text-xl font-bold tracking-tight">ReviewInsight</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                        <Link href="#problem" className="hover:text-foreground transition-colors">Problem</Link>
                        <Link href="#solution" className="hover:text-foreground transition-colors">Solution</Link>
                        <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/auth/signin"
                            className="text-sm font-medium hover:text-primary transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/auth/signin"
                            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                        >
                            Get Started
                        </Link>
                        <Link
                            href="/auth/signin"
                            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center space-y-8 mb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
                                Stop Guessing. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-blue-600">
                                    Understand Every Review.
                                </span>
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                ReviewInsight turns thousands of App Store and Google Play reviews into actionable product insights in seconds.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex items-center justify-center"
                        >
                            <Link
                                href="/auth/signin"
                                className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all shadow-xl shadow-primary/25"
                            >
                                Start Free Trial <ArrowRight className="w-5 h-5" />
                            </Link>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="relative max-w-5xl mx-auto"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 blur-[100px] -z-10" />
                        <div className="rounded-[2.5rem] border bg-card p-4 shadow-2xl overflow-hidden">
                            <Image
                                src="/hero.svg"
                                alt="ReviewInsight Dashboard Preview"
                                width={1200}
                                height={800}
                                className="rounded-[1.5rem] w-full h-auto"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Problem section */}
            <section id="problem" className="py-24 bg-secondary/50">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-16 tracking-tight">Manual Analysis is a Bottleneck</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <MinusCircle className="w-6 h-6 text-destructive" />,
                                title: "Information Overload",
                                description: "Reading thousands of reviews across 5+ platforms is physically impossible for a single human team."
                            },
                            {
                                icon: <MinusCircle className="w-6 h-6 text-destructive" />,
                                title: "Biased Insights",
                                description: "Humans naturally focus on the loudest complaints, missing subtle but critical long-term trends."
                            },
                            {
                                icon: <MinusCircle className="w-6 h-6 text-destructive" />,
                                title: "Slow Response",
                                description: "By the time you identify a critical bug from reviews, your rating has already plummeted."
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="p-8 rounded-3xl bg-background border shadow-sm text-left"
                            >
                                <div className="mb-4">{item.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Solution/Comparison section */}
            <section id="solution" className="py-24 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight leading-tight">
                                Transform Feedback <br />
                                <span className="text-primary">into Action.</span>
                            </h2>
                            <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
                                ReviewInsight uses advanced AI models to read every single word across all platforms. It doesn't just read—it understands, categorizes, and prioritizes.
                            </p>

                            <div className="space-y-6">
                                {[
                                    { title: "Universal Sync", desc: "One dashboard for App Store and Google Play reviews (Social integrations coming soon)." },
                                    { title: "Sentiment Mapping", desc: "Visualize mood trends over time with surgical precision." },
                                    { title: "AI-Driven Top 3 Fixes", desc: "Get daily recommendations on what to fix first for maximum impact." }
                                ].map((feature, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                            <PlusCircle className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold mb-1">{feature.title}</h4>
                                            <p className="text-sm text-muted-foreground">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/10 blur-3xl -z-10 rounded-full" />
                            <div className="p-8 rounded-[2rem] border bg-card/80 backdrop-blur-xl shadow-xl">
                                <div className="flex items-center justify-between mb-8 border-b pb-4">
                                    <span className="font-bold">Manual vs ReviewInsight</span>
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                        <div className="w-3 h-3 rounded-full bg-green-400" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm py-3 border-b border-muted">
                                        <span className="text-muted-foreground">Analysis Time</span>
                                        <span className="font-medium text-destructive">20+ Hours</span>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-bold text-green-500">2 Seconds</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm py-3 border-b border-muted">
                                        <span className="text-muted-foreground">Data Points</span>
                                        <span className="font-medium">Limited Samples</span>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-bold text-primary">100% of Reviews</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm py-3 border-b border-muted">
                                        <span className="text-muted-foreground">Accuracy</span>
                                        <span className="font-medium">Varies/Biased</span>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-bold text-primary">Objective AI</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm py-3">
                                        <span className="text-muted-foreground">Actionability</span>
                                        <span className="font-medium">Vague Reports</span>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-bold text-green-500">Fixed Priority List</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features section/Key Insights */}
            <section id="features" className="py-24 bg-card">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Powerful Insights</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Don't just collect data. Gain a competitive advantage with intelligence that matters.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: <BarChart3 className="w-10 h-10 text-green-500" />,
                                title: "Competitor Benchmarking",
                                desc: "Sync your competitors' review feeds and see exactly how you measure up. Track them as easily as your own app."
                            },
                            {
                                icon: <TrendingUp className="w-10 h-10 text-blue-500" />,
                                title: "Sentiment Heatmaps",
                                desc: "See where your product shines and where it struggles geographically and temporally."
                            },
                            {
                                icon: <MessageSquare className="w-10 h-10 text-purple-500" />,
                                title: "Feature Requests",
                                desc: "AI automatically extracts and tallies feature requests so you know what to build next."
                            },
                            {
                                icon: <Zap className="w-10 h-10 text-yellow-500" />,
                                title: "Rapid Alerting",
                                desc: "Get notified immediately when negative sentiment spikes to catch bugs before they go viral."
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.02 }}
                                className="p-10 rounded-[2rem] bg-background border flex flex-col items-center text-center group transition-all"
                            >
                                <div className="mb-6 p-4 rounded-2xl bg-secondary group-hover:bg-primary/5 transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof Placeholder */}
            <section className="py-20 border-y border-muted/30">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-sm font-bold uppercase tracking-widest text-muted-foreground mb-12">Trusted by fast-growing product teams</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale">
                        {/* Placeholders for logos */}
                        <div className="text-2xl font-black italic">TECHWAVE</div>
                        <div className="text-2xl font-black italic">APPFLOW</div>
                        <div className="text-2xl font-black italic">DATACORE</div>
                        <div className="text-2xl font-black italic">SMARTLOGIQ</div>
                        <div className="text-2xl font-black italic">NEXTGEN</div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6">
                <div className="max-w-5xl mx-auto rounded-[3rem] bg-primary p-12 md:p-24 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32" />

                    <h2 className="text-3xl md:text-5xl font-black text-primary-foreground mb-8 tracking-tight">
                        Ready to hear what your <br className="hidden md:block" /> customers are actually saying?
                    </h2>
                    <p className="text-primary-foreground/80 text-lg mb-12 max-w-xl mx-auto italic">
                        "ReviewInsight saved our product team 40 hours a week and helped us increase our app rating from 3.2 to 4.7 stars in just 3 months."
                    </p>
                    <Link
                        href="/auth/signin"
                        className="inline-flex h-16 px-12 rounded-2xl bg-white text-black font-black text-xl items-center justify-center hover:scale-105 transition-all shadow-2xl"
                    >
                        Get Started for Free
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12">
                        <div className="flex items-center gap-2">
                            <Image src="/logo.svg" alt="ReviewInsight Logo" width={32} height={32} className="w-8 h-8 rounded-lg" />
                            <span className="text-xl font-bold tracking-tight">ReviewInsight</span>
                        </div>
                        <div className="flex gap-12 text-sm font-medium text-muted-foreground">
                            <Link href="#" className="hover:text-foreground">Privacy</Link>
                            <Link href="#" className="hover:text-foreground">Terms</Link>
                            <Link href="#" className="hover:text-foreground">Twitter</Link>
                            <Link href="#" className="hover:text-foreground">Support</Link>
                        </div>
                        <p className="text-sm text-muted-foreground">© 2026 ReviewInsight. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

