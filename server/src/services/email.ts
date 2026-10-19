import nodemailer from 'nodemailer';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

const initializeEmailService = (): nodemailer.Transporter | null => {
  if (transporter) {
    return transporter;
  }

  // Check if email is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.warn('⚠️  Email service not configured. SMTP settings missing.');
    console.warn('   Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in .env');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log('✅ Email service initialized');
    return transporter;
  } catch (error: any) {
    console.error('❌ Email service initialization failed:', error.message);
    return null;
  }
};

// Initialize on module load
transporter = initializeEmailService();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email with fallback handling
 * Returns true if sent successfully, false otherwise
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  if (!transporter) {
    console.warn('⚠️  Email service not available. Email not sent.');
    return false;
  }

  try {
    const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@ecom.local';

    await transporter.sendMail({
      from: smtpFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log(`✅ Email sent to ${options.to}`);
    return true;
  } catch (error: any) {
    console.error('❌ Email send failed:', error.message);
    return false;
  }
};

/**
 * Email templates
 */
export const emailTemplates = {
  orderConfirmation: (orderId: string, customerName: string, total: number) => ({
    subject: `Order Confirmation #${orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4CAF50;">Order Confirmed!</h1>
            <p>Dear ${customerName},</p>
            <p>Thank you for your order. Your order <strong>#${orderId}</strong> has been confirmed.</p>
            <p><strong>Total Amount: $${total.toFixed(2)}</strong></p>
            <p>We'll send you another email when your order ships.</p>
            <p>Best regards,<br>The E-Commerce Team</p>
          </div>
        </body>
      </html>
    `,
  }),

  orderShipped: (orderId: string, customerName: string, trackingNumber?: string) => ({
    subject: `Your Order #${orderId} Has Shipped`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Shipped</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2196F3;">Your Order Has Shipped!</h1>
            <p>Dear ${customerName},</p>
            <p>Great news! Your order <strong>#${orderId}</strong> has been shipped.</p>
            ${trackingNumber ? `<p><strong>Tracking Number: ${trackingNumber}</strong></p>` : ''}
            <p>You can track your order status in your account dashboard.</p>
            <p>Best regards,<br>The E-Commerce Team</p>
          </div>
        </body>
      </html>
    `,
  }),

  lowStockAlert: (productName: string, currentStock: number) => ({
    subject: `Low Stock Alert: ${productName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Low Stock Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #FF9800;">Low Stock Alert</h1>
            <p><strong>Product:</strong> ${productName}</p>
            <p><strong>Current Stock:</strong> ${currentStock} units</p>
            <p>Please consider restocking this product soon.</p>
          </div>
        </body>
      </html>
    `,
  }),

  promotion: (title: string, description: string, discountCode?: string) => ({
    subject: title,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #9C27B0;">${title}</h1>
            <p>${description}</p>
            ${discountCode ? `<p><strong>Use code: ${discountCode}</strong></p>` : ''}
            <p>Shop now and enjoy great savings!</p>
            <p>Best regards,<br>The E-Commerce Team</p>
          </div>
        </body>
      </html>
    `,
  }),
};

export default transporter;

