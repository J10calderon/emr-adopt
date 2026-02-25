"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

type User = {
    name: string
    email: string
    role: string
}

export function NavbarClient({user}: { user: User | null}){
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <div className="flex items-center gap-4">
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-4">
                <Link href="/rhu" className="text-sm text-gray-600 hover:text-gray-900">Browse RHUs</Link>

                {!user && (
                    <>
                      <Link href="/login"><Button variant="outline" size="sm">Sign In</Button></Link>
                      <Link href="/register"><Button size="sm">Register</Button></Link>
                    </>
                )}

                {user?.role === "DONOR" && (
                    <>
                      <Link href="/donor/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
                      <Link href="/donor/adoptions" className="text-sm text-gray-600 hover:text-gray-900">My Adoptions</Link>
                      <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/"})}>Sign Out</Button>
                    </>
                )}

                {user?.role === "RECIPIENT" && (
                    <>
                      <Link href="/recipient/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
                      <Link href="/recipient/listings" className="text-sm text-gray-600 hover:text-gray-900">My Listings</Link>
                      <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/"})}>Sign Out</Button>
                    </>
                )}

                {user?.role === "ADMIN" && (
                    <>
                      <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Admin</Link>
                      <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/"})}>Sign Out</Button>
                    </>
                )}
            </nav>

            {/*Mobile menu button */}
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
                <span className="sr-only">Menu</span>
                <div className="w-5 h-0.5 bg-gray-600 mb-1" />
                <div className="w-5 h-0.5 bg-gray-600 mb-1" />
                <div className="w-5 h-0.5 bg-gray-600" />
            </button>

            {/*Mobile dropdown*/}
            {menuOpen && (
                <div className="absolute top-16 left-0 right-0 bg-white border-b shadow-sm p-4 flex flex-col gap-3 md:hidden">
                    <Link href="/rhu" className="text-sm" onClick={() => setMenuOpen(false)}>Browse RHUs</Link>
                    {!user && <Link href="/login" className="text-sm" onClick={() => setMenuOpen(false)}>Sign In</Link>}
                    {!user && <Link href="/register" className="text-sm" onClick={() => setMenuOpen(false)}>Register</Link>}
                    {user && <button className="text-sm text-left" onClick={() => signOut({ callbackUrl: "/"})}>Sign Out</button>}
                </div>
            )}
        </div>
    )
}
