import { Injectable } from '@nestjs/common';

@Injectable()
export class DataService {
    public ping(): string {
        return 'pong';
    }
}
