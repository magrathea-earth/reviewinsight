import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function BillingPage() {
    const plans = [
        {
            name: "Starter",
            price: "$29",
            description: "Perfect for small apps and side projects.",
            features: ["3 Projects", "10k reviews/month", "7-day analysis history", "Email support"],
            current: false,
        },
        {
            name: "Pro",
            price: "$99",
            description: "The standard for growing B2B products.",
            features: ["20 Projects", "100k reviews/month", "Full analysis history", "Priority support", "Custom AI prompts"],
            current: true,
            popular: true,
        },
        {
            name: "Enterprise",
            price: "Custom",
            description: "Scale insights across your entire organization.",
            features: ["Unlimited Projects", "Unlimited reviews", "Dedicated instance", "SLA & SSO", "Custom connectors"],
            current: false,
        },
    ];

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-y-auto px-10 py-12">
                <header className="mb-12">
                    <h1 className="text-4xl font-bold tracking-tight">Billing & Plans</h1>
                    <p className="text-muted-foreground mt-2">Manage your subscription and usage limits.</p>
                </header>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={cn(
                                "relative flex flex-col p-8 rounded-3xl border transition-all",
                                plan.current ? "border-primary shadow-lg ring-1 ring-primary/20" : "bg-card hover:border-sidebar-accent"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-8 -translate-y-1/2">
                                    <Badge className="bg-primary text-primary-foreground px-3 py-1 font-bold">MOST POPULAR</Badge>
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold">{plan.name}</h3>
                                <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">{plan.description}</p>
                            </div>

                            <div className="mb-8">
                                <span className="text-4xl font-bold">{plan.price}</span>
                                {plan.price !== "Custom" && <span className="text-muted-foreground font-medium">/month</span>}
                            </div>

                            <ul className="space-y-4 mb-10 flex-1 text-sm">
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
                                variant={plan.current ? "outline" : "premium"}
                                className="w-full h-12 text-md font-bold"
                                disabled={plan.current}
                            >
                                {plan.current ? "Current Plan" : "Upgrade Now"}
                            </Button>
                        </div>
                    ))}
                </section>

                <section className="max-w-4xl">
                    <h2 className="text-xl font-bold mb-6">Usage Summary</h2>
                    <div className="bg-accent/20 rounded-2xl p-8 border border-dashed">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div>
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-sm font-medium">Monthly Review Limit</span>
                                    <span className="text-sm text-muted-foreground">12,482 / 100,000</span>
                                </div>
                                <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                                    <div className="bg-primary h-full w-[12.5%]" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                                    <Zap className="w-3 h-3" /> Resets in 14 days
                                </p>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-card border flex items-center justify-center shadow-sm">
                                    <CreditCard className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-bold flex items-center gap-2">
                                        Visa ending in 4242
                                        <Badge variant="outline" className="text-[10px] font-bold">Default</Badge>
                                    </p>
                                    <p className="text-sm text-muted-foreground">Expires 12/28</p>
                                </div>
                                <Button variant="ghost" size="sm" className="ml-auto">Update</Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
