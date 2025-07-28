import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface PaystackInitializeRequest {
  planId: string;
  planName: string;
  email: string;
  amount: number;
  currency: string;
  callbackUrl: string;
}

export interface PaystackInitializeResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyResponse {
  status: boolean;
  data: {
    id: number;
    domain: string;
    amount: number;
    currency: string;
    channel: string;
    gateway: string;
    reference: string;
    source: string;
    reason: string;
    status: string;
    paid_at: string;
    created_at: string;
    updated_at: string;
    metadata: {
      planId: string;
      planName: string;
      email: string;
    };
  };
}

@Injectable()
export class PaystackService {
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    this.publicKey = this.configService.get<string>('PAYSTACK_PUBLIC_KEY') || '';
    
    if (!this.secretKey || !this.publicKey) {
      console.warn('⚠️ Paystack keys not configured');
    }
  }

  async initializeTransaction(request: PaystackInitializeRequest): Promise<PaystackInitializeResponse> {
    if (!this.secretKey) {
      throw new BadRequestException('Paystack not configured');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email: request.email,
          amount: request.amount * 100, // Convert to kobo (smallest currency unit)
          currency: request.currency,
          callback_url: request.callbackUrl,
          metadata: {
            planId: request.planId,
            planName: request.planName,
            email: request.email,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      const { data } = response.data;
      return {
        authorization_url: data.authorization_url,
        access_code: data.access_code,
        reference: data.reference,
      };
    } catch (error: any) {
      console.error('Paystack initialization error:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to initialize payment'
      );
    }
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    if (!this.secretKey) {
      throw new BadRequestException('Paystack not configured');
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Paystack verification error:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to verify payment'
      );
    }
  }

  async getTransactionStatus(reference: string): Promise<string> {
    try {
      const verification = await this.verifyTransaction(reference);
      return verification.data.status;
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return 'unknown';
    }
  }

  isConfigured(): boolean {
    return !!(this.secretKey && this.publicKey);
  }

  getPublicKey(): string {
    return this.publicKey;
  }
} 