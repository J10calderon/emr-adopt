import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createNotification } from "@/lib/notifications"
import { sendEmail, listingValidatedEmail } from "@/lib/email"

type Props = { params: { id: string } }


export async function PATCH(req: Request, { params }: Props) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, notes } = await req.json()

    const listing = await prisma.rHUListing.findUnique({
        where: { id: params.id },
        include: { recipient: { include: { user: true} } }, 
    })

    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const newStatus = 
        action === "APPROVED" ? "VALIDATED" :
        action === "REJECTED" ? "REJECTED" : "DRAFT"

    await prisma.listingValidation.create({
        data: {
            listingId: listing.id,
            adminId: session.user.id,
            action,
            notes,
        },
    })

    await prisma.rHUListing.update({
        where: { id: listing.id },
        data: {
            status: newStatus,
            validationNotes: notes,
            validatedAt: new Date(),
            validatedBy: session.user.id,
        },
    })

    await Promise.all([
        createNotification(
            listing.recipient.userId,
            "LISTING_VALIDATED",
            `Your listing was ${action.toLowerCase()}`,
            notes ?? "",
            `/recipient/listings/${listing.id}`
        ),
        sendEmail(
            listing.recipient.user.email,
            `Your listing has been ${action.toLowerCase()}`,
            listingValidatedEmail(listing.recipient.user.name, listing.rhuName, action, notes)
        ),
    ]).catch(console.error)

    return NextResponse.json({ success: true })



}
