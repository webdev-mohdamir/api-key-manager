import { ConflictException, Injectable } from '@nestjs/common';
import { User } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    private async hashPassword(password: string): Promise<string> {
        const salt = 10;
        const hash = await bcrypt.hash(password, salt);
        return hash;
    }

    public async isUserExistsWithEmail(email: string): Promise<string | null> {
        const user = await this.prisma.user.findUnique({
            where: {
                email: email
            }
        });

        return user?.id ? user.id : null;
    }

    public async register({name, email, password}: RegisterDto): Promise<Omit<User, 'passwordHash' | 'updatedAt' | 'createdAt'>> {
        const user = await this.isUserExistsWithEmail(email);
        if (user) {
            throw new ConflictException('User already exists');
        }

        const passwordHash = await this.hashPassword(password);

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
}
