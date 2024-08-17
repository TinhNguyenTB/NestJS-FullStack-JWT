import { Controller, Request, Post, UseGuards, Get, Body } from '@nestjs/common';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { AuthService } from './auth.service';
import { Public } from '@/decorator/customize';
import { RegisterDto } from './dto/registerDto';
import { MailerService } from '@nestjs-modules/mailer';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly mailerService: MailerService
  ) { }

  @UseGuards(LocalAuthGuard)
  @Public()
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
  @Get('mail')
  testMail() {
    this.mailerService
      .sendMail({
        to: 'lehieu18102k3@gmail.com',
        subject: 'Testing Nest Mailermodule with template ✔',
        text: 'Welcome',
        html: '<p>Hello world</p>'
      })
      .then(() => { })
      .catch(() => { });

    return 'ok';
  }
}
