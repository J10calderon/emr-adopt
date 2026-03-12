import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized"}, { status: 401})
    }

    const setting = await prisma.setting.findUnique({
        where: { key: "donation_amount_cents" },
    })

    return NextResponse.json(setting)
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized"}, { status: 401 })
    }

    const { value } = await req.json()

    const setting = await prisma.setting.upsert({
        where: { key: "donation_amount_cents" },
        update: { value },
        create: { key: "donation_amount_cents", value },
    })

    return NextResponse.json(setting)
}