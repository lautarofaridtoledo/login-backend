import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetTokensRepository } from './repositories/password-reset-tokens.repository';
import { UsersModule } from '../users';
import { EmailModule, EmailService } from '../email';
import authConfig from '../../common/config/auth.config';
import { PasswordResetTokenPolicy } from './domain';
import {
  PASSWORD_RESET_NOTIFIER,
  PASSWORD_RESET_TOKENS_REPOSITORY,
} from './ports';

@Module({
  imports: [UsersModule, EmailModule],
  providers: [
    PasswordResetService,
    PasswordResetTokensRepository,
    {
      provide: PASSWORD_RESET_TOKENS_REPOSITORY,
      useExisting: PasswordResetTokensRepository,
    },
    {
      provide: PASSWORD_RESET_NOTIFIER,
      useExisting: EmailService,
    },
    {
      provide: PasswordResetTokenPolicy,
      inject: [authConfig.KEY],
      useFactory: (config: ConfigType<typeof authConfig>) => {
        return new PasswordResetTokenPolicy(config.passwordReset.expiresIn);
      },
    },
  ],
  exports: [PasswordResetService],
})
export class PasswordResetModule {}
