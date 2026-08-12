import { Body, Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ) {}

    @Post("/register")
    @Public()
    async register(@Body() registerDto: RegisterDto) {
        const user = await this.authService.register(registerDto);
        
        return {
            message: 'User created successfully',
            user
        }
    }

    @Post('/login')
    @Public()
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.login(loginDto);

        res.cookie('refresh_token', result.refresh_token, {
            httpOnly: true,
            secure: this.configService.getOrThrow<string>('NODE_ENV') === 'production' ? true : false,
            sameSite: 'strict',
            maxAge: this.configService.getOrThrow<number>('JWT_REFRESH_EXPIRY') * 1000,
        });

        return {
            message: 'User logged in successfully',
            user: result.user,
            access_token: result.access_token,
        };
    }

    @Post('/refresh')
    @Public()
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refresh_token = req.cookies.refresh_token as string;

        if (!refresh_token) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const result = await this.authService.refresh(refresh_token);

        res.cookie('refresh_token', result.refresh_token, {
            httpOnly: true,
            secure: this.configService.getOrThrow<string>('NODE_ENV') === 'production' ? true : false,
            sameSite: 'strict',
            maxAge: this.configService.getOrThrow<number>('JWT_REFRESH_EXPIRY') * 1000,
        });

        return {
            message: 'Token refreshed successfully',
            access_token: result.access_token,
        };

    }

    @Post('/logout')
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refresh_token = req.cookies.refresh_token as string;

        if (!refresh_token) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        await this.authService.logout(refresh_token);

        res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'strict' });
        return { message: 'Logged out successfully' };
    }

}
