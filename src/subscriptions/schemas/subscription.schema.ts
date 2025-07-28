import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'SubscriptionPlan' })
  planId: Types.ObjectId;

  @Prop({ required: true })
  planName: string;

  @Prop({ required: true })
  status: 'active' | 'cancelled' | 'expired' | 'pending';

  @Prop({ required: true })
  billingCycle: 'monthly' | 'annual';

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  paymentReference: string;

  @Prop({ required: true })
  paymentDate: Date;

  @Prop({ required: true })
  currentPeriodStart: Date;

  @Prop({ required: true })
  currentPeriodEnd: Date;

  @Prop()
  nextBillingDate?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  @Prop({ default: false })
  autoRenew: boolean;

  @Prop()
  lastPaymentDate?: Date;

  @Prop()
  nextPaymentDate?: Date;

  @Prop({ type: [String], default: [] })
  paymentHistory: string[]; // Array of payment references

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Store additional payment data
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription); 