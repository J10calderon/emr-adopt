import Link from "next/link"

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h2>
                <p className="text-gray-500 mb-4">The page you're looking for doesn't exist.</p>
                <Link href="/" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
                    Go home
                </Link>
            </div>
        </div>
    )
}