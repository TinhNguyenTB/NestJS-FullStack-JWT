import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsMongoId()
    @IsNotEmpty()
    _id: string;

    @IsOptional()
    @IsString()
    name: string

    @IsOptional()
    phone: string;

    @IsOptional()
    @IsString()
    address: string;

    @IsOptional()
    @IsString()
    image: string;
}
