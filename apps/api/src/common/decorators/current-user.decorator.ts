import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): { userId: string } => {
    const req = ctx.switchToHttp().getRequest<{ user?: { userId: string } }>();
    const user = req.user;
    if (!user?.userId) throw new Error('Missing user on request');
    return user;
  },
);
