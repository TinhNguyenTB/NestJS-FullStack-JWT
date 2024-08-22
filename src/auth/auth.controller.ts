import { Controller, Request, Post, UseGuards, Body } from '@nestjs/common';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { AuthService } from './auth.service';
import { Public, ResponseMessage } from '@/decorator/customize';
import { CodeAuthDto, RegisterDto } from './dto/registerDto';
import { MailerService } from '@nestjs-modules/mailer';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly mailerService: MailerService
  ) { }

  @UseGuards(LocalAuthGuard)
  @Public()
  @ResponseMessage("Fetch Login")
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.handleRegister(registerDto);
  }

  @Public()
  @Post('check-code')
  checkCode(@Body() codeAuthDto: CodeAuthDto) {
    return this.authService.checkCode(codeAuthDto);
  }

  @Public()
  @Post('retry-active')
  retryActive(@Body("email") email: string) {
    return this.authService.retryActive(email);
  }

}
