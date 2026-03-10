import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function DonorAdoptionsPage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DONOR") {
        redirect("/login")
    }

    const donorProfile = await prisma.donorProfile.findUnique({
        where: { userId: session.user.id },
    })

    if (!donorProfile) {
        redirect("/login")
    }

    const adoptions = await prisma.adoption.findMany({
        where: { donorId: donorProfile.id },
        include: {
            listing: true,
            donations: {
                where: { status: "COMPLETED" },
            },
        },
        orderBy: { startedAt: "desc" },
    })

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">My Adoptions</h1>
                <Link href="/donor/dashboard" className="text-sm text-muted-foreground hover:underline">
                    ← Back to dashboard
                </Link>
            </div>

            {adoptions.length === 0 ? (
                <div className="border rounded-lg p-10 text-center text-muted-foreground">
                    <p>No adoptions yet.</p>
                    <Link href="/listings" className="text-primary hover:underline mt-2 inline-block">
                        Browse Listings
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {adoptions.map((adoption) => {
                        const totalDonated = adoption.donations.reduce((sum, d) => sum + d.amountCents, 0)
                        return (
                            <div key={adoption.id} className="border rounded-lg p-5 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">{adoption.listing.rhuName}</h3>
                                    <p className="text-sm text-muted-foreground">{adoption.listing.location}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Started {formatDate(adoption.startedAt)} · {adoption.isRecurring ? "Monthly" : "One-time"} · {formatCurrency(totalDonated)} donated
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        adoption.status === "ACTIVE"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-500"
                                    }`}>
                                        {adoption.status}
                                    </span>
                                    <Link
                                        href={`/donor/adoptions/${adoption.id}`}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        View
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}