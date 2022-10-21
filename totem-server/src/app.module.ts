import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { RavenInterceptor, RavenModule } from 'nest-raven';
import appDbconfig from './app.dbconfig';
import { HttpExceptionFilter } from './guards/http-exception.filter';
import { PaymentsModule } from './payments/payments.module';
import { CvuModule } from './plugins/cvu/cvu.module';
import { SareaModule } from './plugins/sarea/sarea.module';
import { TagsModule } from './tags/tags.module';
import { TotemsModule } from './totems/totems.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(appDbconfig as TypeOrmModuleOptions),
    // UsersModule,
    ScheduleModule.forRoot(),

    TransactionsModule,
    PaymentsModule,
    CvuModule,
    SareaModule,
    RavenModule,

    TotemsModule,
    TagsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useValue: new RavenInterceptor(),
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
