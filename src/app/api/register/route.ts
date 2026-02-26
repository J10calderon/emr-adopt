import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { sendEmail, welcomeEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, email, password, role, country, organization, position, phone } = body

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: "Missing required fields"}, {status: 400})
        }

        const existing = await prisma.user.findUnique({ where: { email }})
        if (existing){
            return NextResponse.json({ error: "Email already in use"}, { status: 409})
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                ...(role === "DONOR" && { //syntax spreads the values of the unnamed object {} that has donorprofile inside into the larger object data on condition of role===donor.
                    donorProfile: {
                        create: {country: country ?? "Unknown", organization },
                    },
                }),
                ...(role === "RECIPIENT" && {
                    recipientProfile: {
                        create: { organization, position, phone },
                    },
                }),
            },
        })
        Promise.all([
            createNotification(user.id, "WELCOME", "Welcome to EMR Adopt!", "Your account is ready.", "/"),
            sendEmail(user.email, "welcome to EMR adopt!", welcomeEmail(user.name, user.role)),
        ]).catch(console.error)

        return NextResponse.json({ success: true}, { status: 201})
    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json({ error: "Something went wrong" }, { status: 500})
    }
}