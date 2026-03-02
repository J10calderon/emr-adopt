import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Params =  { params: { id: string } }

//PATCH /api/listings[id] -- recipient edits their own listing
export async function PATCH(req: Request, { params }: Params) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "RECIPIENT"){
        return NextResponse.json({ error: "Unauthorized" }, { status: 401})
    }

    const listing = await prisma.rHUListing.findUnique({
        where: { id: params.id },
        include: { recipient: true },
    })

    if (!listing) {
        return NextResponse.json({ error: "Listing not found" }, {status: 404})
    }

    //Make sure this listing belongs to the logged-in recipient
    if (listing.recipient.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403})
    }

    //Can only edit DRAFT or REJECTED listings
    if (!["DRAFT", "REJECTED"].includes(listing.status)) {
        return NextResponse.json({ error: "Cannot edit this listing" }, { status: 400 })
    }

    const { rhuName, description, location, province, region, receiptInstructions } = await req.json()

    const updated = await prisma.rHUListing.update({
        where: { id: params.id },
        data: { rhuName, description, location, province, region, receiptInstructions},
    })

    return NextResponse.json(updated)
}