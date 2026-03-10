"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CancelAdoptionButton({ adoptionId }: { adoptionId: string }) {
    const router = useRouter()
    const [confirming, setConfirming] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleCancel() {
        setLoading(true)
        const res = await fetch(`/api/adoptions/${adoptionId}/cancel`, {
            method: "POST",
        })
        setLoading(false)

        if (res.ok) {
            router.refresh()
        } else {
            alert("Failed to cancel. Please try again.")
        }
    }
    if (!confirming) {
        return (
            <button
                onClick={() => setConfirming(true)}
                className="text-sm text-red-600 hover:underline"
            >
                Cancel Monthly Donation
            </button>
        )
    }

    return (
        <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">Are you sure?</p>
            <button
                onClick={handleCancel}
                disabled={loading}
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                    {loading ? "Cancelling..." : "Yes, cancel"}
            </button>
            <button
                onClick={() => setConfirming(false)}
                className="text-sm text-muted-foreground hover:underline"
            >
                Never mind
            </button>
        </div>
    )
}