import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /**
   * Stub: logs the reset link instead of sending a real email.
   * Replace with a real SMTP/transactional provider when ready.
   */
  async sendPasswordReset(to: string, token: string): Promise<void> {
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    this.logger.log(`[STUB] Password reset email to ${to}: ${resetUrl}`);
  }
}
