"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Sparkles, Zap } from "lucide-react"
import Link from "next/link"

interface UpgradeModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
}

export function UpgradeModal({ isOpen, onClose, title, description }: UpgradeModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="w-5 h-5 text-primary" />
                        {title || "Upgrade to Pro"}
                    </DialogTitle>
                    <DialogDescription>
                        {description || "You've reached the limits of the Free plan. Upgrade to unlock the full power of ReviewInsight AI."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <div className="font-semibold text-sm">Pro Plan</div>
                            <div className="text-xs text-muted-foreground">$29/month</div>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Unlimited Projects</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Unlimited Syncs (No Rate Limits)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Advanced AI Analysis</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Priority Support</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button asChild className="w-full gap-2 font-bold text-md h-12">
                        <Link href="/billing">
                            Upgrade Now <Sparkles className="w-4 h-4" />
                        </Link>
                    </Button>
                    <Button variant="ghost" onClick={onClose} className="w-full">
                        Maybe Later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
