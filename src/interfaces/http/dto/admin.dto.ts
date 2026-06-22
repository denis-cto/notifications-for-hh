import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePolicyDto {
  @IsOptional()
  @IsString()
  notificationType?: string | null;

  @IsOptional()
  @IsString()
  channel?: string | null;

  @IsOptional()
  @IsString()
  region?: string | null;

  @IsIn(['DENY', 'ALLOW'])
  effect!: 'DENY' | 'ALLOW';

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class DefaultPreferenceItemDto {
  @IsString()
  @IsNotEmpty()
  notificationType!: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsBoolean()
  enabled!: boolean;
}

export class UpdateDefaultsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefaultPreferenceItemDto)
  preferences!: DefaultPreferenceItemDto[];
}
