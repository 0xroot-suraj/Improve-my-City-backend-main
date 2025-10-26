import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send OTP email
 */
export const sendOTPEmail = async (to, name, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Your OTP for Improve My City Mumbai',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #667eea; margin: 20px 0; border-radius: 8px; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏙️ Improve My City</h1>
            <p>Mumbai Municipal Corporation</p>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your One-Time Password (OTP) for authentication is:</p>
            <div class="otp-box">${otp}</div>
            <p><strong>This OTP is valid for 10 minutes.</strong></p>
            <p>If you didn't request this OTP, please ignore this email.</p>
            <p>Thank you for using Improve My City portal!</p>
          </div>
          <div class="footer">
            <p>© 2025 Mumbai Municipal Corporation. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

/**
 * Send complaint received confirmation email
 */
export const sendComplaintReceivedEmail = async (to, name, trackingId, title) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Complaint Received - Improve My City Mumbai',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .tracking-id { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Complaint Registered</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>Your complaint has been successfully registered with the Mumbai Municipal Corporation.</p>
            <div class="tracking-id">
              <strong>Tracking ID:</strong> ${trackingId}<br>
              <strong>Subject:</strong> ${title}
            </p>
            <p>You can track the status of your complaint using the tracking ID provided above.</p>
            <p>We will notify you via email when there are updates to your complaint status.</p>
            <p>Thank you for helping us improve Mumbai!</p>
          </div>
          <div class="footer">
            <p>© 2025 Mumbai Municipal Corporation</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

/**
 * Send complaint status update email
 */
export const sendStatusUpdateEmail = async (to, name, trackingId, title, status, adminName = '') => {
  let statusMessage = '';
  let statusColor = '';

  if (status === 'in-progress') {
    statusMessage = 'Your complaint has been taken up and is now in progress.';
    statusColor = '#ff9800';
  } else if (status === 'resolved') {
    statusMessage = 'Your complaint has been successfully resolved!';
    statusColor = '#4caf50';
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `Complaint Status Updated - ${trackingId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .status-badge { background: ${statusColor}; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 15px 0; font-weight: bold; text-transform: uppercase; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 Status Update</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>${statusMessage}</p>
            <div class="status-badge">${status.toUpperCase()}</div>
            <p><strong>Tracking ID:</strong> ${trackingId}</p>
            <p><strong>Complaint:</strong> ${title}</p>
            ${adminName ? `<p><strong>Handled by:</strong> ${adminName}</p>` : ''}
            <p>You can view more details by logging into your account at the Improve My City portal.</p>
            <p>Thank you for your patience!</p>
          </div>
          <div class="footer">
            <p>© 2025 Mumbai Municipal Corporation</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

/**
 * Send new announcement notification email
 */
export const sendAnnouncementEmail = async (to, name, announcementTitle, announcementBody) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `New Announcement: ${announcementTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📣 New Announcement</h1>
          </div>
          <div class="content">
            <h2>Dear ${name},</h2>
            <h3>${announcementTitle}</h3>
            <p>${announcementBody}</p>
            <p>For more updates, visit the Improve My City portal.</p>
          </div>
          <div class="footer">
            <p>© 2025 Mumbai Municipal Corporation</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

export default transporter;
