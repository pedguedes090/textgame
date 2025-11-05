import { IsString, IsOptional, MinLength, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'My cool bio', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ example: 'avatar_url.png', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  avatar?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123' })
  @IsString()
  @MinLength(6)
  old_password: string;

  @ApiProperty({ example: 'newPassword456' })
  @IsString()
  @MinLength(6)
  new_password: string;
}
