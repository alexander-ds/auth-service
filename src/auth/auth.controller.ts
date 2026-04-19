/* eslint-disable prettier/prettier */
import { Controller, Post, Body} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';

import { ApiTags, ApiOperation} from '@nestjs/swagger';

@ApiTags('Auth') // 🔥 agrupa endpoints en Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 🔐 REGISTER
  @Post('register')
  @ApiOperation({ summary: 'Registrar usuario' })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password);
  }

  // 🔑 LOGIN
  @Post('login')
  @ApiOperation({ summary: 'Login de usuario' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

}