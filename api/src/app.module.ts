import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { typeOrmConfig } from './config/typeorm.config';
import { RedisModule } from './modules/redis/redis.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { CreaturesModule } from './modules/creatures/creatures.module';
import { HuntModule } from './modules/hunt/hunt.module';
import { DungeonsModule } from './modules/dungeons/dungeons.module';
import { GachaModule } from './modules/gacha/gacha.module';
import { ItemsModule } from './modules/items/items.module';
import { PvpModule } from './modules/pvp/pvp.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { HealthModule } from './modules/health/health.module';
import { PartyModule } from './modules/party/party.module';
import { UserModule } from './modules/user/user.module';
import { HistoryModule } from './modules/history/history.module';
import { ShopModule } from './modules/shop/shop.module';
import { QuestsModule } from './modules/quests/quests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RedisModule,
    CommonModule,
    AuthModule,
    CreaturesModule,
    HuntModule,
    DungeonsModule,
    GachaModule,
    ItemsModule,
    PvpModule,
    LeaderboardModule,
    HealthModule,
    PartyModule,
    UserModule,
    HistoryModule,
    ShopModule,
    QuestsModule,
  ],
})
export class AppModule {}
