import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IAuthProvider } from '../contracts';
import { UsersService } from '../../users';
import { PasswordService } from '../../../common/security';
import { AuthUser } from '../../../types';

@Injectable()
export class LocalAuthProvider implements IAuthProvider {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
  ) {}

  async authenticate(email: string, password: string): Promise<AuthUser> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwordService.verify(user.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.usersService.toAuthUser(user);
  }
}
