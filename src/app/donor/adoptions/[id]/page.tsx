import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import CancelAdoptionButton from "./CancelAdoptionButton"

export default async function AdoptionDetailPage({
    params,
}: {
    params: { id: string }
}) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DONOR") {
        redirect("/login")
    }

    const adoption = await prisma.adoption.findUnique({
        where: { id: params.id },
        include: {
            donor: true,
            listing: {
                include: { recipient: true },
            },
            donations: {
                orderBy: { createdAt: "desc" },
            },
        },
    })

    if (!adoption) notFound()
    if (adoption.donor.userId !== session.user.id) redirect("/donor/dashboard")

    const completedDonations = adoption.donations.filter((d) => d.status === "COMPLETED")
    const totalDonated = completedDonations.reduce((sum, d) => sum + d.amountCents, 0)

    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-6">
                <Link href="/donor/adoptions" className="text-sm text-muted-foreground hover:underline">
                    ← Back to adoptions
                </Link>
            </div>

            <div className="border rounded-lg p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{adoption.listing.rhuName}</h1>
                        <p className="text-muted-foreground">{adoption.listing.location}, {adoption.listing.province}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        adoption.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                        {adoption.status}
                    </span>
                </div> 

                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Donated</p>
                        <p className="text-xl font-bold">{formatCurrency(totalDonated)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Payments</p>
                        <p className="text-xl font-bold">{completedDonations.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="text-xl font-bold">{adoption.isRecurring ? "Monthly" : "One-time"}</p>
                    </div>
                </div>

                {adoption.isRecurring && adoption.status === "ACTIVE" && (
                    <div className="mt-6">
                        <CancelAdoptionButton adoptionId={adoption.id} />
                    </div>
                )}
            </div>

            <h2 className="text-lg font-semibold mb-3">Donation History</h2>
            {adoption.donations.length === 0 ? (
                <p className="text-muted-foreground">No donations yet.</p>
            ) : (
                <div className="border rounded-lg divide-y">
                    {adoption.donations.map((donation) => (
                        <div key={donation.id} className="flex items-center justify-between px-5 py-3">
                            <div>
                                <p className="text-sm font-medium">{formatCurrency(donation.amountCents)}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(donation.createdAt)}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                donation.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : donation.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                                {donation.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}

        </div>
    )
}