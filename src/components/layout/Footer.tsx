import Link from "next/link"

export function Footer() {
    return (
        <footer className="border-t bg-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <p className="font-semibold text-gray-900">EMR Adopt</p>
                    <p className="text-sm text-gray-500">Connecting donors with rural health units in the Philippines</p>
                </div>
            <div className="flex gap-6 text-sm text-gray-500">
                <Link href="/rhu" className="hover:text-gray-900">Browse RHUs</Link>
                <Link href="/register" className="hover:text-gray-900">Register</Link>
                <Link href="/login" className="hover:text-gray-900">Sign In</Link>
            </div>
            </div>
        </footer>
    )
}