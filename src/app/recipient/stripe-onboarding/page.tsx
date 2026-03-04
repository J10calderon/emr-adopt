"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CreditCard, FileText, ShieldCheck } from "lucide-react"

export default function StripeOnboardingPage() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleStart() {
        setLoading(true)
        try {
            const res = await fetch("/api/stripe/connect/account-link", {
                method: "POST",
            })
            const data = await res.json()
            if (data.url) {
                router.push(data.url)
            }
        } catch (err) {
            console.error(err)
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-2">Connect Your Bank Account</h1>
            <p className="text-muted-foreground mb-8">
                To receive donations, you need to connect a bank via Stripe.
                This is required before donors can adopt your listings.
            </p>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>What you'll need</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground"/>
                        <div>
                            <p className="font-medium">Organization details</p>
                            <p className="text-sm text-muted-foreground">Your RHU name and address</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground"/>
                        <div>
                            <p className="font-medium">Government-issued ID</p>
                            <p className="text-sm text-muted-foreground">For identity verification</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground"/>
                        <div>
                            <p className="font-medium">Bank account details</p>
                            <p className="text-sm text-muted-foreground">Philippine bank account number and routing info</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground"/>
                        <div>
                            <p className="font-medium">Secure process</p>
                            <p className="text-sm text-muted-foreground">All information is collected and stored by Stripe -- we never see your bank details</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button onClick={handleStart} disabled={loading} size="lg">
                {loading ? "Redirecting to Stripe..." : "Start Onboarding"}
            </Button>
        </div>
    )
}