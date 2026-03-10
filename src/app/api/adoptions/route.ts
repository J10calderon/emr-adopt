import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DONOR") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401})
    }

    const donorProfile = await prisma.donorProfile.findUnique({
        where: { userId: session.user.id },
    })

    if (!donorProfile) {
        return NextResponse.json({ error: "Donor profile not found" }, { status: 400})
    }


    const adoptions = await prisma.adoption.findMany({
        where: { donorId: donorProfile.id },
        include: {
            listing: {
                include: { recipient: true },
            },
            donations: {
                orderBy: { createdAt: "desc" },
            },
        },
        orderBy: { startedAt: "desc" },
    })

    return NextResponse.json(adoptions)
}