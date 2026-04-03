const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes("your_")) {
    console.warn("⚠️  EMAIL_USER not configured — OTPs will log to console only");
    return null;
  }

  // Works on both local and cloud hosts (Render, Railway, etc.)
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL — more reliable than service:"gmail" on cloud
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // required on Render / cloud environments
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  console.log("✉️  Mailer ready:", process.env.EMAIL_USER);
  return transporter;
}

async function sendMail(to, subject, html) {
  const t = getTransporter();
  if (!t) {
    console.log("═══════════════════════════════════════");
    console.log(`📧 [DEV EMAIL] To: ${to}`);
    console.log(`   Subject: ${subject}`);
    const otpMatch = html.match(/\b(\d{6})\b/);
    if (otpMatch) console.log(`   ✅ OTP CODE: ${otpMatch[1]}`);
    console.log("═══════════════════════════════════════");
    return { mock: true, otp: html.match(/\b(\d{6})\b/)?.[1] };
  }

  try {
    const info = await t.sendMail({
      from: `"Libraria 📚" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✉️  Email sent to ${to} — ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    // Don't crash the server — log and continue
    console.log("   Falling back to console log...");
    const otpMatch = html.match(/\b(\d{6})\b/);
    if (otpMatch) console.log(`   OTP CODE: ${otpMatch[1]}`);
    throw new Error(`Email delivery failed: ${err.message}. Check your Gmail App Password in Render environment variables.`);
  }
}

function registrationOTPTemplate(name, otp) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0e0f13;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
    <div style="background:#161820;border:1px solid #2e3040;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#e8c878,#c9a84c);padding:28px 32px;text-align:center;">
        <div style="font-size:28px;margin-bottom:6px;">📚</div>
        <div style="font-size:22px;font-weight:800;color:#1a1400;">Libraria</div>
        <div style="font-size:12px;color:#3a2e00;margin-top:2px;letter-spacing:0.1em;text-transform:uppercase;">Library Management System</div>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#f0ede8;font-size:18px;margin:0 0 8px;">Verify your email address</h2>
        <p style="color:#9a96a0;font-size:14px;margin:0 0 24px;line-height:1.6;">
          Hi <strong style="color:#f0ede8;">${name}</strong>, welcome to Libraria!<br>
          Use the OTP below to verify your email and complete registration.
        </p>
        <div style="background:#1e2028;border:2px dashed #e8c878;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <div style="font-size:11px;color:#9a96a0;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;">Your verification code</div>
          <div style="font-size:42px;font-weight:800;letter-spacing:10px;color:#e8c878;font-family:'Courier New',monospace;">${otp}</div>
          <div style="font-size:12px;color:#6b6878;margin-top:10px;">Expires in <strong style="color:#e8935a;">10 minutes</strong></div>
        </div>
        <div style="background:rgba(232,147,90,0.1);border:1px solid rgba(232,147,90,0.25);border-radius:8px;padding:12px 16px;">
          <p style="color:#e8935a;font-size:12px;margin:0;">⚠️ Never share this OTP. Libraria staff will never ask for it.</p>
        </div>
      </div>
      <div style="border-top:1px solid #2e3040;padding:16px 32px;text-align:center;">
        <p style="color:#6b6878;font-size:11px;margin:0;">© Libraria LMS · Automated message</p>
      </div>
    </div>
  </div></body></html>`;
}

function loginOTPTemplate(name, otp) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0e0f13;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
    <div style="background:#161820;border:1px solid #2e3040;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#6ea3e8,#4a7bc8);padding:28px 32px;text-align:center;">
        <div style="font-size:28px;margin-bottom:6px;">🔐</div>
        <div style="font-size:22px;font-weight:800;color:#fff;">Sign-in Code</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:2px;letter-spacing:0.1em;text-transform:uppercase;">Libraria LMS</div>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#f0ede8;font-size:18px;margin:0 0 8px;">Your login OTP</h2>
        <p style="color:#9a96a0;font-size:14px;margin:0 0 24px;line-height:1.6;">
          Hi <strong style="color:#f0ede8;">${name}</strong>,<br>
          Use this code to sign in to Libraria.
        </p>
        <div style="background:#1e2028;border:2px dashed #6ea3e8;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <div style="font-size:11px;color:#9a96a0;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;">One-time login code</div>
          <div style="font-size:42px;font-weight:800;letter-spacing:10px;color:#6ea3e8;font-family:'Courier New',monospace;">${otp}</div>
          <div style="font-size:12px;color:#6b6878;margin-top:10px;">Expires in <strong style="color:#e8935a;">10 minutes</strong></div>
        </div>
        <div style="background:rgba(232,102,90,0.1);border:1px solid rgba(232,102,90,0.25);border-radius:8px;padding:12px 16px;">
          <p style="color:#e8665a;font-size:12px;margin:0;">🚨 If you didn't request this, your password may be compromised.</p>
        </div>
      </div>
      <div style="border-top:1px solid #2e3040;padding:16px 32px;text-align:center;">
        <p style="color:#6b6878;font-size:11px;margin:0;">© Libraria LMS · Automated message</p>
      </div>
    </div>
  </div></body></html>`;
}

function dueReminderTemplate(name, bookTitle, author, isbn, dueDate) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0e0f13;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
    <div style="background:#161820;border:1px solid #2e3040;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#5ecc8b,#3a9e6a);padding:24px 32px;text-align:center;">
        <div style="font-size:24px;">⏰</div>
        <div style="font-size:18px;font-weight:800;color:#fff;">Return Reminder</div>
      </div>
      <div style="padding:28px;">
        <p style="color:#9a96a0;font-size:14px;">Hi <strong style="color:#f0ede8;">${name}</strong>,</p>
        <p style="color:#9a96a0;font-size:14px;margin-bottom:20px;">Your book is due <strong style="color:#e8c878;">tomorrow</strong>:</p>
        <div style="background:#1e2028;border-left:4px solid #e8c878;padding:16px;border-radius:0 8px 8px 0;margin-bottom:20px;">
          <div style="font-size:17px;font-weight:700;color:#f0ede8;">${bookTitle}</div>
          <div style="font-size:13px;color:#9a96a0;margin-top:4px;">by ${author}</div>
          ${isbn ? `<div style="font-size:11px;color:#6b6878;margin-top:4px;">ISBN: ${isbn}</div>` : ""}
        </div>
        <div style="background:#252730;border-radius:8px;padding:12px 16px;">
          <span style="color:#9a96a0;font-size:13px;">Due Date: </span>
          <strong style="color:#e8c878;">${dueDate}</strong>
        </div>
        <p style="color:#e8935a;font-size:12px;margin-top:16px;">⚠️ Late returns incur ₹${process.env.FINE_PER_DAY || 5}/day fine.</p>
      </div>
    </div>
  </div></body></html>`;
}

function fineNoticeTemplate(name, bookTitle, overdueDays, fineAmount) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0e0f13;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
    <div style="background:#161820;border:1px solid rgba(232,102,90,0.3);border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#e8665a,#b84a3e);padding:24px 32px;text-align:center;">
        <div style="font-size:24px;">⚠️</div>
        <div style="font-size:18px;font-weight:800;color:#fff;">Overdue Fine Notice</div>
      </div>
      <div style="padding:28px;">
        <p style="color:#9a96a0;">Hi <strong style="color:#f0ede8;">${name}</strong>,</p>
        <p style="color:#9a96a0;font-size:14px;margin-bottom:16px;">
          Book <strong style="color:#f0ede8;">"${bookTitle}"</strong> is 
          <strong style="color:#e8665a;">${overdueDays} day(s) overdue</strong>.
        </p>
        <div style="background:rgba(232,102,90,0.1);border-radius:8px;padding:16px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#9a96a0;font-size:13px;">Days overdue</span>
            <strong style="color:#e8665a;">${overdueDays} days</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#9a96a0;font-size:13px;">Rate</span>
            <span style="color:#f0ede8;">₹${process.env.FINE_PER_DAY || 5}/day</span>
          </div>
          <div style="border-top:1px solid rgba(232,102,90,0.3);padding-top:10px;display:flex;justify-content:space-between;">
            <strong style="color:#f0ede8;">Total fine</strong>
            <span style="color:#e8665a;font-size:22px;font-weight:800;">₹${fineAmount}</span>
          </div>
        </div>
        <p style="color:#9a96a0;font-size:12px;">Return the book and pay the fine at the library counter. Fine increases daily.</p>
      </div>
    </div>
  </div></body></html>`;
}

module.exports = { sendMail, registrationOTPTemplate, loginOTPTemplate, dueReminderTemplate, fineNoticeTemplate };
