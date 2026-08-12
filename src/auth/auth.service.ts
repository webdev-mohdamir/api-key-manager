import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RefreshToken, User } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    private async generateTokens(userId: string): Promise<{access_token: string, refresh_token: string}> {
        const access_token = await this.jwtService.signAsync(
            {sub: userId}, 
            {
                secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.getOrThrow<number>('JWT_ACCESS_EXPIRY'),
            }
        );

        const refresh_token = await this.jwtService.signAsync(
            {sub: userId}, 
            {
                secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.getOrThrow<number>('JWT_REFRESH_EXPIRY'),
            }
        );

        return {access_token, refresh_token};
    }

    private async hashString(inputString: string): Promise<string> {
        const salt = 10;
        const hash = await bcrypt.hash(inputString, salt);
        return hash;
    }

    private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
        const hashedRefreshToken = await this.hashString(refreshToken);

        const refreshExpirySeconds = this.configService.getOrThrow<number>('JWT_REFRESH_EXPIRY');
        const expiresAt = new Date(Date.now() + refreshExpirySeconds * 1000);

        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: hashedRefreshToken,
                expiresAt
            }
        });
    }

    public async isUserExistsWithEmail(email: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: {
                email: email
            }
        });

        return user;
    }

    public async comparePassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }

    private async findMatchingRefreshToken(refreshToken: string, userId: string): Promise<RefreshToken> {
        const candidates = await this.prisma.refreshToken.findMany({
            where: { userId, isActive: true, expiresAt: { gt: new Date() } },
        });

        for (const candidate of candidates) {
            if (await this.comparePassword(refreshToken, candidate.tokenHash)) {
                return candidate;
            }
        }

        throw new UnauthorizedException('Invalid refresh token');
    }

    public async register({name, email, password}: RegisterDto): Promise<Omit<User, 'passwordHash' | 'updatedAt' | 'createdAt'>> {
        const user = await this.isUserExistsWithEmail(email);
        if (user) {
            throw new ConflictException('User already exists');
        }

        const passwordHash = await this.hashString(password);

        const newUser = await this.prisma.user.create({
            data: {
                name,
                email,
                passwordHash
            },
            select: {
                id: true,
                name: true,
                email: true,
            }
        });

        return newUser;
    }

    public async login({email, password}: LoginDto): Promise<{
        user: Omit<User, 'passwordHash' | 'updatedAt' | 'createdAt'>,
        access_token: string,
        refresh_token: string
    }> {
        const user = await this.isUserExistsWithEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordMatch = await this.comparePassword(password, user.passwordHash);

        if (!isPasswordMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const {access_token, refresh_token} = await this.generateTokens(user.id);
        await this.saveRefreshToken(user.id, refresh_token);

        const response = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            access_token: access_token,
            refresh_token: refresh_token
        };

        return response;
    }

    public async refresh(refreshToken:string) {
        const payload = await this.jwtService.verifyAsync(refreshToken, {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        });

        const activeCandidate = await this.findMatchingRefreshToken(refreshToken, payload.sub);

        await this.prisma.refreshToken.delete({ where: { id: activeCandidate.id } });

        const {access_token, refresh_token} = await this.generateTokens(activeCandidate.userId);
        await this.saveRefreshToken(activeCandidate.userId, refresh_token);

        return {access_token, refresh_token};
    }

    public async logout(refreshToken: string) {
        const payload = await this.jwtService.verifyAsync(refreshToken, {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        });

        const activeCandidate = await this.findMatchingRefreshToken(refreshToken, payload.sub);

        await this.prisma.refreshToken.delete({ where: { id: activeCandidate.id } });

        return { message: 'Logged out successfully' };
    }
}
