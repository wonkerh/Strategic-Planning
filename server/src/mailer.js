import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const C = {
  navy: '#0B2D59',
  gold: '#D1A33A',
  green: '#3A8A36',
  ink: '#333333',
  muted: '#5A6B7C',
  line: '#D0D7E0',
  panel: '#E8F0F8',
  soft: '#F8F9FA',
  paper: '#FFFFFF',
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'Courier New', Courier, monospace";

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout({ preheader, eyebrow, content }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>Visionary Wealth Circle</title>
<style>
  @media only screen and (max-width:620px) {
    .px { padding-left:22px !important; padding-right:22px !important; }
    .hero { font-size:36px !important; }
    .stack { display:block !important; width:100% !important; text-align:left !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:${C.soft};">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.soft};">
<tr><td align="center" style="padding:36px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">
    <!-- Masthead -->
    <tr><td align="center" style="padding:0 0 22px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" width="44" height="44" style="width:44px; height:44px; background-color:${C.navy}; border-radius:22px; font-family:${SERIF}; font-size:17px; font-weight:bold; font-style:italic; color:${C.gold}; letter-spacing:1px;">VW</td>
          <td style="padding-left:12px; font-family:${SERIF}; font-size:19px; color:${C.navy}; letter-spacing:0.3px;">Visionary Wealth Circle</td>
        </tr>
      </table>
    </td></tr>

    <!-- Card -->
    <tr><td style="background-color:${C.paper}; border-radius:14px; overflow:hidden; border:1px solid ${C.gold};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="px" align="center" style="background-color:${C.navy}; padding:34px 40px 30px 40px;">
          <p style="margin:0; font-family:${SANS}; font-size:11px; font-weight:bold; letter-spacing:4px; color:${C.gold};">${esc(eyebrow)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px auto 0 auto;">
            <tr>
              <td style="width:36px; border-top:1px solid ${C.gold}; font-size:0; line-height:0;">&nbsp;</td>
              <td style="padding:0 10px; font-family:${SANS}; font-size:10px; letter-spacing:3px; color:#FFFFFF;">BUILDING WEALTH TOGETHER</td>
              <td style="width:36px; border-top:1px solid ${C.gold}; font-size:0; line-height:0;">&nbsp;</td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="height:4px; line-height:4px; font-size:0; background-color:${C.gold};">&nbsp;</td></tr>
        <tr><td class="px" style="padding:40px 44px 36px 44px; font-family:${SANS}; color:${C.ink};">
          ${content}
        </td></tr>
        <tr><td class="px" align="center" style="background-color:${C.soft}; border-top:1px solid ${C.line}; padding:22px 40px;">
          <p style="margin:0; font-family:${SANS}; font-size:12px; line-height:18px; color:${C.muted};">&copy; 2026 Visionary Wealth Circle. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function button(href, label, color) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
    <tr><td align="center" bgcolor="${color}" style="border-radius:50px;">
      <a href="${href}" target="_blank" style="display:inline-block; padding:16px 42px; font-family:${SANS}; font-size:15px; font-weight:bold; letter-spacing:1px; color:#FFFFFF; text-decoration:none; border-radius:50px;">${label} &nbsp;&rarr;</a>
    </td></tr>
  </table>`;
}

function row(label, valueHtml, last = false) {
  const b = last ? '' : `border-bottom:1px solid ${C.line};`;
  return `<tr>
    <td class="stack" style="padding:14px 0; ${b} font-family:${SANS}; font-size:11px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; color:${C.muted};">${label}</td>
    <td class="stack" align="right" style="padding:14px 0; ${b} font-family:${SANS}; font-size:16px; color:${C.ink}; font-weight:bold;">${valueHtml}</td>
  </tr>`;
}

function credentialsEmailHtml(fullName, username, tempPassword) {
  const content = `
    <h1 class="hero" style="margin:0 0 6px 0; font-family:${SERIF}; font-size:30px; line-height:38px; font-weight:normal; color:${C.navy};">Welcome to Visionary Wealth Circle, <span style="font-style:italic; color:${C.navy};">${esc(fullName)}</span>!</h1>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 22px 0;"><tr><td style="width:48px; border-top:3px solid ${C.gold}; font-size:0; line-height:0;">&nbsp;</td></tr></table>
    <p style="margin:0 0 10px 0; font-size:16px; line-height:25px; color:${C.muted};">Your account has been successfully created by the committee.</p>
    <p style="margin:0 0 26px 0; font-size:16px; line-height:25px; color:${C.muted};">Here are your login details:</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.panel}; border:1px solid ${C.line}; border-top:4px solid ${C.gold}; border-radius:10px; margin:0 0 26px 0;">
      <tr><td style="padding:22px 26px 10px 26px;">
        <p style="margin:0 0 4px 0; font-family:${SANS}; font-size:11px; font-weight:bold; letter-spacing:3px; color:${C.navy};">MEMBER ACCESS</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${row('Username', esc(username))}
          ${row('Temporary Password', `<span style="display:inline-block; font-family:${MONO}; font-size:17px; letter-spacing:1px; background-color:${C.paper}; border:1px solid ${C.line}; border-radius:6px; padding:6px 12px; color:${C.navy};">${esc(tempPassword)}</span>`, true)}
        </table>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 30px 0;">
      <tr>
        <td width="4" style="background-color:${C.gold}; border-radius:4px;">&nbsp;</td>
        <td style="background-color:${C.soft}; padding:16px 20px; font-size:14px; line-height:22px; color:${C.ink}; border-radius:0 8px 8px 0;">
          <strong>Important:</strong> When you log in for the first time, you will be required to create a new secret password.
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:25px; color:${C.muted}; text-align:center;">Click the link below to log in:</p>
    ${button('https://www.strategicplanning.dpdns.org/auth/login.html', 'Log In Now', C.gold)}

    <p style="margin:36px 0 0 0; padding-top:22px; border-top:1px solid ${C.line}; font-size:12px; line-height:19px; color:${C.muted}; text-align:center;">If you did not request this, please contact the committee immediately.</p>
  `;
  return layout({ preheader: 'Your account has been created. Here are your login details.', eyebrow: 'WELCOME', content });
}

function depositEmailHtml(fullName, amount, date, note) {
  const amt = Number(amount).toFixed(2);
  const content = `
    <p style="margin:0 0 6px 0; font-family:${SANS}; font-size:11px; font-weight:bold; letter-spacing:3px; color:${C.navy}; text-align:center;">PAYMENT CONFIRMED</p>
    <p class="hero" style="margin:0; font-family:${SERIF}; font-size:48px; line-height:56px; color:${C.navy}; text-align:center;">R ${amt}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:16px auto 28px auto;">
      <tr><td style="background-color:${C.green}; color:#FFFFFF; font-family:${SANS}; font-size:11px; font-weight:bold; letter-spacing:2px; padding:7px 16px; border-radius:50px;">&#10003;&nbsp; RECEIVED</td></tr>
    </table>

    <h2 style="margin:0 0 14px 0; font-family:${SERIF}; font-size:22px; font-weight:normal; color:${C.navy}; text-align:center;">Payment Confirmed!</h2>
    <p style="margin:0 0 28px 0; font-size:16px; line-height:25px; color:${C.muted}; text-align:center;">
      Hi ${esc(fullName)},<br>
      We have successfully recorded your contribution to the stokvel.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.panel}; border:1px solid ${C.line}; border-top:4px solid ${C.gold}; border-radius:10px; margin:0 0 26px 0;">
      <tr><td style="padding:22px 26px 10px 26px;">
        <p style="margin:0 0 4px 0; font-family:${SANS}; font-size:11px; font-weight:bold; letter-spacing:3px; color:${C.navy};">TRANSACTION DETAILS</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${row('Amount', `<span style="font-family:${MONO}; font-size:18px; color:${C.green};">R ${amt}</span>`)}
          ${row('Date', esc(date))}
          ${row('Reference', esc(note || 'Monthly Contribution'), true)}
        </table>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;">
      <tr>
        <td width="4" style="background-color:${C.gold}; border-radius:4px;">&nbsp;</td>
        <td style="background-color:${C.soft}; padding:16px 20px; font-size:14px; line-height:22px; color:${C.ink}; border-radius:0 8px 8px 0;">
          Your funds are now locked in your 12-month contract and will begin generating returns based on the committee's ROI.
        </td>
      </tr>
    </table>

    ${button('https://www.strategicplanning.dpdns.org/wallet.html', 'View Your Wallet', C.green)}
  `;
  return layout({ preheader: `Your contribution of R ${amt} has been recorded.`, eyebrow: 'RECEIPT', content });
}


function resetEmailHtml(fullName, token) {
  const resetLink = `https://www.strategicplanning.dpdns.org/auth/reset.html?token=${token}`;
  const content = `
    <h1 class="hero" style="margin:0 0 6px 0; font-family:${SERIF}; font-size:30px; line-height:38px; font-weight:normal; color:${C.navy};">Password Reset Request</h1>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 22px 0;"><tr><td style="width:48px; border-top:3px solid ${C.gold}; font-size:0; line-height:0;">&nbsp;</td></tr></table>
    <p style="margin:0 0 26px 0; font-size:16px; line-height:25px; color:${C.muted};">Hi ${esc(fullName)},<br>We received a request to reset your password. Click the button below to choose a new one. This link expires in 30 minutes.</p>
    
    ${button(resetLink, 'Reset My Password', C.gold)}

    <p style="margin:36px 0 0 0; padding-top:22px; border-top:1px solid ${C.line}; font-size:12px; line-height:19px; color:${C.muted}; text-align:center;">If you did not request this, you can safely ignore this email.</p>
  `;
  return layout({ preheader: 'Reset your Visionary Wealth Circle password.', eyebrow: 'SECURITY', content });
}
// --- ACTUAL SENDING FUNCTIONS ---

export async function sendCredentialsEmail(toEmail, fullName, username, tempPassword) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Visionary Wealth Circle <onboarding@resend.dev>',
      to: [toEmail],
      subject: 'Your Visionary Wealth Circle Login Details',
      html: credentialsEmailHtml(fullName, username, tempPassword),
    });

    if (error) {
      console.error("Resend Error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Email sending failed:", err);
    return { success: false, error: err.message };
  }
}

export async function sendDepositEmail(toEmail, fullName, amount, date, note) {
  if (!toEmail) return { success: false, error: "No email on file" };

  try {
    const { data, error } = await resend.emails.send({
      from: 'Visionary Wealth Circle <onboarding@resend.dev>',
      to: [toEmail],
      subject: 'Payment Received - Visionary Wealth Circle',
      html: depositEmailHtml(fullName, amount, date, note),
    });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function sendResetEmail(toEmail, fullName, token) {
  if (!toEmail) return { success: false, error: "No email on file" };
  try {
    const { data, error } = await resend.emails.send({
      from: 'Visionary Wealth Circle <onboarding@resend.dev>',
      to: [toEmail],
      subject: 'Password Reset - Visionary Wealth Circle',
      html: resetEmailHtml(fullName, token),
    });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
