import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const body = await req.text()
    const sig = req.headers.get("stripe-signature")!

    let event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIP_CONNECT_WEBHOOK_SECRET!
        )
    } catch (err) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400})
    }

    if (event.type === "account.updated") {
        const account = event.data.object

        if (account.details_submitted) {
            await prisma.recipientProfile.updateMany({
                where: { stripeAccountId: account.id},
                data: { stripeOnboarded: true },
            })
        }
    }

    return NextResponse.json({ received: true })
}