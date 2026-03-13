import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"

export default async function StripeReturnPage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "RECIPIENT") redirect ("/login")

    const profile = await prisma.recipientProfile.findUnique({
        where: { userId: session.user.id},
    })

    if (!profile?.stripeAccountId) redirect("/recipient/stripe-onboarding")

    const account = await stripe.accounts.retrieve(profile.stripeAccountId)

    if (account.details_submitted && !profile.stripeOnboarded) {
        await prisma.recipientProfile.update({
            where: { userId: session.user.id },
            data: { stripeOnboarded: true },
        })
    }

    const onboarded = account.details_submitted
    
    return (
        <div className="max-w-lg mx-auto py-12 px-4 text-center">
            {onboarded ? (
                <>
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                    <h1 className="text-2xl font-bold mb-2">You're all set!</h1>
                    <p className="text-muted-foreground mb-8">
                        Your bank account is connected. Donors can now adopt your listings.
                    </p>
                    <Button asChild>
                        <Link href="/recipient/dashboard">Go to Dashboard</Link>
                    </Button>
                </>
            ) : ( 
                <>
                    <XCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4"/>
                    <h1 className="text-2xl font-bold mb-2">Onboarding incomplete</h1>
                    <p className="text-muted-foreground mb-8">
                        It looks like you didn't finish. You can continue where you left off.
                    </p>
                    <Button asChild>
                        <Link href="/recipient/stripe-onboarding">Continue Onboarding</Link>
                    </Button>
                </>
            )}
        </div>
    )
}