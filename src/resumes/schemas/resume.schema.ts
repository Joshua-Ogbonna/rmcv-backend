import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResumeDocument = Resume & Document;

@Schema({ timestamps: true })
export class Resume {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ type: Object, required: true })
  content: any;

  @Prop()
  templateId?: string;

  @Prop({ type: Number, min: 0, max: 100 })
  atsScore?: number;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ResumeSchema = SchemaFactory.createForClass(Resume);

// Indexes for better performance
ResumeSchema.index({ userId: 1 });
ResumeSchema.index({ userId: 1, isDefault: 1 });
ResumeSchema.index({ userId: 1, createdAt: -1 }); 