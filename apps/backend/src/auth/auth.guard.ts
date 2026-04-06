import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private firebaseService: FirebaseService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify Firebase ID Token
      const decodedToken = await this.firebaseService
        .auth
        .verifyIdToken(token);
      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}