import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  public constructor(private readonly appService: AppService) {}

  @Version(VERSION_NEUTRAL)
  @Get()
  public getHello(): string {
    return this.appService.getHello();
  }
}
