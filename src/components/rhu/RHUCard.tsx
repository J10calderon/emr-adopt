import Link from "next/link"
import { ValidationBadge } from "@/components/rhu/ValidationBadge"

type Props = {
    listing: {
        id: string
        rhuName: string
        location: string
        province: string
        description: string
        imageUrl: string | null
        status: string
        _count: {
            adoptions: number
        }
    }
}

export function RHUCard({ listing }: Props) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Image area */}
            <div className="relative h-48 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                {listing.imageUrl ? (
                    <img src={listing.imageUrl} alt={listing.rhuName} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-6xl">🏥</span>
                )}
                {/* Status badge - top right corner */}
                <div className="absolute top-3 right-3">
                    <ValidationBadge status={listing.status} />
                </div>
            </div>
            {/* Card body */}
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-lg">{listing.rhuName}</h3>
                <p className="text-sm text-gray-500 mt-1">📍 {listing.location}, {listing.province}</p>
                <p className="text-sm text-gray-600 mt-2 line-clamp-3">{listing.description}</p>


                {/* Footer */}
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                        {listing._count.adoptions} active donor{listing._count.adoptions !== 1 ? "s": ""}
                    </span>
                    <div className="flex gap-2">
                        <Link
                        href={`/rhu/${listing.id}`}
                        className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                        View
                        </Link>
                        {listing.status === "VALIDATED" && (
                            <Link
                            href={`/donor/adopt/${listing.id}`}
                            className="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                            Adopt
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}