"use client"

import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
    const { data: session } = useSession();
    const sections = [
        { name: "Profile", icon: User },
    ];

    const userName = session?.user?.name || "Guest User";
    const userEmail = session?.user?.email || "guest@example.com";
    const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-10 py-12">
                    <header className="mb-12">
                        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground mt-2">Manage your account preferences.</p>
                    </header>

                    <div className="flex gap-12">
                        <aside className="w-48 shrink-0">
                            <nav className="flex flex-col gap-1">
                                {sections.map((section, i) => (
                                    <button
                                        key={section.name}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all text-left",
                                            i === 0 ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"
                                        )}
                                    >
                                        <section.icon className="w-4 h-4" />
                                        {section.name}
                                    </button>
                                ))}
                            </nav>
                        </aside>

                        <div className="flex-1 space-y-12">
                            <section>
                                <h2 className="text-xl font-bold mb-6">User Profile</h2>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-6 pb-6 border-b">
                                        <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center text-2xl font-bold text-primary">
                                            {userInitials}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold">Full Name</label>
                                            <div className="w-full bg-accent/30 border border-transparent rounded-xl px-4 py-2.5 text-sm">
                                                {userName}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold">Email Address</label>
                                            <div className="w-full bg-accent/30 border border-transparent rounded-xl px-4 py-2.5 text-sm">
                                                {userEmail}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="pt-6 border-t flex justify-end gap-3">
                                <Button className="premium px-8">Save Changes</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
