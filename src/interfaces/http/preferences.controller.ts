import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { PreferencesService } from '../../application/preferences.service';
import { UpdatePreferencesDto } from './dto/preferences.dto';

@Controller('users/:id/preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  async getPreferences(@Param('id') userId: string) {
    const result = await this.preferencesService.getPreferences(userId);
    return this.preferencesService.toApiResponse(result);
  }

  @Post()
  @HttpCode(200)
  async updatePreferences(
    @Param('id') userId: string,
    @Body() body: UpdatePreferencesDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const input = this.preferencesService.parseUpdateInput(body);
    input.userId = userId;
    const result = await this.preferencesService.updatePreferences(
      userId,
      input,
      idempotencyKey,
    );
    return this.preferencesService.toApiResponse(result);
  }
}
