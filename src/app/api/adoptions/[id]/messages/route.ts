import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { NextResponse } from "next/server"

async function getAccessContext(adoptionId: string, userId: string) {
    const adoption = await prisma.adoption.findUnique({
        where: { id: adoptionId },
        include: { 
            donor: true,
            listing: { include: { recipient: true} },
        },
    })

    if (!adoption) return null

    const isDonor = adoption.donor.userId === userId
    const isRecipient = adoption.listing.recipient.userId === userId
    
    if (!isDonor && !isRecipient) return null
    
    return { adoption, isDonor, isRecipient }
}

export async function GET(
    req: Request,
    { params }: { params: { id: string} }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ctx = await getAccessContext(params.id, session.user.id)
    if (!ctx) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401})
    }

    const messages = await prisma.message.findMany({
        where: { adoptionId: params.id },
        include: { sender: { select: { id: true, name: true} } },
        orderBy: { createdAt: "asc" },
    })

    //Mark messages from other party as read
    await prisma.message.updateMany({
        where: {
            adoptionId: params.id,
            senderId: { not: session.user.id },
            isRead: false,
        },
        data: { isRead: true},
    })

    return NextResponse.json(messages)
}

export async function POST( 
    req: Request,
    { params }: { params: { id: string} }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ctx = await getAccessContext(params.id, session.user.id)
    if (!ctx) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content } = await req.json()
    if (!content?.trim()) {
        return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    const message = await prisma.message.create({
        data: {
            adoptionId: params.id,
            senderId: session.user.id,
            content: content.trim(),
        },
        include: { sender: { select: { id: true, name: true } } },
    })

    //Notify the other party
    const { adoption, isDonor } = ctx
    const otherUserId = isDonor
        ? adoption.listing.recipient.userId
        : adoption.donor.userId

    await createNotification(
        otherUserId,
        "MESSAGE_RECEIVED",
        `New message about ${adoption.listing.rhuName}: "${content.trim().slice(0, 60)}"`
    )

    return NextResponse.json(message)
}
