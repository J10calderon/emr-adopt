"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function ValidationPanel({ listingId }: { listingId: string }) {
    const router = useRouter()
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleAction(action: string) {
        setLoading(true)
        await fetch(`/api/admin/listings/${listingId}/validate`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, notes }),
        })
        router.refresh()
        setLoading(false)
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Validate Listing</h2>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes for the recipient (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="flex gap-3">
            <button
                onClick={() => handleAction("APPROVED")}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                    Approve
            </button>
            <button
                onClick={() => handleAction("CHANGES_REQUESTED")}
                disabled={loading}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
                >
                    Request Changes
            </button>
            <button
                onClick={() => handleAction("REJECTED")}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                    Reject
            </button>
        </div>
        </div>
    )
}