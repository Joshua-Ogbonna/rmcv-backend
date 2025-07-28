import { IsEmail, IsString, IsOptional, MinLength, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsEnum(['Free', 'Premium', 'Premium Annual', 'Professional', 'Professional Annual'])
  subscriptionPlan?: 'Free' | 'Premium' | 'Premium Annual' | 'Professional' | 'Professional Annual';

  @IsOptional()
  isActive?: boolean;
} 