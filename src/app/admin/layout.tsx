import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AdminLayout({ children }: { children: React.ReactNode}) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") redirect ("/login")

    return (
        <div>
            <nav className="bg-gray-900 text-white px-6 py-3 flex gap-6 text-sm">
                <Link href="/admin" className="hover:text-gray-300">Overview</Link>
                <Link href="/admin/listings" className="hover:text-gray-300">Listings</Link>
                <Link href="/admin/users" className="hover:text-gray-300">Users</Link>
                <Link href="/admin/donations" className="hover:text-gray-300">Donations</Link>
                <Link href="/admin/settings" className="hover:text-gray-300">Settings</Link>
            </nav>
            <div>{children}</div>
        </div>
    )
}