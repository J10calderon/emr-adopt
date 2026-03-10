import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
    req: Request,
    { params }: { params: {id: string} }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adoption = await prisma.adoption.findUnique({
        where: { id: params.id},
        include: {
            listing: {
                include: { recipient: { include: { user: true} } },
            },
            donor: {
                include: { user: true },
            },
            donations: {
                orderBy: { createdAt: "desc" },
            },
        },
    })

    if (!adoption) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const isDonor = adoption.donor.userId === session.user.id
    const isRecipient = adoption.listing.recipient.userId === session.user.id

    if (!isDonor && !isRecipient) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(adoption)
}