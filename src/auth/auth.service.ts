import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { comparePassword } from '@/helpers/utils';
import { JwtService } from '@nestjs/jwt';
import { CodeAuthDto, RegisterDto } from './dto/registerDto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) { }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(username);
    if (!user) {
      return null;
    }
    const isValidPassword = await comparePassword(pass, user.password);
    if (!isValidPassword) {
      return null;
    }
    const result = user.toObject();
    delete result.password
    return result;
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user._id };
    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  handleRegister = async (registerDto: RegisterDto) => {
    return await this.usersService.handleRegister(registerDto)
  }

  async checkCode(codeAuthDto: CodeAuthDto) {
    return await this.usersService.handleActive(codeAuthDto)
  }

  async retryActive(email: string) {
    return await this.usersService.retryActive(email)
  }
}