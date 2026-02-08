"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Layers, Mail, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await signIn("credentials", {
            email,
            name,
            redirect: false,
        });

        if (result?.ok) {
            router.push("/dashboard");
        } else {
            console.error("Sign in failed", result?.error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-6">
            <div className="w-full max-w-[400px] space-y-8">
                <div className="text-center space-y-2">
                    <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-xl mb-4 shadow-lg object-contain" />
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome</h1>
                    <p className="text-slate-600">Enter your details to get started.</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold ml-1 text-slate-700">Full Name</label>
                            <input
                                type="text"
                                required
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-[#F3F4F6] border-transparent rounded-2xl text-sm text-slate-900 focus:bg-white focus:border-primary transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold ml-1 text-slate-700">Work Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-[#F3F4F6] border-transparent rounded-2xl text-sm text-slate-900 focus:bg-white focus:border-primary transition-all outline-none"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-2xl premium font-bold text-md"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 pt-8 border-t text-center space-y-4">
                        <p className="text-xs text-slate-500">
                            By continuing, you agree to our <Link href="#" className="underline hover:text-primary transition-colors">Terms of Service</Link> and <Link href="#" className="underline hover:text-primary transition-colors">Privacy Policy</Link>.
                        </p>
                        <div className="flex justify-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer">
                                <span className="text-[10px] font-bold text-slate-900">G</span>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer">
                                <span className="text-[10px] font-bold text-slate-900"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-sm text-slate-600 font-medium">
                    Don't have an account? <Link href="#" className="text-primary font-bold hover:underline">Start for free</Link>
                </p>
            </div>
        </div>
    );
}
