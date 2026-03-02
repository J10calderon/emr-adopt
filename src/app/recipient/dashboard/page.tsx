import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ValidationBadge } from "@/components/rhu/ValidationBadge"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

export default async function RecipientDashboard() {
    const session = await getServerSession(authOptions)

    const profile = await prisma.recipientProfile.findUnique({
        where: { userId: session!.user.id },
        include: {
            listings: {
                include: {
                    _count: { select: { adoptions: { where: { status: "ACTIVE"} } } },
                    donations: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
    })


    const totalReceived = profile?.listings.flatMap(l => l.donations).filter(d => d.status === "COMPLETED").reduce((sum, d) => sum + d.amountCents,0) ?? 0
    const activeAdoptions = profile?.listings.reduce((sum, l) => sum + l._count.adoptions, 0) ?? 0

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Recipient Dashboard</h1>

            {/* Stripe warning */}
            {!profile?.stripeOnboarded && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-orange-800 font-medium">⚠️ Stripe onboarding required</p>
                    <p className="text-orange-700 text-sm mt-1">
                        You need to connect your bank account before donors can pay you.{" "}
                        <Link href="/recipient/stripe-onboarding" className="underline">
                        Complete onboarding →
                        </Link>
                    </p>
                </div>
            )}
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Total Listings</p>
                    <p className="text-2xl font-bold text-gray-900">{profile?.listings.length ?? 0}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Active Donors</p>
                    <p className="text-2xl font-bold text-gray-900">{activeAdoptions}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Total Received</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalReceived)}</p>
                </div>
            </div>

            {/* Listings */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Your Listings</h2>
                <Link
                href="/recipient/listings/new"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
                >
                    + New Listing
                </Link>
            </div>

            {profile?.listings.length === 0 ? (
                <p className="text-gray-500">No listings yet. Create your first one!</p>
            ) : (
                <div className="space-y-3">
                    {profile?.listings.map((listing) => (
                        <div key={listing.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">{listing.rhuName}</p>
                                <p className="text-sm text-gray-500">{listing.location}, {listing.province}</p>
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