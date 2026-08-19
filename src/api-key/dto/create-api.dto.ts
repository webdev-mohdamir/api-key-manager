import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateApiKeyDto {
    @IsNotEmpty({ message: 'Label is required' })
    @IsString({ message: 'Label must be a string' })
    @MinLength(3, { message: 'Label must be at least 3 characters long' })
    @MaxLength(50, { message: 'Label must be at most 50 characters long' })
    label!: string;
}