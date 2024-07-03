import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/typeorm/user.entity';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly autService: AuthService) {}

  @Post('/register')
  registerUser(@Body() user: User, @Res() res: Response) {
    return this.autService.registerUser(user, res);
  }

  @Post('/login')
  loginUser(@Body() user: User, @Res() res: Response) {
    return this.autService.loginUser(user, res);
  }

  @Get('/user')
  authUser(@Req() req: Request, @Res() res: Response) {
    return this.autService.authUser(req, res);
  }

  @Post('/refresh')
  refreshUser(@Req() req: Request, @Res() res: Response) {
    return this.autService.refreshUser(req, res);
  }

  @Get('/logout')
  logoutUser(@Res() res: Response) {
    return this.autService.logoutUser(res);
  }
}
