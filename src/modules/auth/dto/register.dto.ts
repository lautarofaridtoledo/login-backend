import { IsEmail, IsString, MinLength, IsDateString, IsBoolean } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsDateString()
  birthDate!: string;

  @IsBoolean()
  termsAccepted!: boolean;
}
