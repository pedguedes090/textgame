import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from 'src/common/guards/rate-limit.guard';
import { PartyService } from './party.service';
import { CreatePartyDto, UpdatePartyDto, SetActivePartyDto, AddCreatureToPartyDto, RemoveCreatureFromPartyDto } from './dto/party.dto';

@ApiTags('party')
@Controller('party')
@UseGuards(JwtAuthGuard, RateLimitGuard)
@ApiBearerAuth()
export class PartyController {
  constructor(private readonly partyService: PartyService) {}

  @Post()
  @RateLimit({ ttl: 60, limit: 10 })
  @ApiOperation({ summary: 'Tạo party mới' })
  @ApiResponse({ status: 201, description: 'Party created successfully' })
  async createParty(@Req() req: any, @Body() dto: CreatePartyDto) {
    return this.partyService.createParty(req.user.id, dto);
  }

  @Get()
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiOperation({ summary: 'Lấy danh sách parties của user' })
  @ApiResponse({ status: 200, description: 'List of parties' })
  async getUserParties(@Req() req: any) {
    return this.partyService.getUserParties(req.user.id);
  }

  @Get('active')
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiOperation({ summary: 'Lấy party đang active' })
  @ApiResponse({ status: 200, description: 'Active party with creatures' })
  async getActiveParty(@Req() req: any) {
    return this.partyService.getActiveParty(req.user.id);
  }

  @Get(':id')
  @RateLimit({ ttl: 60, limit: 30 })
  @ApiOperation({ summary: 'Lấy chi tiết party' })
  @ApiParam({ name: 'id', description: 'Party ID' })
  @ApiResponse({ status: 200, description: 'Party details with creatures' })
  async getPartyDetails(@Req() req: any, @Param('id', ParseIntPipe) partyId: number) {
    return this.partyService.getPartyDetails(req.user.id, partyId);
  }

  @Put(':id')
  @RateLimit({ ttl: 60, limit: 20 })
  @ApiOperation({ summary: 'Cập nhật party (tên hoặc creatures)' })
  @ApiParam({ name: 'id', description: 'Party ID' })
  @ApiResponse({ status: 200, description: 'Party updated successfully' })
  async updateParty(
    @Req() req: any,
    @Param('id', ParseIntPipe) partyId: number,
    @Body() dto: UpdatePartyDto,
  ) {
    return this.partyService.updateParty(req.user.id, partyId, dto);
  }

  @Delete(':id')
  @RateLimit({ ttl: 60, limit: 10 })
  @ApiOperation({ summary: 'Xóa party' })
  @ApiParam({ name: 'id', description: 'Party ID' })
  @ApiResponse({ status: 200, description: 'Party deleted successfully' })
  async deleteParty(@Req() req: any, @Param('id', ParseIntPipe) partyId: number) {
    return this.partyService.deleteParty(req.user.id, partyId);
  }

  @Post('set-active')
  @RateLimit({ ttl: 60, limit: 20 })
  @ApiOperation({ summary: 'Đặt party làm active' })
  @ApiResponse({ status: 200, description: 'Party set as active' })
  async setActiveParty(@Req() req: any, @Body() dto: SetActivePartyDto) {
    return this.partyService.setActiveParty(req.user.id, dto.party_id);
  }

  @Post('add-creature')
  @RateLimit({ ttl: 60, limit: 20 })
  @ApiOperation({ summary: 'Thêm creature vào party' })
  @ApiResponse({ status: 200, description: 'Creature added to party' })
  async addCreature(@Req() req: any, @Body() dto: AddCreatureToPartyDto) {
    return this.partyService.addCreatureToParty(req.user.id, dto.party_id, dto.creature_id);
  }

  @Post('remove-creature')
  @RateLimit({ ttl: 60, limit: 20 })
  @ApiOperation({ summary: 'Xóa creature khỏi party' })
  @ApiResponse({ status: 200, description: 'Creature removed from party' })
  async removeCreature(@Req() req: any, @Body() dto: RemoveCreatureFromPartyDto) {
    return this.partyService.removeCreatureFromParty(req.user.id, dto.party_id, dto.creature_id);
  }
}
