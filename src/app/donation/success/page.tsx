import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function DonationSuccessPage() {
    return (
        <div className="max-w-lg mx-auto py-12 px-4 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4"/>
            <h1 className="text-2xl font-bold mb-2">Thank you for your donation!</h1>
            <p className="text-muted-foreground mb-8">
                Your payment was successful. You are now supporting an RHU in the Philippines.
            </p>
            <Button asChild>
                <Link href="/donor/dashboard">Go to Dashboard</Link>
            </Button>
        </div>
    )
}