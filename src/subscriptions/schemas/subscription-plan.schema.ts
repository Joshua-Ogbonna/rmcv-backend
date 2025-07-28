import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionPlanDocument = SubscriptionPlan & Document;

@Schema({ timestamps: true })
export class SubscriptionPlan {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price_usd: number;

  @Prop({ required: true })
  price_ngn: number;

  @Prop({ required: true, default: 'monthly' })
  billing_cycle: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ default: true })
  is_active: boolean;

  @Prop()
  stripe_price_id?: string;

  @Prop()
  paystack_plan_code?: string;
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan); 