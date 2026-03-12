import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { sendDonationConfirmationEmail, sendDonationReceivedEmail, sendPaymentFailedEmail, sendAdoptionCancelledEmail } from "@/lib/email"
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

            // If recurring, store the subscription ID on the adoption
            if (session.metadata?.isRecurring === "true" && session.subscription) {
                await prisma.adoption.update({
                    where: { id: donation.adoptionId },
                    data: { stripeSubscriptionId: session.subscription as string },
                })
            }


            await createNotification(
                donation.adoption.donor.userId,
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

    if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription as string

        //Skip the first invoice - thats already handled by checkout.session.completed
        if (invoice.billing_reason === "subscription_create") {
            return NextResponse.json({ received: true })
        }

        const adoption = await prisma.adoption.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
            include: {
                donor: { include: { user: true} },
                listing: { include: { recipient: { include: { user: true} } } },
            },
        })

        if (adoption) {
            const amountCents = invoice.amount_paid

            await prisma.donation.create({
                data: {
                    adoptionId: adoption.id,
                    amountCents,
                    status: "COMPLETED",
                    stripePaymentIntentId: invoice.payment_intent as string,
                },
            })

            await createNotification(
                adoption.donor.userId,
                "DONATION_CONFIRMED",
                `Your monthly donation to ${adoption.listing.rhuName} was charged successfully.`
            )

            await createNotification(
                adoption.listing.recipient.userId,
                "DONATION_RECEIVED",
                `You received a monthly donation for ${adoption.listing.rhuName}!`
            )

            await sendDonationConfirmationEmail(
                adoption.donor.user.email,
                adoption.donor.user.name ?? "Donor",
                adoption.listing.rhuName,
                amountCents
            )

            await sendDonationReceivedEmail(
                adoption.listing.recipient.user.email,
                adoption.listing.recipient.user.name ?? "Recipient",
                adoption.listing.rhuName,
                amountCents
            )
        }
    }

    if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription as string

        const adoption = await prisma.adoption.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
            include: {
                donor: { include: { user: true} },
                listing: true,
            },
        })

        if (adoption) {
            await createNotification(
                adoption.donor.userId,
                "PAYMENT_FAILED",
                `Your monthly payment for ${adoption.listing.rhuName} failed. Please update your payment method.`
            )
            await sendPaymentFailedEmail(
                adoption.donor.user.email,
                adoption.donor.user.name ?? "Donor",
                adoption.listing.rhuName
            )
        }
    }

    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object

        const adoption = await prisma.adoption.findFirst({
            where: { stripeSubscriptionId: subscription.id },
            include: {
                donor: { include: { user: true} },
                listing: { include: { recipient: { include: { user: true} } } },
            },
        })

        if (adoption) {
            await prisma.adoption.update({
                where: { id: adoption.id },
                data: {
                    status: "CANCELLED",
                    cancelledAt: new Date(),
                },
            })

            await createNotification(
                adoption.donor.userId,
                "ADOPTION_CANCELLED",
                `Your monthly adoption of ${adoption.listing.rhuName} has been cancelled.`
            )

            await createNotification(
                adoption.listing.recipient.userId,
                "ADOPTION_CANCELLED",
                `A monthly adoption of ${adoption.listing.rhuName} has been cancelled.`
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
        }
    }
    return NextResponse.json({ received: true})
}