import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateResumeDto, UpdateResumeDto } from './resumes.service';

@Controller('resumes')
@UseGuards(JwtAuthGuard)
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post()
  create(@Request() req, @Body() createResumeDto: CreateResumeDto) {
    return this.resumesService.create(req.user.userId, createResumeDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.resumesService.findAll(req.user.userId);
  }

  @Get('limits')
  getLimits(@Request() req) {
    return this.resumesService.getResumeLimits(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.resumesService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateResumeDto: UpdateResumeDto,
  ) {
    return this.resumesService.update(req.user.userId, id, updateResumeDto);
  }

  @Patch(':id/default')
  setDefault(@Request() req, @Param('id') id: string) {
    return this.resumesService.setDefault(req.user.userId, id);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.resumesService.remove(req.user.userId, id);
  }
} 