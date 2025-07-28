import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resume, ResumeDocument } from './schemas/resume.schema';
import { UsersService } from '../users/users.service';

export interface CreateResumeDto {
  title: string;
  content: any;
  templateId?: string;
  isDefault?: boolean;
}

export interface UpdateResumeDto {
  title?: string;
  content?: any;
  templateId?: string;
  isDefault?: boolean;
}

@Injectable()
export class ResumesService {
  constructor(
    @InjectModel(Resume.name) private resumeModel: Model<ResumeDocument>,
    private usersService: UsersService,
  ) {}

  async create(userId: string, createResumeDto: CreateResumeDto): Promise<Resume> {
    // Check user's subscription plan and resume limits
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const resumeCount = await this.resumeModel.countDocuments({ userId: new Types.ObjectId(userId) });
    const canCreate = this.checkResumeLimit(user.subscriptionPlan, resumeCount);

    if (!canCreate) {
      throw new ForbiddenException(
        `You've reached the resume limit for your ${user.subscriptionPlan} plan. Please upgrade to create more resumes.`
      );
    }

    // If this is the first resume or user wants to set as default, unset other defaults
    if (createResumeDto.isDefault || resumeCount === 0) {
      await this.resumeModel.updateMany(
        { userId: new Types.ObjectId(userId) },
        { isDefault: false }
      );
    }

    const resume = new this.resumeModel({
      userId: new Types.ObjectId(userId),
      ...createResumeDto,
    });

    return resume.save();
  }

  async findAll(userId: string): Promise<Resume[]> {
    return this.resumeModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findOne(userId: string, resumeId: string): Promise<Resume> {
    const resume = await this.resumeModel.findOne({
      _id: new Types.ObjectId(resumeId),
      userId: new Types.ObjectId(userId),
    });

    if (!resume) {
      throw new BadRequestException('Resume not found');
    }

    return resume;
  }

  async update(userId: string, resumeId: string, updateResumeDto: UpdateResumeDto): Promise<Resume> {
    const resume = await this.findOne(userId, resumeId);

    // If setting as default, unset other defaults
    if (updateResumeDto.isDefault) {
      await this.resumeModel.updateMany(
        { userId: new Types.ObjectId(userId) },
        { isDefault: false }
      );
    }

    const updatedResume = await this.resumeModel.findByIdAndUpdate(
      resumeId,
      { ...updateResumeDto, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedResume) {
      throw new BadRequestException('Resume not found');
    }

    return updatedResume;
  }

  async remove(userId: string, resumeId: string): Promise<void> {
    const resume = await this.findOne(userId, resumeId);
    
    await this.resumeModel.findByIdAndDelete(resumeId);

    // If this was the default resume, set another one as default
    if (resume.isDefault) {
      const remainingResumes = await this.resumeModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ updatedAt: -1 })
        .limit(1);

      if (remainingResumes.length > 0) {
        await this.resumeModel.findByIdAndUpdate(
          remainingResumes[0]._id,
          { isDefault: true }
        );
      }
    }
  }

  async setDefault(userId: string, resumeId: string): Promise<Resume> {
    // First, unset all other resumes as default
    await this.resumeModel.updateMany(
      { userId: new Types.ObjectId(userId) },
      { isDefault: false }
    );

    // Then set the selected resume as default
    const resume = await this.resumeModel.findByIdAndUpdate(
      resumeId,
      { isDefault: true },
      { new: true }
    );

    if (!resume) {
      throw new BadRequestException('Resume not found');
    }

    return resume;
  }

  async getResumeLimits(userId: string): Promise<{
    canCreate: boolean;
    remaining: number;
    total: number;
    used: number;
  }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const used = await this.resumeModel.countDocuments({ userId: new Types.ObjectId(userId) });
    const { total, canCreate } = this.getPlanLimits(user.subscriptionPlan);

    const remaining = total === Infinity ? Infinity : Math.max(0, total - used);

    return { canCreate, remaining, total, used };
  }

  private checkResumeLimit(subscriptionPlan: string, resumeCount: number): boolean {
    const { total } = this.getPlanLimits(subscriptionPlan);
    return total === Infinity || resumeCount < total;
  }

  private getPlanLimits(subscriptionPlan: string): { total: number; canCreate: boolean } {
    switch (subscriptionPlan) {
      case 'Free':
        return { total: 1, canCreate: true };
      case 'Premium':
      case 'Premium Annual':
        return { total: 10, canCreate: true };
      case 'Professional':
      case 'Professional Annual':
        return { total: Infinity, canCreate: true };
      default:
        return { total: 0, canCreate: false };
    }
  }
} 