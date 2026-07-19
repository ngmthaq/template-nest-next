import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  public constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary: 'Root greeting / liveness check',
  })
  @ApiOkResponse({
    description: 'Greeting text.',
    type: String,
  })
  @Version(VERSION_NEUTRAL)
  @Get()
  public getHello(): string {
    return this.appService.getHello();
  }
}
