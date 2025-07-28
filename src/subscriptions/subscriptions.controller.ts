import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({ status: 200, description: 'User subscription retrieved' })
  async getMySubscription(@Request() req) {
    const userId = req.user.userId;
    const subscription = await this.subscriptionsService.getUserSubscription(userId);
    
    if (!subscription) {
      return {
        success: false,
        message: 'No active subscription found',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Subscription retrieved successfully',
      data: subscription,
    };
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel user subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancelSubscription(@Request() req, @Body() body: { reason?: string }) {
    const userId = req.user.userId;
    const subscription = await this.subscriptionsService.getUserSubscription(userId);
    
    if (!subscription) {
      return {
        success: false,
        message: 'No active subscription found to cancel',
      };
    }

    const cancelledSubscription = await this.subscriptionsService.cancelSubscription(
      subscription._id.toString(),
      body.reason
    );

    return {
      success: true,
      message: 'Subscription cancelled successfully',
      data: cancelledSubscription,
    };
  }

  @Post('reactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivate user subscription' })
  @ApiResponse({ status: 200, description: 'Subscription reactivated successfully' })
  async reactivateSubscription(@Request() req) {
    const userId = req.user.userId;
    const subscription = await this.subscriptionsService.getUserSubscription(userId);
    
    if (!subscription) {
      return {
        success: false,
        message: 'No subscription found to reactivate',
      };
    }

    const reactivatedSubscription = await this.subscriptionsService.reactivateSubscription(
      subscription._id.toString()
    );

    return {
      success: true,
      message: 'Subscription reactivated successfully',
      data: reactivatedSubscription,
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getSubscriptionStats() {
    const stats = await this.subscriptionsService.getSubscriptionStats();
    
    return {
      success: true,
      message: 'Subscription statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('expired')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get expired subscriptions (admin only)' })
  @ApiResponse({ status: 200, description: 'Expired subscriptions retrieved' })
  async getExpiredSubscriptions() {
    const expiredSubscriptions = await this.subscriptionsService.getExpiredSubscriptions();
    
    return {
      success: true,
      message: 'Expired subscriptions retrieved successfully',
      data: expiredSubscriptions,
    };
  }

  @Get('upcoming-renewals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get upcoming renewals (admin only)' })
  @ApiResponse({ status: 200, description: 'Upcoming renewals retrieved' })
  async getUpcomingRenewals() {
    const upcomingRenewals = await this.subscriptionsService.getUpcomingRenewals();
    
    return {
      success: true,
      message: 'Upcoming renewals retrieved successfully',
      data: upcomingRenewals,
    };
  }
} 