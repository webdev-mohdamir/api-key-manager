import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Public } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ){}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        
        const isPublic = this.reflector.getAllAndOverride<boolean>(Public, [
            context.getHandler(),
            context.getClass()
        ]);
        
        if (isPublic) {
            return true;
        }
        
        const request = context.switchToHttp().getRequest();
        
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Access token not found or malformed');
        }

        const accessToken = authHeader.split(' ')[1];

        try {
            const payload = await this.jwtService.verifyAsync(accessToken, {
                secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET')
            });

            request.userId = payload.sub; 
            
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired access token');
        }
    }
}
