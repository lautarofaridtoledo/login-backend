import { Module } from '@nestjs/common';
import { PasswordService } from './password.service';
import { CookieHelper } from './cookie.helper';

@Module({
  providers: [PasswordService, CookieHelper],
  exports: [PasswordService, CookieHelper],
})
export class SecurityModule {}
