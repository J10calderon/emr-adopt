import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const listings = await prisma.rHUListing.findMany({
         where: status ? { status } : undefined, 
         include: {
            recipient: {
                include: { user: true },
            },
            _count: { select: { adoptions: true} },
         },
         orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(listings)
}