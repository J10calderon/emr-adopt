import { prisma } from "@/lib/prisma"
import { RHUCard } from "@/components/rhu/RHUCard"

type Props = {
    searchParams: { search?: string}
}

export default async function RHUListingPage({ searchParams }: Props) {
    const search = searchParams.search

    const listings = await prisma.rHUListing.findMany({
        where: {
            status: "VALIDATED",
            ...(search && {
              OR: [
                { rhuName: { contains: search }},
                { location: { contains: search }},
                { province: { contains: search }},
              ],
            }),
        },
    include: {
        _count: {
            select: {
                adoptions: { where: { status: "ACTIVE" } },
            },
        },
    },
    orderBy: { createdAt: "desc" },
    })

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse RHUs</h1>
            <p className="text-gray-600 mb-6">Support a rural health unit in the Philippines</p>

            {/* Search form -- plain HTML form with GET method, no JS needed */}
            <form method="GET" className="mb-8">
                <div className="flex gap-2 max-w-md">
                    <input
                        type="text"
                        name="search"
                        defaultValue={search}
                        placeholder="Search by name, location or province..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
                    >
                        Search
                    </button>
                    {search && (
                        <a href="/rhu" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                            Clear
                        </a>
                    )}
                </div>
            </form>
            {/* Results */}
            {listings.length === 0 ? (
                <p className="text-gray-500">No listings found{search ? ` for "${search}"` : ""}.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                        <RHUCard key={listing.id} listing={listing} />
                    ))}
                </div>
            )}
        </div>
    )
}