import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { RedisService } from 'src/modules/redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
    schema: {
      example: {
        status: 'healthy',
        database: 'up',
        redis: 'up',
        timestamp: '2025-11-04T12:00:00.000Z',
      },
    },
  })
  async check() {
    let dbStatus = 'down';
    let redisStatus = 'down';

    // Check database
    try {
      await this.dataSource.query('SELECT 1');
      dbStatus = 'up';
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check Redis
    try {
      const pingResult = await this.redisService.ping();
      if (pingResult === 'PONG') {
        redisStatus = 'up';
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    const isHealthy = dbStatus === 'up' && redisStatus === 'up';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: dbStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({
    status: 200,
    description: 'Service is ready to accept traffic',
  })
  async ready() {
    // Same as health check, but Kubernetes-specific
    const health = await this.check();
    if (health.status === 'unhealthy') {
      throw new Error('Service not ready');
    }
    return { status: 'ready' };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({
    status: 200,
    description: 'Service is alive',
  })
  async live() {
    // Basic liveness check
    return { status: 'alive', timestamp: new Date().toISOString() };
  }
}
