import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { createNotification } from "@/lib/notifications"
import { NextResponse } from "next/server"
import { sendAdoptionCancelledEmail } from "@/lib/email"

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DONOR") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adoption = await prisma.adoption.findUnique({
        where: { id: params.id },
        include: {
            donor: {include: { user: true} },
            listing: {
                include: { recipient: { include: { user: true} } },
            },
        },
    })

    if (!adoption) {
        return NextResponse.json({ error: "Not found"}, { status: 404 })
    }

    if (adoption.donor.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (adoption.status === "CANCELLED" ) {
        return NextResponse.json({ error: "Already cancelled" }, { status: 400 })
    }

    if (adoption.stripeSubscriptionId) {
        await stripe.subscriptions.cancel(adoption.stripeSubscriptionId);
    }

    const updated = await prisma.adoption.update({
        where: { id: params.id },
        data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
        },
    })

    await createNotification(
        session.user.id,
        "ADOPTION_CANCELLED",
        "Adoption Cancelled",
        `You have cancelled your adoption of ${adoption.listing.rhuName}.`
    )

    await createNotification(
        adoption.listing.recipient.userId,
        "ADOPTION_CANCELLED",
        "Adoption Cancelled",
        `A donor has cancelled their adoption of ${adoption.listing.rhuName}.`
    )

    await sendAdoptionCancelledEmail(
        adoption.donor.user.email,
        adoption.donor.user.name ?? "Donor",
        adoption.listing.rhuName
    )

    await sendAdoptionCancelledEmail(
        adoption.listing.recipient.user.email,
        adoption.listing.recipient.user.name ?? "Recipient",
        adoption.listing.rhuName
    )

    return NextResponse.json(updated)
}