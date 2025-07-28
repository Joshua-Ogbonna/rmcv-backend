import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';
import { SubscriptionPlan } from './schemas/subscription-plan.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(SubscriptionPlan.name) private subscriptionPlanModel: Model<SubscriptionPlan>,
  ) {}

  async createSubscription(subscriptionData: {
    userId: string;
    planId: string;
    planName: string;
    billingCycle: 'monthly' | 'annual';
    amount: number;
    currency: string;
    paymentReference: string;
    paymentDate: Date;
  }): Promise<Subscription> {
    const plan = await this.subscriptionPlanModel.findById(subscriptionData.planId);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // Calculate billing periods
    const paymentDate = new Date(subscriptionData.paymentDate);
    const currentPeriodStart = new Date(paymentDate);
    const currentPeriodEnd = new Date(paymentDate);
    
    if (subscriptionData.billingCycle === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    const nextBillingDate = new Date(currentPeriodEnd);

    const subscription = new this.subscriptionModel({
      userId: subscriptionData.userId,
      planId: subscriptionData.planId,
      planName: subscriptionData.planName,
      status: 'active',
      billingCycle: subscriptionData.billingCycle,
      amount: subscriptionData.amount,
      currency: subscriptionData.currency,
      paymentReference: subscriptionData.paymentReference,
      paymentDate: paymentDate,
      currentPeriodStart,
      currentPeriodEnd,
      nextBillingDate,
      autoRenew: true,
      lastPaymentDate: paymentDate,
      nextPaymentDate: nextBillingDate,
      paymentHistory: [subscriptionData.paymentReference],
    });

    return subscription.save();
  }

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionModel
      .findOne({ userId, status: 'active' })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: 'active' | 'cancelled' | 'expired' | 'pending',
    reason?: string
  ): Promise<Subscription> {
    const subscription = await this.subscriptionModel.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.status = status;
    if (status === 'cancelled') {
      subscription.cancelledAt = new Date();
      subscription.cancellationReason = reason;
    }

    return subscription.save();
  }

  async addPaymentToHistory(
    subscriptionId: string,
    paymentReference: string,
    paymentDate: Date
  ): Promise<Subscription> {
    const subscription = await this.subscriptionModel.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Update payment history
    subscription.paymentHistory.push(paymentReference);
    subscription.lastPaymentDate = paymentDate;

    // Calculate next billing period
    const nextBillingDate = new Date(subscription.currentPeriodEnd);
    if (subscription.billingCycle === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    subscription.nextPaymentDate = nextBillingDate;
    subscription.currentPeriodStart = new Date(subscription.currentPeriodEnd);
    subscription.currentPeriodEnd = nextBillingDate;

    return subscription.save();
  }

  async getExpiredSubscriptions(): Promise<Subscription[]> {
    const now = new Date();
    return this.subscriptionModel.find({
      status: 'active',
      currentPeriodEnd: { $lt: now }
    }).exec();
  }

  async getUpcomingRenewals(daysAhead: number = 7): Promise<Subscription[]> {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.subscriptionModel.find({
      status: 'active',
      nextPaymentDate: { $gte: now, $lte: futureDate }
    }).exec();
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription> {
    return this.updateSubscriptionStatus(subscriptionId, 'cancelled', reason);
  }

  async reactivateSubscription(subscriptionId: string): Promise<Subscription> {
    return this.updateSubscriptionStatus(subscriptionId, 'active');
  }

  async getSubscriptionStats(): Promise<{
    totalActive: number;
    totalRevenue: number;
    monthlyRevenue: number;
    annualRevenue: number;
  }> {
    const activeSubscriptions = await this.subscriptionModel.find({ status: 'active' });
    
    const totalActive = activeSubscriptions.length;
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
    
    const monthlySubs = activeSubscriptions.filter(sub => sub.billingCycle === 'monthly');
    const annualSubs = activeSubscriptions.filter(sub => sub.billingCycle === 'annual');
    
    const monthlyRevenue = monthlySubs.reduce((sum, sub) => sum + sub.amount, 0);
    const annualRevenue = annualSubs.reduce((sum, sub) => sum + sub.amount, 0);

    return {
      totalActive,
      totalRevenue,
      monthlyRevenue,
      annualRevenue,
    };
  }
} 