import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { sendDonationConfirmationEmail, sendDonationReceivedEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const body = await req.text()
    const sig = req.headers.get("stripe-signature")!

    let event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400})
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object

        const donation = await prisma.donation.findFirst({
            where: { stripeSessionId: session.id },
            include: {
                adoption: {
                    include: {
                        donor: { include: { user: true } },
                        listing: { include: { recipient: { include: { user: true} } } },
                    },
                },
            },
        })

        if (donation) {
            await prisma.donation.update({
                where: { id: donation.id },
                data: { status: "COMPLETED" },
            })

            await createNotification(
                donation.adoption.donorId,
                "DONATION_CONFIRMED",
                `Your donation to ${donation.adoption.listing.rhuName} was successful!`
            )

            await createNotification(
                donation.adoption.listing.recipient.userId,
                "DONATION_RECEIVED",
                `You received a donation for ${donation.adoption.listing.rhuName}!`
            )

            await sendDonationConfirmationEmail(
                donation.adoption.donor.user.email,
                donation.adoption.donor.user.name ?? "Donor",
                donation.adoption.listing.rhuName,
                donation.amountCents
            )
            
            await sendDonationReceivedEmail(
                donation.adoption.listing.recipient.user.email,
                donation.adoption.listing.recipient.user.name ?? "Recipient",
                donation.adoption.listing.rhuName,
                donation.amountCents
            )
        }
    }

    if (event.type === "checkout.session.expired") {
        const session = event.data.object

        await prisma.donation.updateMany({
            where: { stripeSessionId: session.id },
            data: { status: "FAILED" },
        })
    }
    return NextResponse.json({ received: true})
}