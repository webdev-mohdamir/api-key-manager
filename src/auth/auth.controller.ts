import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ) {}

    @Post("/register")
    async register(@Body() registerDto: RegisterDto) {
        const user = await this.authService.register(registerDto);
        
        return {
            message: 'User created successfully',
            user
        }
    }

    @Post('/login')
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

}
