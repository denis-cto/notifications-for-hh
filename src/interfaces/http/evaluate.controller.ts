import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { EvaluateService } from '../../application/evaluate.service';
import { EvaluateDto } from './dto/preferences.dto';

@Controller()
export class EvaluateController {
  constructor(private readonly evaluateService: EvaluateService) {}

  @Post('evaluate')
  @HttpCode(200)
  async evaluate(@Body() body: EvaluateDto) {
    return this.evaluateService.evaluate(body);
  }
}
