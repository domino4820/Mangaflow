import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private _app!: admin.app.App;

  onModuleInit() {
    if (!admin.apps.length) {
      const serviceAccountPath = path.resolve(
        __dirname,
        '..',
        'firebase-service-account.json',
      );

      this._app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      this.logger.log('Firebase Admin SDK initialized');
    } else {
      this._app = admin.apps[0]!;
    }
  }

  /** Firestore database instance */
  get firestore(): admin.firestore.Firestore {
    return admin.firestore();
  }

  /** Firebase Storage instance */
  get storage(): admin.storage.Storage {
    return admin.storage();
  }

  /** Firebase Auth instance */
  get auth(): admin.auth.Auth {
    return admin.auth();
  }
}