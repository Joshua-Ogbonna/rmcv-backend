import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  phone?: string;

  @Prop()
  location?: string;

  @Prop()
  linkedin?: string;

  @Prop()
  website?: string;

  @Prop({ default: 'Free' })
  subscriptionPlan: 'Free' | 'Premium' | 'Premium Annual' | 'Professional' | 'Professional Annual';

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: false })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User); 