import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: { id: string } }

//POST /api/listings/[id]/submit -- recipient submits listing for validation
export async function POST(req: Request, { params }: Params) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "RECIPIENT") {
        return NextResponse.json({ error: "Unauthorized" }, {status: 401})
    }

    const listing = await prisma.rHUListing.findUnique({
        where: { id: params.id },
        include: { recipient: true },
    })

    if (!listing) {
        return NextResponse.json({ error: "Listing not found"}, { status: 404})
    }

    //Make sure this listing belongs to the logged-in recipient
    if (listing.recipient.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403})
    }

    //Can only submit DRAFT or REJECTED listings
    if (!["DRAFT", "REJECTED"].includes(listing.status)) {
        return NextResponse.json({ error: "Listing cannot be submitted" }, { status: 400})
    }

    const updated = await prisma.rHUListing.update({
        where: { id: params.id },
        data: { status: "PENDING_VALIDATION" },
    })

    return NextResponse.json(updated)
}
