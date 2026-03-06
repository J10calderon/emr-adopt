import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import AdoptionTypeSelector from "./AdoptionTypeSelector"

interface Props {
    params: { listingId: string }
}

export default async function AdoptPage({ params }: Props) {
    const session = await getServerSession(authOptions)

    const listing = await prisma.rHUListing.findUnique({
        where: { id: params.listingId },
        include: { recipient: true },
    })

    if (!listing || listing.status !== "VALIDATED") notFound()

    const setting = await prisma.setting.findUnique({
        where: { key: "donation_amount_cents" },
    })

    const amountCents = setting ? parseInt(setting.value) : 50000

    const existingAdoption = session ? await prisma.adoption.findUnique({
        where: {
            donorId_listingId: {
                donorId: session.user.id,
                listingId: params.listingId,
            },
        },
    }) : null

    if (existingAdoption) {
        return (
            <div className="max-w-lg mx-auto py-12 px-4 text-center">
                <h1 className="text-2xl font-bold mb-2">Already Adopted</h1>
                <p className="text-muted-foreground mb-8">
                    You are already supporting {listing.rhuName}.
                </p>
                <Button asChild>
                    <Link href="/donor/dashboard">Go to Dashboard</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">Adopt an RHU</h1>

            <Card className="mb-8">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <CardTitle>{listing.rhuName}</CardTitle>
                        <Badge variant="secondary">Validated</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4"/>
                        <span>{listing.municipality}, {listing.province}</span>
                    </div>
                    <p className="text-sm">{listing.description}</p>
                </CardContent>
            </Card>

            <AdoptionTypeSelector listingId={params.listingId} amountCents={amountCents} />
        </div>
    )
}