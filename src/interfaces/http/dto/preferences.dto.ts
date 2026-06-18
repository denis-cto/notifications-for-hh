import {
  IsArray,
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PreferenceItemDto {
  @IsString()
  @IsNotEmpty()
  notificationType!: string;

  @IsString()
  @IsNotEmpty()
  channel!: string;

  @IsBoolean()
  enabled!: boolean;
}

export class QuietHoursDto {
  @IsBoolean()
  enabled!: boolean;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  start!: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  end!: string;

  @IsString()
  @IsNotEmpty()
  timezone!: string;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreferenceItemDto)
  preferences?: PreferenceItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quietHours?: QuietHoursDto;
}

export class EvaluateDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  notificationType!: string;

  @IsString()
  @IsNotEmpty()
  channel!: string;

  @IsString()
  @IsNotEmpty()
  region!: string;

  @IsISO8601()
  datetime!: string;
}
