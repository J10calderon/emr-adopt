import {Resend} from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string){
    console.log(`[EMAIL] to ${to} | subject: ${subject}`)
    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM!,
            to,
            subject,
            html,
        })
    } catch (error) {
        console.error("Email send failed:", error)
    }
}

export function welcomeEmail(name: string, role: string): string {
    return `<h1>Welcome, ${name}!</h1>
    <p>Your account has been created as a <strong>${role}</strong>.</p>
    <p>Visit <a href="${process.env.NEXT_PUBLIC_BASE_URL}">EMR Adopt</a> to get started.</p>`
}

export function listingValidatedEmail(recipientName: string | null, rhuName: string, action: string, notes?: string | null): string {
    return `<h1>Your listing has been ${action.toLowerCase()}</h1>
    <p>Hi ${recipientName}, <strong>${rhuName}</strong> has been ${action.toLowerCase()}.</p>
    ${notes ? `<p>Admin notes: ${notes}</p>` : ""}
    <p>Visit <a href="${process.env.NEXT_PUBLIC_BASE_URL}/recipient/listings">your dashboard</a> to view it.</p>`
}

export async function sendDonationConfirmationEmail(to: string, donorName: string, rhuName: string, amountCents: number) {
    const amount = (amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })
    const html = `<h1>Donation Confirmed</h1>
    <p>Hi ${donorName}, your donation of <strong>${amount}</strong> to <strong>${rhuName}</strong> was successful.</p>
    <p>Thank you for your generosity!</p>`
    await sendEmail(to, `Donation confirmed -- ${rhuName}`, html)
}

export async function sendDonationReceivedEmail(to: string, recipientName: string, rhuName: string, amountCents: number) {
    const amount = (amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })
    const html = `<h1>Donation Received</h1>
    <p>Hi ${recipientName}, <strong>${rhuName}</strong> received a donation of <strong>${amount}</strong>.</p>`
    await sendEmail(to, `Donation received -- ${rhuName}`, html)
}

export async function sendPaymentFailedEmail(to: string, donorName: string, rhuName: string) {
    const html = `<h1>Payment Failed</h1>
    <p>Hi ${donorName}, your monthly payment for <strong>${rhuName}</strong> could not be processed.</p>
    <p>Please update your payment method to continue supporting this RHU.</p>`
    await sendEmail(to, `Payment failed -- ${rhuName}`, html)
}

export async function sendAdoptionCancelledEmail(to: string, name: string, rhuName: string) {
    const html = `<h1>Adoption Cancelled</h1>
    <p>Hi ${name}, the adoption of <strong>${rhuName}</strong> has been cancelled.</p>`
    await sendEmail(to, `Adoption cancelled -- ${rhuName}`, html)
}

export async function sendMessagesReceivedEmail(to: string, recipientName: string, senderName: string, rhuName: string) {
    const html = `<h1>New message from ${senderName}</h1>
    <p>Hi ${recipientName}, you have a new message regarding <strong>${rhuName}</strong>.</p>
    <p>Log in to reply.</p>`
    await sendEmail(to, `New message -- ${rhuName}`, html)
}
