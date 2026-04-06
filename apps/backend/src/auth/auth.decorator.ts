import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract the authenticated Firebase user from the request.
 * Usage: @CurrentUser() user: { uid: string; email: string }
 *
 * The user object is attached to request by AuthGuard after verifying the token.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export interface AuthUser {
  uid: string;
  email: string;
}
