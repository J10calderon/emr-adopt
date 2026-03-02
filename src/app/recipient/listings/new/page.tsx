"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const REGIONS = [
  "Region I - Ilocos Region",
  "Region II - Cagayan Valley",
  "Region III - Central Luzon",
  "Region IV-A - CALABARZON",
  "Region IV-B - MIMAROPA",
  "Region V - Bicol Region",
  "Region VI - Western Visayas",
  "Region VII - Central Visayas",
  "Region VIII - Eastern Visayas",
  "Region IX - Zamboanga Peninsula",
  "Region X - Northern Mindanao",
  "Region XI - Davao Region",
  "Region XII - SOCCSKSARGEN",
  "Region XIII - Caraga",
  "NCR - National Capital Region",
  "CAR - Cordillera Administrative Region",
  "BARMM - Bangsamoro",
]

export default function NewListingPage() {
    const router = useRouter()
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        rhuName: "",
        description: "",
        location: "",
        province: "",
        region: "",
        receiptInstructions: "",
    })

    function updateForm(field: string, value: string) {
        setForm((prev) => ({ ...prev, [field]: value}))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        const res = await fetch("/api/listings", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify(form),
        })

        const data = await res.json()

        if (!res.ok) {
            setError(data.error ?? "Something went wrong")
            setLoading(false)
            return
        }

        router.push(`/recipient/listings/${data.id}`)
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Listing</h1>

            {error && ( 
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RHU Name</label>
                    <input
                        type="text"
                        value={form.rhuName}
                        onChange={(e) => updateForm("rhuName", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => updateForm("description", e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location (City/Municipality)</label>
                    <input 
                        type="text"
                        value={form.location}
                        onChange={(e) => updateForm("location", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                    />
                </div>
            
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                    <input 
                        type="text"
                        value={form.province}
                        onChange={(e) => updateForm("province", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <select 
                        value={form.region}
                        onChange={(e) => updateForm("region", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                    >
                    <option value="">Select a region</option>
                    {REGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Instructions</label>
                    <textarea
                        value={form.receiptInstructions}
                        onChange={(e) => updateForm("receiptInstructions", e.target.value)}
                        rows={3}
                        placeholder="How will funds be used? What will donors receive as proof?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                    {loading ? "Creating..." : "Create Listing"}
                </button>
            </form>
        </div>
    )
}