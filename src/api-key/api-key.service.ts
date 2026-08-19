import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async create({userId, label}: {userId: string, label: string}): Promise<{
        id: string,
        label: string,
        key: string
    }> {

        const rawKey = crypto.randomBytes(32).toString('hex');
        const fullKey = `ak_${rawKey}`;
        const keyPreview = `ak_...${fullKey.slice(-4)}`; // or however you want to format it
        const keyHash = await bcrypt.hash(fullKey, 10);

        const apiKey = await this.prisma.apiKey.create({
            data: {
                label,
                keyHash,
                keyPreview,
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });

        const result = {
            id: apiKey.id,
            label: apiKey.label,
            key: fullKey,
        }

        return result;
    }

    async list(userId: string): Promise<{id: string, label: string, keyPreview: string, createdAt: Date}[]> {
        return this.prisma.apiKey.findMany({
            where: { userId, isActive: true },
            select: {
                id: true,
                label: true,
                keyPreview: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async revoke(userid: string, id: string): Promise<void> {
        const apiKey = await this.prisma.apiKey.findUnique({
            where: { 
                id,
                isActive: true
            },
        });

        if (!apiKey || apiKey.userId !== userid) {
            throw new NotFoundException('API key not found');
        }

        await this.prisma.apiKey.update({
            where: { id },
            data: { isActive: false, revokedAt: new Date() },
        });

    }
}
