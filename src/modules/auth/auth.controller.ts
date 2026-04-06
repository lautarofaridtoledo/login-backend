import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { CookieHelper } from '../../common/security';
import { JwtAuthGuard } from '../../common/guards';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser, ApiSuccessResponse } from '../../types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieHelper: CookieHelper,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiSuccessResponse<{ user: AuthUser; accessToken: string; accessTokenExpiresAt: string }>> {
    const { user, accessToken, accessTokenExpiresAt, refreshToken } =
      await this.authService.register(dto);

    this.cookieHelper.setRefreshToken(res, refreshToken);

    return {
      success: true,
      data: { user, accessToken, accessTokenExpiresAt },
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiSuccessResponse<{ user: AuthUser; accessToken: string; accessTokenExpiresAt: string }>> {
    const { user, accessToken, accessTokenExpiresAt, refreshToken } =
      await this.authService.login(dto.email, dto.password);

    this.cookieHelper.setRefreshToken(res, refreshToken);

    return {
      success: true,
      data: { user, accessToken, accessTokenExpiresAt },
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiSuccessResponse<{ accessToken: string; accessTokenExpiresAt: string }>> {
    const oldToken = this.cookieHelper.extractRefreshToken(req);
    if (!oldToken) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' },
      });
      return undefined as never;
    }

    const { accessToken, accessTokenExpiresAt, refreshToken } =
      await this.authService.refresh(oldToken);

    this.cookieHelper.setRefreshToken(res, refreshToken);

    return {
      success: true,
      data: { accessToken, accessTokenExpiresAt },
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiSuccessResponse<{ loggedOut: true }>> {
    const token = this.cookieHelper.extractRefreshToken(req);
    if (token) {
      await this.authService.logout(token);
    }
    this.cookieHelper.clearRefreshToken(res);

    return { success: true, data: { loggedOut: true } };
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verify(
    @CurrentUser() user: AuthUser,
  ): Promise<ApiSuccessResponse<{ valid: true; user: AuthUser }>> {
    return { success: true, data: { valid: true, user } };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(
    @CurrentUser() user: AuthUser,
  ): Promise<ApiSuccessResponse<{ user: AuthUser }>> {
    return { success: true, data: { user } };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<ApiSuccessResponse<{ submitted: true }>> {
    await this.authService.forgotPassword(dto.email);
    return { success: true, data: { submitted: true } };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<ApiSuccessResponse<{ passwordUpdated: true }>> {
    await this.authService.resetPassword(dto.token, dto.password);
    return { success: true, data: { passwordUpdated: true } };
  }
}
