import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaystackService } from './paystack.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { SubscriptionPlansService } from '../subscriptions/subscription-plans.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

// Simple in-memory cache for verification results
const verificationCache = new Map<string, { success: boolean; data: any; timestamp: number }>();

// Cleanup cache every 10 minutes
setInterval(() => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  for (const [key, value] of verificationCache.entries()) {
    if (now - value.timestamp > fiveMinutes) {
      verificationCache.delete(key);
    }
  }
}, 10 * 60 * 1000); // Run every 10 minutes

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paystackService: PaystackService,
    private readonly usersService: UsersService,
    private readonly subscriptionPlansService: SubscriptionPlansService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize Paystack payment' })
  @ApiResponse({ status: 201, description: 'Payment initialized successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or Paystack not configured' })
  async initializePayment(@Body() initializePaymentDto: InitializePaymentDto) {
    try {
      // Validate that the plan exists
      const plan = await this.subscriptionPlansService.findOne(initializePaymentDto.planId);
      if (!plan) {
        throw new BadRequestException('Invalid plan ID');
      }

      // Set default callback URL if not provided
      const callbackUrl = initializePaymentDto.callbackUrl || 
        `${process.env.FRONTEND_URL || 'http://localhost:8080'}/subscription-success`;

      const result = await this.paystackService.initializeTransaction({
        planId: initializePaymentDto.planId,
        planName: initializePaymentDto.planName,
        email: initializePaymentDto.email,
        amount: initializePaymentDto.amount,
        currency: initializePaymentDto.currency,
        callbackUrl,
      });

      return {
        success: true,
        data: result,
        message: 'Payment initialized successfully',
      };
    } catch (error) {
      console.error('Payment initialization error:', error);
      throw error;
    }
  }

  @Get('verify/:reference')
  @ApiOperation({ summary: 'Verify Paystack payment' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid reference or verification failed' })
  async verifyPayment(@Param('reference') reference: string) {
    try {
      // Check cache first (cache for 5 minutes)
      const cached = verificationCache.get(reference);
      const now = Date.now();
      if (cached && (now - cached.timestamp) < 5 * 60 * 1000) {
        console.log(`Returning cached verification result for ${reference}`);
        return {
          success: cached.success,
          data: cached.data,
          message: cached.success ? 'Payment verified and subscription updated successfully' : 'Payment verification failed',
        };
      }

      const verification = await this.paystackService.verifyTransaction(reference);
      
      if (verification.status && verification.data.status === 'success') {
        // Update user's subscription plan
        const { planId, planName, email } = verification.data.metadata;
        
        // Find user by email
        const user = await this.usersService.findByEmail(email);
        if (user) {
          // Validate plan name before updating
          const validPlanNames = ['Free', 'Premium', 'Premium Annual', 'Professional', 'Professional Annual'];
          const isValidPlan = validPlanNames.includes(planName);
          
          if (isValidPlan) {
            // Update user's subscription plan
            await this.usersService.update(user._id.toString(), {
              subscriptionPlan: planName as 'Free' | 'Premium' | 'Premium Annual' | 'Professional' | 'Professional Annual',
            });

            // Create subscription record
            const plan = await this.subscriptionPlansService.findOne(planId);
            if (plan) {
              const billingCycle = planName.includes('Annual') ? 'annual' : 'monthly';
              
              await this.subscriptionsService.createSubscription({
                userId: user._id.toString(),
                planId: planId,
                planName: planName,
                billingCycle: billingCycle as 'monthly' | 'annual',
                amount: verification.data.amount / 100, // Convert from kobo to naira
                currency: verification.data.currency,
                paymentReference: reference,
                paymentDate: new Date(verification.data.paid_at),
              });
            }
          } else {
            console.warn(`Invalid plan name: ${planName}`);
          }
        }

        // Cache the successful result
        verificationCache.set(reference, {
          success: true,
          data: verification.data,
          timestamp: now,
        });

        return {
          success: true,
          data: verification.data,
          message: 'Payment verified and subscription updated successfully',
        };
      } else {
        // Cache the failed result
        verificationCache.set(reference, {
          success: false,
          data: verification.data,
          timestamp: now,
        });

        return {
          success: false,
          data: verification.data,
          message: 'Payment verification failed',
        };
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  @Get('status/:reference')
  @ApiOperation({ summary: 'Get payment status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  async getPaymentStatus(@Param('reference') reference: string) {
    try {
      const status = await this.paystackService.getTransactionStatus(reference);
      return {
        success: true,
        status,
        reference,
      };
    } catch (error) {
      console.error('Get payment status error:', error);
      throw error;
    }
  }

  @Get('config')
  @ApiOperation({ summary: 'Get Paystack configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved' })
  getConfig() {
    return {
      isConfigured: this.paystackService.isConfigured(),
      publicKey: this.paystackService.getPublicKey(),
    };
  }
} 