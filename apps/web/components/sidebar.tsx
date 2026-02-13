"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    LayoutDashboard,
    BarChart2,
    AlertCircle,
    CreditCard,
    Settings,
    Layers,
    ChevronLeft,
    Box,
    Sparkles,
    ShieldAlert,
    Sun,
    Moon,
    Monitor,
    LogOut,
    Check,
    Menu,
    X
} from "lucide-react";

const globalItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Billing", href: "/billing", icon: CreditCard },
    { name: "Settings", href: "/settings", icon: Settings },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
    const { data: session } = useSession();
    const { setTheme, theme } = useTheme();
    const pathname = usePathname();
    const [projectName, setProjectName] = useState("Loading...");
    const isProjectPage = pathname.startsWith("/projects/");
    const projectId = isProjectPage ? pathname.split("/")[2] : null;

    useEffect(() => {
        if (projectId) {
            fetch(`/api/projects/${projectId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.name) setProjectName(data.name);
                })
                .catch(() => setProjectName("Project View"));
        }
    }, [projectId]);

    // Navigation links are handled by onClick={onClose} to ensure sheet closes on mobile

    const projectItems = [
        { name: "Overview", href: `/projects/${projectId}`, icon: LayoutDashboard, exact: true },
        { name: "AI Insights", href: `/projects/${projectId}/insights`, icon: ShieldAlert },
        { name: "Positive Stories", href: `/projects/${projectId}/positive`, icon: Sparkles },
    ];

    const userName = session?.user?.name || "Guest User";
    const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className="flex flex-col h-full">
            <div className="p-6">
                <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="ReviewInsight" className="w-8 h-8 object-contain" />
                    <span>ReviewInsight</span>
                </Link>
            </div>

            <nav className="flex-1 px-3 space-y-6">
                {isProjectPage ? (
                    <>
                        <div className="space-y-1">
                            <Link
                                href="/dashboard"
                                onClick={onClose}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
                            >
                                <ChevronLeft className="w-3 h-3" />
                                All Projects
                            </Link>

                            <div className="px-3 mb-2">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Active Project</span>
                                <h3 className="text-sm font-bold truncate mt-0.5 text-primary">{projectName}</h3>
                            </div>

                            {projectItems.map((item) => {
                                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={onClose}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="space-y-1">
                        <div className="px-3 mb-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Workspace</span>
                        </div>
                        {globalItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </nav>

            <div className="p-4 border-t mt-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 px-3 py-2 w-full bg-accent/30 hover:bg-accent/50 transition-colors rounded-xl border border-border/50 text-left">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/20">
                                {userInitials}
                            </div>
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <span className="text-sm font-bold truncate">{userName}</span>
                                <span className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground/60">Free Plan</span>
                            </div>
                            <div className="text-muted-foreground">
                                <Settings className="w-4 h-4" />
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            <Sun className="mr-2 h-4 w-4" />
                            <span>Light</span>
                            {theme === "light" && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            <Moon className="mr-2 h-4 w-4" />
                            <span>Dark</span>
                            {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            <Monitor className="mr-2 h-4 w-4" />
                            <span>System</span>
                            {theme === "system" && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/api/auth/signout" onClick={onClose}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";

export function Sidebar() {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex w-64 border-r bg-background/50 backdrop-blur-md flex-col h-screen sticky top-0">
                <SidebarContent />
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex flex-col w-full">
                <div className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b z-50 flex items-center justify-between px-4">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
                        <img src="/logo.png" alt="ReviewInsight" className="w-8 h-8 object-contain" />
                        <span className="tracking-tight">ReviewInsight</span>
                    </Link>

                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-72">
                            <SidebarContent onClose={() => setIsMobileOpen(false)} />
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Spacer for fixed header */}
                <div className="h-16 w-full flex-shrink-0" />
            </div>
        </>
    );
}

