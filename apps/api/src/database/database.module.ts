import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createDb, type Database } from './drizzle.factory.js';
import { DRIZZLE } from './tokens.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Database => {
        const url = config.getOrThrow<string>('DATABASE_URL');
        return createDb(url);
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
