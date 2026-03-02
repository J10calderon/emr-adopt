import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ValidationBadge } from "@/components/rhu/ValidationBadge"
import {formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import { SubmitListingButton } from "./SubmitListingButton"

type Props = { params: { id: string } }

export default async function RecipientListingDetailPage({ params }: Props) {
    const session = await getServerSession(authOptions)

    const listing = await prisma.rHUListing.findUnique({
        where: { id: params.id },
        include: {
            recipient: true,
            adoptions: {
                include: { donor : { include : { user: true } } },
                orderBy: { startedAt: "desc" },
            },
            donations: true,
        },
    })

    if (!listing) notFound()

    //Make sure this listing belongs to the logged-in recipient
    if (listing.recipient.userId !== session!.user.id) notFound()

    const totalReceived = listing.donations
        .filter(d => d.status === "COMPLETED")
        .reduce((sum, d) => sum + d.amountCents,0)

    const activeAdoptions = listing.adoptions.filter(a => a.status === "ACTIVE").length

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link href="/recipient/listings" className="text-sm text-emerald-600 hover:underline mb-6 inline-block">
            ← Back to listings
            </Link>


        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{listing.rhuName}</h1>
                    <ValidationBadge status={listing.status}/>
                </div>
                <p className="text-gray-500 text-sm">📍 {listing.location}, {listing.province}</p>
            </div>
            {["DRAFT", "REJECTED"].includes(listing.status) && (
                <Link
                href={`/recipient/listings/${listing.id}/edit`}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                Edit
                </Link>
            )}
        </div>

        {/* Admin notes warning */}
        {listing.validationNotes && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-yellow-800">Admin notes:</p>
                <p className="text-yellow-700 text-sm mt-1">{listing.validationNotes}</p>
            </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Active Donors</p>
                <p className="text-2xl font-bold text-gray-900">{activeAdoptions}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Total Adoptions</p>
                <p className="text-2xl font-bold text-gray-900">{listing.adoptions.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-gray-500">Total Received</p>
                <p className="text-2xl font-bold text-gray-600">{formatCurrency(totalReceived)}</p>
            </div>
        </div>

        {/* Submit button */}
        {["DRAFT", "REJECTED"].includes(listing.status) && (
            <div className="mb-8">
                <SubmitListingButton listingId={listing.id} />
            </div>
        )}

        {/* Description */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
            <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600">{listing.description}</p>
        </div>

        {/* Adoptions List */}
        {listing.adoptions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Donors</h2>
                <div className="space-y-2">
                    {listing.adoptions.map((adoption)=> (
                        <div key = {adoption.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-900">{adoption.donor.user.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-500">{formatDate(adoption.startedAt)}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                adoption.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                                }`}>
                                    {adoption.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        </div>
    )
}