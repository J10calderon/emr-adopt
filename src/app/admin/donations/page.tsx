import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function AdminDonationsPage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") notFound()

    const donations = await prisma.donation.findMany({
        include: {
            adoption: {
                include: {
                    donor: { include: { user: true } },
                    listing: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-white mb-6">Donations</h1>
            <div className="bg-white rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Donor</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">RHU</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {donations.map(donation => (
                            <tr key={donation.id} className="border-b border-gray-100 last:border-0">
                                <td className="px-4 py-3 text-gray-900">{donation.adoption.donor.user.name}</td>
                                <td className="px-4 py-3 text-gray-600">{donation.adoption.listing.rhuName}</td>
                                <td className="px-4 py-3 text-gray-900">{formatCurrency(donation.amountCents)}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        donation.status === "COMPLETED"
                                        ? "bg-green-100 text-green-800"
                                        : donation.status === "FAILED"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}>
                                        {donation.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">{formatDate(donation.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}