import { loginSchema, refreshTokenSchema, signupSchema } from '@coffeeroute/shared';
import { createZodDto } from 'nestjs-zod';

export class SignupDto extends createZodDto(signupSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}
