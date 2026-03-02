"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function SubmitListingButton({ listingId }: { listingId: string}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        setLoading(true)
        await fetch(`/api/listings/${listingId}/submit`, { method: "POST"})
        router.refresh()
        setLoading(false)
    }

    return (
        <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
        >
            {loading ? "Submitting..." : "Submit for Validation"}
        </button>
    )
}