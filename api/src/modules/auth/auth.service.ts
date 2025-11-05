import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash } from 'crypto';
import { User } from 'src/entities/user.entity';
import { Rating } from 'src/entities/rating.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { StaminaService } from 'src/common/services/stamina.service';
import { gameConfig } from 'src/config/game.config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
    private readonly jwtService: JwtService,
    private readonly staminaService: StaminaService,
  ) {}

  private hashEmail(email: string): string {
    return createHash('sha256').update(email.toLowerCase()).digest('hex');
  }

  async register(dto: RegisterDto) {
    const emailHash = this.hashEmail(dto.email);

    // Check duplicate
    const existing = await this.userRepo.findOne({
      where: [{ username: dto.username }, { email_hash: emailHash }],
    });

    if (existing) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash password với Argon2
    const passHash = await argon2.hash(dto.password);

    // Create user
    const user = this.userRepo.create({
      username: dto.username,
      email_hash: emailHash,
      pass_hash: passHash,
    });

    await this.userRepo.save(user);

    // Initialize rating
    const rating = this.ratingRepo.create({
      user_id: user.id,
      rating: gameConfig.pvp.initialRating,
    });
    await this.ratingRepo.save(rating);

    return this.generateToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { username: dto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.pass_hash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        level: user.level,
        gold: user.gold,
        gems: user.gems,
      },
    };
  }

  async validateUser(userId: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: [
        'id',
        'username',
        'email_hash',
        'level',
        'gold',
        'gems',
        'stamina',
        'stamina_updated_at',
        'created_at',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate current stamina với regen
    const currentStamina = await this.staminaService.getCurrentStamina(userId);

    return {
      id: user.id,
      username: user.username,
      email_hash: user.email_hash,
      level: user.level,
      gold: user.gold,
      gems: user.gems,
      stamina: currentStamina,
      stamina_max: gameConfig.stamina.max,
      created_at: user.created_at,
    };
  }
}
