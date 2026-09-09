import { Module } from '@nestjs/common';

import { WebsocketGateway } from './websocket.gateway';

/** Wires up the Socket.IO gateway. Register additional gateways here. */
@Module({
  imports: [],
  exports: [WebsocketGateway],
  controllers: [],
  providers: [WebsocketGateway],
})
export class WebsocketModule {}
