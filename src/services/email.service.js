import nodemailer from 'nodemailer';
import { config } from '../config/config.js';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false, 
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"AFT" <${config.email.from}>`,
    to: to,
    subject: 'Your Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
        <h2>Email Verification</h2>
        <p>Please use the code below to verify your email address.</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; background: #f2f2f2; padding: 10px 20px; display: inline-block;">
          ${otp}
        </p>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to: ${to}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Could not send verification email.');
  }
};