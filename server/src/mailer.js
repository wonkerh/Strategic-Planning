import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCredentialsEmail(toEmail, fullName, username, tempPassword) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Visionary Wealth Circle <onboarding@resend.dev>', 
      to: [toEmail],
      subject: 'Your Visionary Wealth Circle Login Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #0B2D59;">Welcome to Visionary Wealth Circle, ${fullName}!</h2>
          <p>Your account has been successfully created by the committee.</p>
          <p>Here are your login details:</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Username:</strong> ${username}</p>
            <p style="margin: 10px 0 0 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <p><strong>Important:</strong> When you log in for the first time, you will be required to create a new secret password.</p>
          <p>Click the link below to log in:</p>
          <a href="https://www.strategicplanning.dpdns.org/auth/login.html" style="display: inline-block; background-color: #D1A33A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log In Now</a>
          <p style="margin-top: 30px; font-size: 12px; color: #777;">If you did not request this, please contact the committee immediately.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return { success: false, error: error.message };
    }

    console.log("Email sent successfully:", data.id);
    return { success: true, data };
  } catch (err) {
    console.error("Email sending failed:", err);
    return { success: false, error: err.message };
  }
}
