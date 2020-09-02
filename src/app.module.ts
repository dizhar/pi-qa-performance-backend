import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';


@Module({
  imports: [
    ServeStaticModule.forRoot({
      // rootPath: join(__dirname,'..', 'data')
      rootPath: join(__dirname,'..', 'sitespeed-result')
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
