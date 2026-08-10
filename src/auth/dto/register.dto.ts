import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {

    @IsNotEmpty({ message: 'Name is required' })
    @IsString({ message: 'Name must be a string' })
    @MinLength(3, { message: 'Name must be at least 3 characters long' })
    @MaxLength(50, { message: 'Name must be at most 50 characters long' })
    name!: string;

    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail()
    @MaxLength(50, { message: 'Email must be at most 50 characters long' })
    email!: string;

    @IsNotEmpty({ message: 'Password is required' })
    @IsString({ message: 'Password must be a string' })
    @MinLength(8, { message: 'Password must be at least 6 characters long' })
    @MaxLength(100, { message: 'Password must be at most 100 characters long' })
    password!: string;

}