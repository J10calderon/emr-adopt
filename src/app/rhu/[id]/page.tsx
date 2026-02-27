import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ValidationBadge } from "@/components/rhu/ValidationBadge"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

type Props = {
    params: { id: string }
}

export default async function RHUDetailPage({ params }: Props) {
    const session = await getServerSession(authOptions)

    const [listing, setting] = await Promise.all([
        prisma.rHUListing.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: {
                        adoptions: { where: { status: "ACTIVE"} },
                    },
                },
            },
        }),
        prisma.setting.findUnique({ where: { key: "donation_amount_cents"}}),
    ])

    if (!listing) notFound()

    const amountCents = parseInt(setting?.value ?? "50000")

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link href="/rhu" className="text-sm text-emerald-600 hover:underline mb-6 inline-block">
                ← Back to listings
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main content -- left 2/3 */}
                <div className="md:col-span-2 space-y-6">
                    {/* Image */}
                    <div className="h-64 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center">
                        {listing.imageUrl ? (
                            <img src={listing.imageUrl} alt={listing.rhuName} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <span className="text-8xl">🏥</span>
                        )}
                    </div>

                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">{listing.rhuName}</h1>
                            <ValidationBadge status={listing.status} />
                        </div>
                        <p className="text-gray-500">📍 {listing.location}, {listing.province}, {listing.region}</p>
                        <p className="text-sm text-gray-600 mt-1">{listing?._count.adoptions} active donor{listing?._count.adoptions !== 1 ? "s" : ""}</p>
                    </div>

                    {/* Description */}
                    <div>
                        <h2 className="font-semibold text-gray-900 mb-2">About this RHU</h2>
                        <p className="text-gray-600 leading-relaxed">{listing.description}</p>
                    </div>


                    {/* Receipt instructions */}
                    {listing.receiptInstructions && (
                        <div>
                            <h2 className="font-semibold text-gray-900 mb-2">How funds are used</h2>
                            <p className="text-gray-600 leading-relaxed">{listing.receiptInstructions}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar - right 1/3 */}
                <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Monthly donation</p>
                        <p className="text-3xl font-bold text-emerald-600">{formatCurrency(amountCents)}</p>
                        <p className="text-xs text-gray-400 mt-1">or one-time payment</p>

                        <div className="mt-6">
                            {listing.status !== "VALIDATED" ? (
                                <p className="text-sm text-gray-500 text-center">This listing is not currently accepting donations.</p>
                            ) : session?.user.role === "DONOR" ? (
                                <Link
                                href={`/donor/adopt/${listing.id}`}
                                className="block w-full text-center px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                                >
                                    Adopt this RHU
                                </Link>
                            ) : session ? (
                                <p className="text-sm text-gray-500 text-center">Only donors can adopt RHUs.</p>
                            ) : (
                                <Link
                                href="/register"
                                className="block w-full text-center px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                                >
                                    Register to Adopt
                                </Link>
                            )}
                        </div>
                    </div>
                </div>  
            </div>
        </div>
    )
}