import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ValidationBadge } from "@/components/rhu/ValidationBadge"
import Link from "next/link"

export default async function RecipientListingsPage() {
    const session = await getServerSession(authOptions)

    const profile = await prisma.recipientProfile.findUnique({
        where: { userId: session!.user.id },
        include: {
            listings: {
                orderBy: { createdAt: "desc" },
            },
        },
    })

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
                <Link
                href="/recipient/listings/new"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
                >
                    + New Listing
                </Link>
            </div>


            {profile?.listings.length === 0 ? (
                <p className="text-gray-500">No listings yet.</p>
            ) : (
                <div className="space-y-3">
                    {profile?.listings.map((listing) => (
                        <div key={listing.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">{listing.rhuName}</p>
                                <p className="text-sm text-gray-500">{listing.location}, {listing.province}</p>
                                <p className="text-xs text-gray-400 mt-1">{listing.region}</p>
                            </div>
                        <div className="flex items-center gap-3">
                            <ValidationBadge status={listing.status} />
                            <Link
                            href={`/recipient/listings/${listing.id}`}
                            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Manage
                            </Link>
                        </div>
                    </div>
                    ))} 
                </div>
        )}
    </div>
    )
}