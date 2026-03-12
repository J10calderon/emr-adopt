import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const donations = await prisma.donation.findMany({
        include: {
            adoption: {
                include: {
                    donor: { include: { user: true } },
                    listing: true,
                },
            },
        },
        orderBy:  { createdAt: "desc" },
    })

    return NextResponse.json(donations)
}