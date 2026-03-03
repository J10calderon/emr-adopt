import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"

export default async function AdminOverviewPage() {
    const session = await getServerSession(authOptions)

    const [userCount, listingCount, pendingCount, adoptionCount, donations] = await Promise.all([
        prisma.user.count(),
        prisma.rHUListing.count(),
        prisma.rHUListing.count({ where: { status: "PENDING_VALIDATION" } }),
        prisma.adoption.count(),
        prisma.donation.findMany({ where: { status: "COMPLETED"} }),
    ])

    const totalDonated = donations.reduce((sum, d) => sum + d.amountCents, 0)

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Overview</h1>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{userCount}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Total Listings</p>
                    <p className="text-2xl font-bold text-gray-900">{listingCount}</p>
                </div>
                <div className={`border rounded-xl p-4 shadow-sm ${pendingCount > 0 ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200"}`}>
                    <p className="text-sm text-gray-500">Pending Validation</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Total Adoptions</p>
                    <p className="text-2xl font-bold text-gray-900">{adoptionCount}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Total Donated</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDonated)}</p>
                </div>
            </div>
        </div>
    )
}