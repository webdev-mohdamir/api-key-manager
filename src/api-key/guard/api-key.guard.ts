import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ApiKeyService } from "../api-key.service";
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeyService: ApiKeyService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const rawKey = request.headers['x-api-key'];

    if (!rawKey) {
      throw new UnauthorizedException('API key required');
    }

    const { keyId, keySecret } = this.apiKeyService.parseKey(rawKey);

    const row = await this.prisma.apiKey.findFirst({
      where: { keyId, isActive: true },
    });

    if (!row) {
      throw new UnauthorizedException('Invalid API key');
    }

    const isMatch = await bcrypt.compare(keySecret, row.keyHash);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.apiKeyId = row.id;
    request.userId = row.userId;

    return true;
  }
}