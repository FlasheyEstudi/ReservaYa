export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
    // In a real production app, use Resend, SendGrid, or AWS SES
    // For this MVP/Audit fix, we will log it if no API key is present, 
    // but structure it so it's ready for a provider.

    const API_KEY = process.env.EMAIL_API_KEY;
    const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev'; // Default testing domain

    try {
        if (!API_KEY) {
            console.log('================= MOCK EMAIL (Configura EMAIL_API_KEY para enviar real) =================');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Body: ${text || 'HTML Content'}`);
            console.log('=========================================================================================');
            return true;
        }

        // Implementation using standard fetch for Resend API
        // Documentation: https://resend.com/docs/api-reference/emails/send-email
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [to], // Resend expects an array
                subject: subject,
                html: html,
                text: text
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error('Resend API Error:', JSON.stringify(errorData));
            return false;
        }

        const data = await res.json();
        console.log(`[Email] Enviado exitosamente vía Resend. ID: ${data.id}`);
        return true;

    } catch (error) {
        console.error('Email sending failed (Network Error):', error);
        return false;
    }
}
