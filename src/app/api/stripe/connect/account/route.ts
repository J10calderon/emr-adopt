import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "RECIPIENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.recipientProfile.findUnique({
        where: { userId: session.user.id },
    })

    if (!profile?.stripeAccountId) {
        return NextResponse.json({ connected: false, onboarded: false})
    }

    const account = await stripe.accounts.retrieve(profile.stripeAccountId)

    return NextResponse.json({
        connected: true,
        onboarded: account.details_submitted,
    })
}