"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
    const router = useRouter()
    const [role, setRole] = useState<"DONOR" | "RECIPIENT">("DONOR")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState({
        name: "", email: "", password: "",
        country: "", organization: "",
        position: "", phone: "",
    })

    function updateForm(field: string, value: string) {
        setForm(prev => ({...prev, [field]: value}))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, role}),
        })

        const data = await res.json()

        if (!res.ok) {
            setError(data.error ?? "Something went wrong")
            setLoading(false)
            return
        }

        await signIn("credentials", {
            email: form.email,
            password: form.password,
            redirect: false,
        })

        router.push(role === "DONOR" ? "/donor/dashboard" : "/recipient/dashboard")
        router.refresh()
    }
    
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>

                {/* Role selector */}
                <div className="flex gap-2 mb-6">
                    <button
                    type="button"
                    onClick={() => setRole("DONOR")}
                    className={`flex-1 py-2 rounded border text-sm font-medium ${role === "DONOR" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300"}`}>
                    I'm a Donor
                    </button>
                    <button
                    type="button"
                    onClick={() => setRole("RECIPIENT")}
                    className={`flex-1 py-2 rounded border text-sm font-medium ${role === "RECIPIENT" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300"}`}
                    >
                    I'm an RHU Representative
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name">Full Name</label>
                        <Input id="name" value={form.name} onChange={e => updateForm("name", e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" value={form.password} onChange={e => updateForm("password", e.target.value)} required />
                    </div>

                    {role === "DONOR" && (
                        <>
                        <div>
                            <Label htmlFor="country">Country</Label>
                            <Input id="country" value={form.country} onChange={e => updateForm("country", e.target.value)} required />
                        </div>
                        <div>
                            <Label htmlFor="organization">Organization (optional)</Label>
                            <Input id="organization" value={form.organization} onChange={e => updateForm("organization", e.target.value)} />
                        </div>
                        </>
                    )}

                    {role === "RECIPIENT" && (
                        <>
                        <div>
                            <Label htmlFor="organization">RHU / Organization Name</Label>
                            <Input id="organization" value={form.organization} onChange={e => updateForm("organization", e.target.value)} required />
                        </div>
                        <div>
                            <Label htmlFor="position">Your position</Label>
                            <Input id="position" value={form.position} onChange={e => updateForm("position", e.target.value)} required/>
                        </div>
                        <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" value={form.phone} onChange={e => updateForm("phone", e.target.value)} />
                        </div>
                        </>
                    )}


                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating account...": "Create Account"}
                    </Button>
                    </form>
                    <p className="text-center text-sm text-gray-500 mt-4">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-600 hover:underline">Sign In</Link>
                    </p>
            </div>
        </div>
    )
}