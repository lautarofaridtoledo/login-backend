import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigType } from '@nestjs/config';
import authConfig from '../../../common/config/auth.config';
import { JwtPayload, AuthUser } from '../../../types';
import { TokensService } from '../../tokens';
import { UsersService } from '../../users';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(authConfig.KEY)
    config: ConfigType<typeof authConfig>,
    private readonly tokensService: TokensService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.accessSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (!payload.jti) {
      throw new UnauthorizedException('Access token is missing revocation metadata');
    }

    const isBlacklisted = await this.tokensService.isAccessTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      throw new UnauthorizedException('Access token has been revoked');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      return null as unknown as AuthUser;
    }
    return this.usersService.toAuthUser(user);
  }
}
