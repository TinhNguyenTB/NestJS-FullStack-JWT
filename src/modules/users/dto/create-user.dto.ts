import { IsEmail, IsNotEmpty, IsPhoneNumber } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    password: string;

    @IsPhoneNumber()
    phone: string;

    @IsNotEmpty()
    address: string;

    @IsNotEmpty()
    image: string;
}
