import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NavbarClient } from "./NavbarClient"

export async function Navbar() {
    const session = await getServerSession(authOptions)
    const user = session?.user ?? null

    return (
        <header className="border-b bg-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="font-semibold text-gray-900 text-lg">
                EMR Adopt
                </Link>
                <NavbarClient user={user} />
            </div>
        </header>
    )
}