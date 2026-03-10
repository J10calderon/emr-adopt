import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "DONOR") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401})
    }

    const { listingId, isRecurring } = await req.json()

    const listing = await prisma.rHUListing.findUnique({
        where: { id: listingId },
        include: { recipient: true },
    })

    if (!listing || listing.status !== "VALIDATED") { 
        return NextResponse.json({ error: "Listing not available" }, { status: 400 })
    }

    if (!listing.recipient.stripeOnboarded || !listing.recipient.stripeAccountId) {
        return NextResponse.json({ error: "Recipient not onboarded"}, { status: 400 })
    }

    const donorProfile = await prisma.donorProfile.findUnique({
        where: { userId: session.user.id },
    })

    if (!donorProfile){
        return NextResponse.json({ error: "Donor profile not found" }, { status: 400})
    }

    const setting = await prisma.setting.findUnique({
        where: { key: "donation_amount_cents" },
    })

    const amountCents = setting ? parseInt(setting.value) : 50000
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!
    const destinationAccountId = listing.recipient.stripeAccountId

    let checkoutSession
    if (isRecurring) {
        const price = await stripe.prices.create(
            {
                unit_amount: amountCents,
                currency: "usd",
                recurring: { interval: "month" },
                product_data: { name: `Monthly Adoption: ${listing.rhuName}` },
            },
            { stripeAccount: destinationAccountId }
        )

        checkoutSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: price.id, quantity: 1}],
            // subscription_data: {
            //  transfer_data: { destination: destinationAccountId },
            //},
            metadata: {
                donorId: session.user.id,
                listingId,
                isRecurring: "true",
            },
            success_url: `${baseUrl}/donation/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/donation/cancel?listing_id=${listingId}`,
        })
    } else {
        checkoutSession = await stripe.checkout.sessions.create({
            mode: "payment",
            //payment_intent_data: {
            //  transfer_data: { destination: destinationAccountId },
            //},
            line_items: [
                    {
                    quantity: 1,
                    price_data:{
                    currency: "usd",
                    unit_amount: amountCents,
                        product_data: {
                            name: `Adopt ${listing.rhuName}`,
                            description: listing.description,
                        },
                    },
                },
            ],
            metadata: {
                donorId: session.user.id,
                listingId,
                isRecurring: "false",
            },
            success_url:`${baseUrl}/donation/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/donation/cancel?listing_id=${listingId}`,
        })
    }

    const adoption = await prisma.adoption.upsert({
        where: {
            donorId_listingId: {
                donorId: donorProfile.id,
                listingId,
            },
        },
        create: {
            donorId: donorProfile.id,
            listingId,
            isRecurring: isRecurring ?? false,
            status: "ACTIVE",
        },
        update: {},
    })

    await prisma.donation.create({
        data: {
            adoptionId: adoption.id,
            amountCents,
            status: "PENDING",
            stripeSessionId: checkoutSession.id,
        },
    })

    return NextResponse.json({ url: checkoutSession.url })
}