import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils" 

export default async function DonorDashboardPage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DONOR") {
        redirect("/login")
    }
    const donorProfile = await prisma.donorProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            adoptions: {
                include: {
                    listing: true,
                    donations: true,
                },
            },
        },
    })

    if (!donorProfile) {
        redirect("/login")
    }

    const adoptions = donorProfile.adoptions
    const activeAdoptions = adoptions.filter((a) => a.status === "ACTIVE")
    const totalDonated = adoptions
        .flatMap((a) => a.donations)
        .filter((d) => d.status === "COMPLETED")
        .reduce((sum, d) => sum + d.amountCents,0)


    return (
        <div className = "max-w-5xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold mb-2">Donor Dashboard</h1>
            <p className="text-muted-foreground mb-8">Welcome back, {session.user.name}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                <div className="border rounded-lg p-6">
                    <p className="text-sm text-muted-foreground">Active Adoptions</p>
                    <p className="text-3xl font-bold mt-1">{activeAdoptions.length}</p> 
                </div>
                <div className="border rounded-lg p-6">
                    <p className="text-sm text-muted-foreground">Total Adoptions</p>
                    <p className="text-3xl font-bold mt-1">{adoptions.length}</p> 
                </div>
                <div className="border rounded-lg p-6">
                    <p className="text-sm text-muted-foreground">Total Donated</p>
                    <p className="text-3xl font-bold mt-1">{formatCurrency(totalDonated)}</p> 
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Adopted RHUs</h2>
                <Link href="/donor/adoptions" className="text-sm text-primary hover:underline">
                    View all
                </Link>
            </div>


            {adoptions.length === 0 ? (
                <div className="border rounded-lg p-10 text-center text-muted-foreground">
                    <p>You have not adopted any RHUs yet.</p>
                    <Link href="/listings" className="text-primary hover:underline mt-2 inline-block">
                        Browse Listings
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {adoptions.map((adoption) => (
                        <div key={adoption.id} className="border rounded-lg p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold">{adoption.listing.rhuName}</h3>
                                    <p className="text-sm text-muted-foreground">{adoption.listing.location}</p>
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    adoption.status === "ACTIVE"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-500"
                                }`}>
                                    {adoption.status}
                                </span>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    {adoption.isRecurring ? "Monthly" : "One-time"}
                                </span>
                                <Link
                                    href={`/donor/adoptions/${adoption.id}`}
                                    className="text-primary hover:underline"
                                >
                                    View & Message
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}