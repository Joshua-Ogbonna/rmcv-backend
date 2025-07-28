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

// Optimized in-memory cache for verification results with size limit
const verificationCache = new Map<string, { success: boolean; data: any; timestamp: number }>();
const MAX_CACHE_SIZE = 1000; // Limit cache size to prevent memory leaks

// Cleanup cache every 5 minutes and when size exceeds limit
setInterval(() => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  // Remove expired entries
  for (const [key, value] of verificationCache.entries()) {
    if (now - value.timestamp > fiveMinutes) {
      verificationCache.delete(key);
    }
  }
  
  // If cache is still too large, remove oldest entries
  if (verificationCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(verificationCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2)); // Remove 20% of oldest entries
    toRemove.forEach(([key]) => verificationCache.delete(key));
  }
}, 5 * 60 * 1000);

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
  @ApiOperation({ summary: 'Initialize a payment transaction' })
  @ApiResponse({ status: 201, description: 'Payment initialized successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async initializePayment(@Body() initializePaymentDto: InitializePaymentDto) {
    // Set default callback URL if not provided
    const callbackUrl = initializePaymentDto.callbackUrl || 
      `${process.env.FRONTEND_URL || 'http://localhost:8080'}/subscription-success`;

    return this.paystackService.initializeTransaction({
      ...initializePaymentDto,
      callbackUrl,
    });
  }

  @Get('verify/:reference')
  @ApiOperation({ summary: 'Verify a payment transaction' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async verifyPayment(@Param('reference') reference: string) {
    const now = Date.now();
    
    // Check cache first
    const cachedResult = verificationCache.get(reference);
    if (cachedResult && (now - cachedResult.timestamp) < 5 * 60 * 1000) {
      return {
        success: cachedResult.success,
        data: cachedResult.data,
        cached: true,
      };
    }

    try {
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
        };
      } else {
        // Cache failed results too (for shorter time)
        verificationCache.set(reference, {
          success: false,
          data: verification.data,
          timestamp: now,
        });

        return {
          success: false,
          data: verification.data,
        };
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new BadRequestException('Failed to verify payment');
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