const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, otp) => {
  const isSmtpConfigured =
    process.env.EMAIL_USER &&
    process.env.EMAIL_USER !== 'your-email@gmail.com' &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_PASS !== 'your-smtp-app-password';

  if (!isSmtpConfigured) {
    // If SMTP is not set, print to console for easy local developer copying
    console.log('\n=========================================');
    console.log(`[MAIL MOCK] OTP for ${email}: ${otp}`);
    console.log(`[MAIL MOCK] Expires in 5 minutes.`);
    console.log('=========================================\n');
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"MediScan AI" <noreply@mediscan.ai>',
      to: email,
      subject: 'MediScan AI - Login Verification Security Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 8px;">
          <h2 style="color: #10b981; text-align: center;">MediScan AI Login Verification</h2>
          <p>Hello,</p>
          <p>We received a login request for your clinical analysis dashboard. Please use the following One-Time Password (OTP) to complete your verification:</p>
          <div style="text-align: center; margin: 30px 0; padding: 15px; background-color: #f4fbf7; border-radius: 6px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This security code is valid for <strong>5 minutes</strong>. If you did not request this login, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 30px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">MediScan AI Clinical Portal &bull; Secure Systems</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] OTP Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('SMTP failed sending OTP email, logging to console as fallback:', error);
    console.log('\n=========================================');
    console.log(`[MAIL FALLBACK] OTP for ${email}: ${otp}`);
    console.log('=========================================\n');
    return false;
  }
};

module.exports = { sendOTPEmail };
