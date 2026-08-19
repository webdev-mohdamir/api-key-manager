import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    public parseKey(rawKey: string): {keyId: string, keySecret: string} {
        const parts = rawKey.split('_');
        
        if (parts.length !== 3 || parts[0] !== 'ak') {
            throw new UnauthorizedException('Invalid API key format');
        }
        
        const [, keyId, keySecret] = parts;
        return { keyId, keySecret };
    }

    async create({userId, label}: {userId: string, label: string}): Promise<{
        id: string,
        label: string,
        key: string
    }> {

        
        const keyId = crypto.randomBytes(12).toString('hex');
        const keySecret = crypto.randomBytes(32).toString('hex');

        const fullKey = `ak_${keyId}_${keySecret}`;
        const keyPreview = `ak_...${fullKey.slice(-4)}`;

        const keyHash = await bcrypt.hash(keySecret, 10);

        const apiKey = await this.prisma.apiKey.create({
            data: {
                label,
                keyId,
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
