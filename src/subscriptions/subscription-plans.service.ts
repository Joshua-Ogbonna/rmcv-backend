import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionPlan, SubscriptionPlanDocument } from './schemas/subscription-plan.schema';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @InjectModel(SubscriptionPlan.name) private subscriptionPlanModel: Model<SubscriptionPlanDocument>,
  ) {}

  async create(createSubscriptionPlanDto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const subscriptionPlan = new this.subscriptionPlanModel(createSubscriptionPlanDto);
    return subscriptionPlan.save();
  }

  async findAll(): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanModel.find({ is_active: true }).exec();
  }

  async findOne(id: string): Promise<SubscriptionPlan> {
    const subscriptionPlan = await this.subscriptionPlanModel.findById(id).exec();
    if (!subscriptionPlan) {
      throw new NotFoundException('Subscription plan not found');
    }
    return subscriptionPlan;
  }

  async findByName(name: string): Promise<SubscriptionPlan> {
    const subscriptionPlan = await this.subscriptionPlanModel.findOne({ 
      name: { $regex: new RegExp(name, 'i') },
      is_active: true 
    }).exec();
    if (!subscriptionPlan) {
      throw new NotFoundException('Subscription plan not found');
    }
    return subscriptionPlan;
  }

  async update(id: string, updateSubscriptionPlanDto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const subscriptionPlan = await this.subscriptionPlanModel
      .findByIdAndUpdate(id, updateSubscriptionPlanDto, { new: true })
      .exec();
    if (!subscriptionPlan) {
      throw new NotFoundException('Subscription plan not found');
    }
    return subscriptionPlan;
  }

  async remove(id: string): Promise<void> {
    const result = await this.subscriptionPlanModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Subscription plan not found');
    }
  }

  async seedDefaultPlans(): Promise<SubscriptionPlan[]> {
    const defaultPlans = [
      {
        name: 'Free',
        description: 'Basic resume creation',
        price_usd: 0,
        price_ngn: 0,
        billing_cycle: 'monthly',
        features: [
          '1 resume template',
          'Basic AI suggestions',
          'Download as PDF',
          'Limited customization'
        ],
        is_active: true
      },
      {
        name: 'Premium Annual',
        description: 'Advanced features for job seekers',
        price_usd: 7.99,
        price_ngn: 13188,
        billing_cycle: 'annual',
        features: [
          'All templates (15+)',
          'Advanced AI suggestions',
          'Unlimited resumes',
          'Cover letter builder',
          'Export as PDF, DOCX, TXT',
          'Full customization',
          'No watermark'
        ],
        is_active: true
      },
      {
        name: 'Premium',
        description: 'Advanced features for job seekers',
        price_usd: 9.99,
        price_ngn: 16485,
        billing_cycle: 'monthly',
        features: [
          'All templates (15+)',
          'Advanced AI suggestions',
          'Unlimited resumes',
          'Cover letter builder',
          'Export as PDF, DOCX, TXT',
          'Full customization',
          'No watermark'
        ],
        is_active: true
      },
      {
        name: 'Professional Annual',
        description: 'For career professionals',
        price_usd: 16.99,
        price_ngn: 28019,
        billing_cycle: 'annual',
        features: [
          'Everything in Premium',
          'LinkedIn profile optimization',
          'Expert resume review',
          'Priority AI suggestions',
          'Job application tracking',
          'Interview preparation',
          'Priority support'
        ],
        is_active: true
      },
      {
        name: 'Professional',
        description: 'For career professionals',
        price_usd: 19.99,
        price_ngn: 32970,
        billing_cycle: 'monthly',
        features: [
          'Everything in Premium',
          'LinkedIn profile optimization',
          'Expert resume review',
          'Priority AI suggestions',
          'Job application tracking',
          'Interview preparation',
          'Priority support'
        ],
        is_active: true
      }
    ];

    const createdPlans: SubscriptionPlan[] = [];
    for (const plan of defaultPlans) {
      const existingPlan = await this.subscriptionPlanModel.findOne({ name: plan.name }).exec();
      if (!existingPlan) {
        const newPlan = new this.subscriptionPlanModel(plan);
        const savedPlan = await newPlan.save();
        createdPlans.push(savedPlan);
      }
    }

    return createdPlans;
  }
} 