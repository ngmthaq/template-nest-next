import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';

/**
 * Wires up the application's WebSocket (Socket.IO) gateway.
 *
 * Register additional gateways here as real-time features are added. The
 * gateway can be injected elsewhere (e.g. to broadcast from a service) by
 * exporting it below.
 */
@Module({
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
