import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ValidationBadge } from "@/components/rhu/ValidationBadge"
import Link from "next/link"

const TABS = ["ALL", "PENDING_VALIDATION", "VALIDATED", "REJECTED", "DRAFT"]

type Props = { searchParams: { status?: string } }

export default async function AdminListingsPage({ searchParams }: Props) {
    const session = await getServerSession(authOptions)

    const activeTab = searchParams.status ?? "ALL"

    const listings = await prisma.rHUListing.findMany({
        where: activeTab === "ALL" ? undefined : { status: activeTab },
        include: {
            recipient: { include: { user: true} },
            _count: { select: { adoptions: true} },
        },
        orderBy: { createdAt: "desc" },
    })

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Listings</h1>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {TABS.map((tab) => (
                    <Link
                        key={tab}
                        href={tab === "ALL" ? "/admin/listings" : `/admin/listings?status=${tab}`}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                            activeTab === tab
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        {tab === "ALL" ? "All" : tab.replace("_", " ")}
                    </Link>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">RHU Name</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Recipient</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Adoptions</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {listings.map((listing) => (
                            <tr key={listing.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{listing.rhuName}</td>
                                <td className="px-4 py-3"><ValidationBadge status={listing.status}/></td>
                                <td className="px-4 py-3">
                                    <p className="text-gray-900">{listing.recipient.user.name}</p>
                                    <p className="text-gray-400 text-xs">{listing.recipient.user.email}</p>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{listing.location}, {listing.province}</td>
                                <td className="px-4 py-3">{listing._count.adoptions}</td>
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/admin/listings/${listing.id}`}
                                        className="text-emerald-600 hover:underline font-medium"
                                    >
                                        Review
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {listings.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No listings found.</p>
                )}
            </div>
        </div>
    )
}