import Link from "next/link"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"

export default function DonationCancelPage() {
    return (
        <div className="max-w-lg mx-auto py-12 px-4 text-center">
            <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
            <h1 className="text-2xl font-bold mb-2">Payment cancelled</h1>
            <p className="text-muted-foreground mb-8">
                No charge was made. You can try again whenever you're ready.
            </p>
            <Button asChild>
                <Link href="/rhu">Browse RHUs</Link>
            </Button>
        </div>
    )
}