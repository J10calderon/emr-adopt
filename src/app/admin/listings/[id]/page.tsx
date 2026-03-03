import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ValidationBadge } from "@/components/rhu/ValidationBadge"
import { formatDate } from "@/lib/utils"
import { ValidationPanel } from "./ValidationPanel"

type Props = { params: { id: string } }

export default async function AdminListingDetailPage({ params }: Props) {
    const session = await getServerSession(authOptions)

    const listing = await prisma.rHUListing.findUnique({
        where: { id: params.id },
        include: {
            recipient: { include: { user: true} },
            validations: { orderBy: { createdAt: "desc" } },
        },
    })

    if (!listing) notFound()

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{listing.rhuName}</h1>
                <ValidationBadge status={listing.status} />
            </div>
            <p className="text-gray-500 text-sm mb-8">📍 {listing.location}, {listing.province} · {listing.region}</p>

            <div className="space-y-6">
                {/* Recipient info */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h2 className="font-semibold text-gray-900 mb-3">Recipient</h2>
                    <p className="text-gray-900">{listing.recipient.user.name}</p>
                    <p className="text-gray-500 text-sm">{listing.recipient.user.email}</p>
                    <p className="text-gray-500 text-sm">{listing.recipient.organization} · {listing.recipient.position}</p>
                    <p className="text-gray-500 text-sm">{listing.recipient.phone}</p>
                </div>

                {/* Description */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
                    <p className="text-gray-600 leading-relaxed">{listing.description}</p>
                </div>

                {/* Receipt instructions */}
                {listing.receiptInstructions && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h2 className="font-semibold text-gray-900 mb-2">Receipt Instructions</h2>
                        <p className="text-gray-600 leading-relaxed">{listing.receiptInstructions}</p>
                    </div>
                )}

                {/* Validation panel */}
                <ValidationPanel listingId={listing.id} />

                {/* Validation history */}
                {listing.validations.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h2 className="font-semibold text-gray-900 mb-4">Validation History</h2>
                        <div className="space-y-3">
                            {listing.validations.map((v) => (
                                <div key={v.id} className="flex items-start justify-between text-sm">
                                    <div>
                                        <span className="font-medium text-gray-900">{v.action}</span>
                                        {v.notes && <p className="text-gray-500 mt-0.5">{v.notes}</p>}
                                    </div>
                                    <span className="text-gray-400 shrink-0 ml-4">{formatDate(v.createdAt)}</span>
                                </div>
                            ))}
                    </div>
                </div>
                )}
            </div>
        </div>
    )
}