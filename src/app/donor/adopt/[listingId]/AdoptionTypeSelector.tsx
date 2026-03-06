"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface Props {
    listingId: string
    amountCents: number
}

export default function AdoptionTypeSelector({ listingId, amountCents }: Props) {
    const [loading, setLoading] = useState(false)

    async function handleAdopt() {
        setLoading(true)
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ listingId, isRecurring: false }),
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            }
        } catch (err) {
            console.error(err)
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Donation Amount</h2>

            <Card className="border-2 border-primary">
                <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-primary mb-1">
                        {formatCurrency(amountCents)}
                    </div>
                    <p className="text-sm text-muted-foreground">One-time donation</p>
                </CardContent>
            </Card>

            <Button onClick={handleAdopt} disabled={loading} size="lg" className="w-full">
                {loading ? "Redirecting to Stripe...": `Adopt for ${formatCurrency(amountCents)}`}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
                You will be redirected to Stripe to complete your payment securely.
            </p>
        </div>
    )
    
}