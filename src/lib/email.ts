import {Resend} from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string){
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

export function adoptionCreatedEmailDonor(donorName: string, rhuName: string): string {
    return `<h1>Adoption Confirmed</h1>
    <p>Hi ${donorName}, you are now supporting <strong>${rhuName}</strong>.</p>
    <p>Thank you for your generosity.</p>`
}

export function listingValidatedEmail(recipientName: string, rhuName: string): string {
    return `<h1>Your listing has been validated</h1>
    <p>Hi ${recipientName}, <strong>${rhuName}</strong> is now live and visible to donors.</p>`
}

export function messageReceivedEmail(recipientName: string, senderName: string, rhuName: string): string {
    return `<h1>New message from ${senderName}</h1>
    <p>Hi ${recipientName}, you have a message regarding <strong>${rhuName}</strong>.</p>
    <p>Log in to reply.</p>`
}

export function adoptionCancelledEmail(name: string, rhuName: string): string {
    return `<h1>Adoption Cancelled</h1>
    <p>Hi ${name} your adoption of <strong>${rhuName}</strong> has been cancelled.</p>`
}

export function subscriptionRenewedEmail(donorName: string, rhuName: string, amountCents: number): string {
    const amount = (amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "usd"})
    return `<h1>Donation Renewed</h1>
        <p>Hi ${donorName}, your monthly donation of <strong>${amount}</strong> to <strong>${rhuName}</strong> has been processed.</p>`
}