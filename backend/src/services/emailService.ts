import nodemailer from 'nodemailer';
import { config } from '../config/config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.password,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `${config.email.fromName} <${config.email.from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        replyTo: config.email.replyTo,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to Task Manager!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining Task Manager. We're excited to help you organize your tasks and boost your productivity!</p>
        <p>Get started by creating your first board and organizing your tasks.</p>
        <p>Happy task managing!</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to Task Manager',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Password Reset Request</h1>
        <p>You requested to reset your password.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html,
    });
  }
}

export default new EmailService();

