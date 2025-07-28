import { IsString, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price_usd: number;

  @IsNumber()
  price_ngn: number;

  @IsOptional()
  @IsString()
  billing_cycle?: string;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  stripe_price_id?: string;

  @IsOptional()
  @IsString()
  paystack_plan_code?: string;
} 