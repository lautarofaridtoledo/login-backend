import { Module } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetTokensRepository } from './repositories/password-reset-tokens.repository';
import { UsersModule } from '../users';
import { EmailModule } from '../email';

@Module({
  imports: [UsersModule, EmailModule],
  providers: [PasswordResetService, PasswordResetTokensRepository],
  exports: [PasswordResetService],
})
export class PasswordResetModule {}
