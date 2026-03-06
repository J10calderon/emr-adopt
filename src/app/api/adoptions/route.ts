import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DONOR") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401})
    }

    const adoptions = await prisma.adoption.findMany({
        where: { donorId: session.user.id },
        include: {
            listing: {
                include: { recipientProfile: true },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(adoptions)
}