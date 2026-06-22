import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { AdminService } from '../../application/admin.service';
import { CreatePolicyDto, UpdateDefaultsDto } from './dto/admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('policies')
  async listPolicies() {
    return this.adminService.listPolicies();
  }

  @Post('policies')
  @HttpCode(201)
  async createPolicy(@Body() body: CreatePolicyDto) {
    return this.adminService.createPolicy(body);
  }

  @Get('defaults')
  async listDefaults() {
    return this.adminService.listDefaults();
  }

  @Put('defaults')
  async updateDefaults(@Body() body: UpdateDefaultsDto) {
    return this.adminService.updateDefaults(body.preferences);
  }
}
