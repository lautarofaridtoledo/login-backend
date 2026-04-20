import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { AUTH_PROVIDER, IAuthProvider } from '../providers';
import { UsersService, CreateUserInput } from '../users';
import { TokensService } from '../tokens';
import { PasswordResetService } from '../password-reset';
import { AuthUser, AuthTokens } from '../../types';
import { RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_PROVIDER)
    private readonly authProvider: IAuthProvider,
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: AuthUser } & AuthTokens & { refreshToken: string }> {
    if (!dto.termsAccepted) {
      throw new BadRequestException('Terms and conditions must be accepted');
    }

    const input: CreateUserInput = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: dto.password,
      birthDate: new Date(dto.birthDate),
      termsAccepted: dto.termsAccepted,
    };

    const user = await this.usersService.create(input);
    const tokens = await this.tokensService.generateTokens(user.id, user.email);

    return { user, ...tokens };
  }

  async login(email: string, password: string): Promise<{ user: AuthUser } & AuthTokens & { refreshToken: string }> {
    const user = await this.authProvider.authenticate(email, password);
    const tokens = await this.tokensService.generateTokens(user.id, user.email);
    return { user, ...tokens };
  }

  async refresh(oldRefreshToken: string): Promise<AuthTokens & { refreshToken: string }> {
    return this.tokensService.refreshAccessToken(oldRefreshToken);
  }

  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    await this.tokensService.blacklistAccessToken(accessToken);
    if (refreshToken) {
      await this.tokensService.revokeRefreshToken(refreshToken);
    }
  }

  async verify(accessToken: string): Promise<{ valid: true; user: AuthUser }> {
    const payload = this.tokensService.verifyAccessToken(accessToken);
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return { valid: true, user: this.usersService.toAuthUser(user) };
  }

  async forgotPassword(email: string): Promise<void> {
    await this.passwordResetService.requestReset(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.passwordResetService.resetPassword(token, newPassword);
  }
}
