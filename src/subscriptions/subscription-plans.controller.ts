import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionPlansService } from './subscription-plans.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('subscription-plans')
@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(private readonly subscriptionPlansService: SubscriptionPlansService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subscription plan (admin only)' })
  @ApiResponse({ status: 201, description: 'Subscription plan created successfully' })
  create(@Body() createSubscriptionPlanDto: CreateSubscriptionPlanDto) {
    return this.subscriptionPlansService.create(createSubscriptionPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active subscription plans' })
  @ApiResponse({ status: 200, description: 'List of subscription plans' })
  findAll() {
    return this.subscriptionPlansService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiResponse({ status: 200, description: 'Subscription plan found' })
  @ApiResponse({ status: 404, description: 'Subscription plan not found' })
  findOne(@Param('id') id: string) {
    return this.subscriptionPlansService.findOne(id);
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Get subscription plan by name' })
  @ApiResponse({ status: 200, description: 'Subscription plan found' })
  @ApiResponse({ status: 404, description: 'Subscription plan not found' })
  findByName(@Param('name') name: string) {
    return this.subscriptionPlansService.findByName(name);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subscription plan (admin only)' })
  @ApiResponse({ status: 200, description: 'Subscription plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Subscription plan not found' })
  update(@Param('id') id: string, @Body() updateSubscriptionPlanDto: UpdateSubscriptionPlanDto) {
    return this.subscriptionPlansService.update(id, updateSubscriptionPlanDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete subscription plan (admin only)' })
  @ApiResponse({ status: 200, description: 'Subscription plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subscription plan not found' })
  remove(@Param('id') id: string) {
    return this.subscriptionPlansService.remove(id);
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed default subscription plans (admin only)' })
  @ApiResponse({ status: 201, description: 'Default plans seeded successfully' })
  seedDefaultPlans() {
    return this.subscriptionPlansService.seedDefaultPlans();
  }
} 