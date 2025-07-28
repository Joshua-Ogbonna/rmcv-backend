import { IsString, IsNumber, IsEmail, IsOptional } from 'class-validator';

export class InitializePaymentDto {
  @IsString()
  planId: string;

  @IsString()
  planName: string;

  @IsEmail()
  email: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  callbackUrl?: string;
} 