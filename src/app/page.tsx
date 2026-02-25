import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const [donationSetting, validatedCount, activeAdoptionsCount, totalDonated] = await Promise.all([
    prisma.setting.findUnique({where: { key: "donation_amount_cents"}}),
    prisma.rHUListing.count({ where: {status: "VALIDATED" } }),
    prisma.adoption.count({where: { status: "ACTIVE" } }),
    prisma.donation.aggregate({ where: { status: "PAID"}, _sum: { amountCents: true} }),
  ])


  const donationAmount = parseInt(donationSetting?.value ?? "50000")
  const totalRaised = totalDonated._sum.amountCents ?? 0

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Adopt a Rural Health Unit
        </h1>
        <p className="text-xl text-gray-600 mb-2 max-w-2xl mx-auto">
          Support Philippine barangay health centers with a monthly donation of{" "}
          <span className="font-semibold text-blue-600">{formatCurrency(donationAmount)}/month</span>
        </p>
        <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
          Your donation funds essential medicines, equipment and supplies for communities that need it most.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/rhu"><Button size="lg">Browse RHUs</Button></Link>
          <Link href="/register"><Button size="lg" variant="outline">Register Your RHU</Button></Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-white py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-blue-600">{validatedCount}</p>
            <p className="text-sm text-gray-500 mt-1">Health Units Listed</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">{activeAdoptionsCount}</p>
            <p className="text-sm text-gray-500 mt-1">Active Donors</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalRaised)}</p>
            <p className="text-sm text-gray-500 mt-1">Total Raised</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-8 text-center">
          <div className="p-6 rounded-lg border">
            <div className="text-3xl mb-3">🏥</div>
            <h3 className="font-semibold mb-2">RHUs Apply</h3>
            <p className="text-sm text-gray-500">Rural health units register and describe their needs. Our team validates each listing.</p>
          </div>
          <div className="p-6 rounded-lg border">
            <div className="text-3xl mb-3">🤝</div>
            <h3 className="font-semibold mb-2">Donors Adopt</h3>
            <p className="text-sm text-gray-500">International donors browse validated RHUs and commit to a monthly donation.</p>
          </div>
          <div className="p-6 rounded-lg border">
            <div className="text-3xl mb-3">💊</div>
            <h3 className="font-semibold mb-2">Communities Benefit</h3>
            <p className="text-sm text-gray-500">Funds go directly to the health unit for medicines, equipment and supplies.</p>
          </div>
        </div>
      </section>

      {/* CTA for recipients */}
      <section className="bg-blue-600 text-white py-16 px-4 text-center">
        <h2 className="text-2xl font-bold mb-3">Are you an RHU manager?</h2>
        <p className="mb-6 text-blue-100">Register your health unit and connect with donors who want to help.</p>
        <Link href="/register"><Button size="lg" variant="outline" className="text-white border-white hover:bg-blue-700">Register your RHU</Button></Link>
      </section>
    </div>
  )
}