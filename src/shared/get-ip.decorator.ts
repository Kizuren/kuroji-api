import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetIp = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  
  const ip = 
    request.headers['x-forwarded-for']?.split(',')[0] || 
    request.headers['x-real-ip'] ||
    request.connection?.remoteAddress ||
    request.socket?.remoteAddress ||
    request.ip;
    
  return ip;
}); 