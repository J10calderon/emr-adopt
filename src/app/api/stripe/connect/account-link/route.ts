import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "RECIPIENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.recipientProfile.findUnique({
        where: { userId: session.user.id },
        include: { user: true },
    })

    if (!profile) return NextResponse.json({ error: "Profile not found"}, { status: 404 })

    let stripeAccountId = profile.stripeAccountId
    
    if (!stripeAccountId) {
        const account = await stripe.accounts.create({
            type: "express",
            country: "PH",
            email: profile.user.email,
            capabilities: {
                transfers: { requested: true},
            },
        })

        stripeAccountId = account.id
        await prisma.recipientProfile.update({
            where: { userId: session.user.id },
            data: { stripeAccountId },
        })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!

    const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        type: "account_onboarding",
        refresh_url: `${baseUrl}/recipient/stripe-onboarding`,
        return_url: `${baseUrl}/recipient/stripe-return`,
    })

    return NextResponse.json({ url: accountLink.url })

}