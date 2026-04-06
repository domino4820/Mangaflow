import { Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Global()  // Global = inject FirebaseService ở bất kỳ module nào không cần import lại
@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule { }