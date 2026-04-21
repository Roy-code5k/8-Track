import nodemailer from 'nodemailer';

let transporter;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transporter;
};

/**
 * Send a 6-digit OTP email to the user.
 * @param {string} to - Recipient email address
 * @param {string} otp - Plaintext 6-digit OTP
 */
const sendOtpEmail = async (to, otp) => {
    const mailOptions = {
        from: `"8Track" <${process.env.SMTP_USER}>`,
        to,
        subject: '🔐 Your 8Track Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; background: #0C0C0E; color: #F0EEE8; border-radius: 12px; padding: 32px; border: 1px solid #2A2A30;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #F0A830; margin: 0;">8Track</h2>
                    <p style="color: #6B6B72; font-size: 14px; margin: 4px 0 0;">Study smarter. Never miss a class.</p>
                </div>
                <h3 style="color: #F0EEE8; margin: 0 0 8px;">Verify your email</h3>
                <p style="color: #8A8A95; font-size: 14px; line-height: 1.6;">
                    Use the code below to complete your 8Track account registration. 
                    This code expires in <strong style="color: #F0EEE8;">${process.env.OTP_EXPIRES_MINUTES || 10} minutes</strong>.
                </p>
                <div style="background: #1C1C1F; border: 1px solid #2A2A30; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #F0A830;">${otp}</span>
                </div>
                <p style="color: #4A4A52; font-size: 12px; margin: 0;">
                    If you didn't request this code, you can safely ignore this email.
                </p>
            </div>
        `,
    };

    await getTransporter().sendMail(mailOptions);
};

export {  sendOtpEmail  };
