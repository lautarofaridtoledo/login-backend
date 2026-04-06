import { Module } from '@nestjs/common';
import { AUTH_PROVIDER } from './contracts';
import { LocalAuthProvider } from './local/local-auth.provider';
import { UsersModule } from '../users';
import { SecurityModule } from '../../common/security';

@Module({
  imports: [UsersModule, SecurityModule],
  providers: [
    LocalAuthProvider,
    {
      provide: AUTH_PROVIDER,
      useClass: LocalAuthProvider,
    },
  ],
  exports: [AUTH_PROVIDER],
})
export class ProvidersModule {}
