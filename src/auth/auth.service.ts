import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (isPasswordValid) {
        const { password, ...result } = (user as UserDocument).toObject();
        return result;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id };
    
    // Update last login
    await this.usersService.updateLastLogin(user._id);
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscriptionPlan: user.subscriptionPlan,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.create(createUserDto);
      const { password, ...result } = (user as UserDocument).toObject();
      
      // Generate token for immediate login
      const payload = { email: user.email, sub: user._id };
      const access_token = this.jwtService.sign(payload);
      
      return {
        access_token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          subscriptionPlan: user.subscriptionPlan,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new UnauthorizedException('Registration failed');
    }
  }

  async refreshToken(userId: string) {
    const user = await this.usersService.findById(userId);
    const payload = { email: user.email, sub: user._id };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
} 