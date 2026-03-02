import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

//GET /api/listings -- public returns all validated listings
export async function GET() {
    const listings = await prisma.rHUListing.findMany({
        where: { status: "VALIDATED" },
        orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(listings)
}

//POST /api/listings -- recipients only, creates a new listing
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "RECIPIENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401})
    }

    const { rhuName, description, location, province, region, receiptInstructions } = await req.json();

    if (!rhuName || !description || !location || !province || !region) {
        return NextResponse.json({ error: "Missing required fields"}, {status: 400})
    }

    const profile = await prisma.recipientProfile.findUnique({
        where: { userId: session.user.id},
    })

    if (!profile) {
        return NextResponse.json({ error: "Recipient profile not found" }, { status: 404})
    }

    const listing = await prisma.rHUListing.create({
        data: {
            recipientId: profile.id,
            rhuName,
            description,
            location,
            province,
            region,
            receiptInstructions,
            status: "DRAFT",
        },
    })

    return NextResponse.json(listing, { status: 201})
}