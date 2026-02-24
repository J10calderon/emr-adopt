import { PrismaClient } from "../src/generated/prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  //set donation cost
  await prisma.setting.upsert({
    where: {key: "donation_amount_cents"},
    update: {},
    create: {key: "donation_amount_cents", value: "50000"},
  })
  console.log("✓ Setting: donation_amount_cents = 50000 ($500)")

  //create admin user
  const adminPassword = await bcrypt.hash("admin123!", 10)
  await prisma.user.upsert({
    where: {email: "admin@emradopt.org"},
    update: {},
    create: {
        email: "admin@emradopt.org",
        password: adminPassword,
        name: "Platform Admin",
        role: "ADMIN",
    },
  })
  console.log("✓ Admin user: admin@emradopt.org / admin123!")

  //create recipient user
  const recipientPassword = await bcrypt.hash("recipient123!", 10)
  const recipientUser = await prisma.user.upsert({
    where: {email: "recipient@example.com"},
    update: {},
    create: {
        email: "recipient@example.com",
        password: recipientPassword,
        name: "Maria Santos",
        role: "RECIPIENT",
        recipientProfile: {
            create: {
                organization: "Barangay Sta. Cruz Rural Health Unit", 
                position: "RHU Manager",
                phone: "+63 917 123 4567",
            },
        },
    },
    include: {recipientProfile: true},
  })
console.log("✓ Recipient user: recipient@example.com / recipient123!")


  //create donor user
  const donorPassword = await bcrypt.hash("donor123!", 10)
  await prisma.user.upsert({
    where: {email: "donor@example.com"},
    update: {},
    create: {
        email: "donor@example.com",
        password: donorPassword,
        name: "John Smith",
        role: "DONOR",
        donorProfile: {
            create: {
                country: "United States",
                organization: "Smith Family Foundation",
            },
        },
    },
  })
  console.log("✓ Donor user: donor@example.com / donor123!")

  //create the listings
  const recipientProfile = recipientUser.recipientProfile!

  await prisma.rHUListing.upsert({
    where: { id: "sample-listing-1"},
    update: {},
    create: {
        id: "sample-listing-1",
        recipientId: recipientProfile.id,
        rhuName: "Sta. Cruz Rural Health Unit",
        description: "The Sta. Cruz RHU serves over 12,000 residents across 8 barangays in Laguna. Built in 1987, our facility urgently needs modernization.",
        location: "Sta. Cruz",
        province: "Laguna",
        region: "CALABARZON",
        status: "VALIDATED",
        validatedAt: new Date(),
        validatedBy: "Platform Admin",
    },
  })

    await prisma.rHUListing.upsert({
    where: { id: "sample-listing-2" },
    update: {},
    create: {
        id: "sample-listing-2",
        recipientId: recipientProfile.id,
        rhuName: "San Isidro Barangay Health Center",
        description: "Located in a remote area of Eastern Samar, the San Isidro Health Center covers 6,500 residents with limited road access.",
        location: "San Isidro",
        province: "Eastern Samar",
        region: "Eastern Visayas",
        status: "VALIDATED",
        validatedAt: new Date(),
        validatedBy: "Platform Admin",
    },
    })

    await prisma.rHUListing.upsert({
    where: { id: "sample-listing-3" },
    update: {},
    create: {
        id: "sample-listing-3",
        recipientId: recipientProfile.id,
        rhuName: "Mabini Community Health Center",
        description: "Serving the coastal community of Mabini in Batangas, our health center handles over 200 patients per month.",
        location: "Mabini",
        province: "Batangas",
        region: "CALABARZON",
        status: "PENDING_VALIDATION",
    },
  })

  console.log("✓ 3 sample RHU listings created (2 validated, 1 pending)")
  console.log("\nSeed complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })