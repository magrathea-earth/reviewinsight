"use client"

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Zap, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

export default function BillingPage() {
    const [currentPlan, setCurrentPlan] = useState<string>("STARTER");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch("/api/user/plan")
            .then(res => res.json())
            .then(data => {
                if (data.plan) setCurrentPlan(data.plan);
            })
            .catch(() => setCurrentPlan("STARTER"));
    }, []);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/billing/checkout", { method: "POST" });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to start checkout session",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePortal = () => {
        window.open("https://reviewinsight.lemonsqueezy.com/billing", "_blank");
    }

    const plans = [
        {
            name: "Pro",
            price: "$4.99",
            description: "Everything you need. One simple plan.",
            features: [
                "7 projects",
                "Full analysis history",
                "Sync any time",
                "Suggestion to take quick action"
            ],
            popular: false,
            id: "PRO",
        },
    ];

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-y-auto px-4 py-8 md:px-10 md:py-12">
                <header className="mb-8 md:mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Billing & Plans</h1>
                    <p className="text-muted-foreground mt-2 text-sm md:text-base">Manage your subscription and developer API access.</p>
                </header>

                <section className="flex justify-center mb-12 md:mb-16">
                    {plans.map((plan) => {
                        const isCurrent = currentPlan === plan.id;
                        return (
                            <div
                                key={plan.name}
                                className={cn(
                                    "relative flex flex-col w-full max-w-lg p-6 md:p-8 rounded-3xl border transition-all",
                                    isCurrent ? "border-primary shadow-lg ring-1 ring-primary/20 bg-primary/5" : "bg-card hover:border-sidebar-accent"
                                )}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-6 md:right-8 -translate-y-1/2">
                                        <Badge className="bg-primary text-primary-foreground px-3 py-1 font-bold text-xs md:text-sm">MOST POPULAR</Badge>
                                    </div>
                                )}

                                <div className="mb-6 md:mb-8">
                                    <h3 className="text-xl font-bold">{plan.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">{plan.description}</p>
                                </div>

                                <div className="mb-6 md:mb-8">
                                    <span className="text-3xl md:text-4xl font-bold">{plan.price}</span>
                                    {plan.price !== "Custom" && <span className="text-muted-foreground font-medium">/month</span>}
                                </div>

                                <ul className="space-y-3 md:space-y-4 mb-8 md:mb-10 flex-1 text-sm">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Check className="w-3 h-3 text-primary" />
                                            </div>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    variant={isCurrent ? "outline" : "premium"}
                                    className="w-full h-10 md:h-12 text-sm md:text-md font-bold"
                                    disabled={loading}
                                    onClick={isCurrent ? handlePortal : (plan.id === "PRO" ? handleUpgrade : undefined)}
                                >
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    {isCurrent ? "Manage Subscription" : plan.id === "ENTERPRISE" ? "Contact Us" : "Upgrade Now"}
                                </Button>
                            </div>
                        );
                    })}
                </section>


            </main>
        </div>
    );
}
