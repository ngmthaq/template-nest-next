import { Logger } from '@nestjs/common';
import type {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsResponse,
} from '@nestjs/websockets';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

/**
 * Application Socket.IO gateway, attached to the app's HTTP server. CORS comes from
 * `ConfiguredIoAdapter` at bootstrap, not the decorator, so both transports share one policy.
 */
@WebSocketGateway()
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  public afterInit(): void {
    this.logger.log('WebSocket gateway initialized');
  }

  public handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  public handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /** Broadcast to every connected client. Prefer this over reaching into `server`. */
  public broadcast<T>(event: string, data: T): void {
    this.server.emit(event, data);
  }

  /** Broadcast to everyone but one client — a socket auto-joins a room named after its own id. */
  public broadcastExcept<T>(socketId: string, event: string, data: T): void {
    this.server.except(socketId).emit(event, data);
  }

  /** Emit to every client that joined `room` via {@link handleJoinRoom}. */
  public emitToRoom<T>(room: string, event: string, data: T): void {
    this.server.to(room).emit(event, data);
  }

  /** Emit to a room except one client — e.g. notify others without echoing to the author. */
  public emitToRoomExcept<T>(room: string, socketId: string, event: string, data: T): void {
    this.server.to(room).except(socketId).emit(event, data);
  }

  /** Emit to a single client by socket id. */
  public emitToClient<T>(socketId: string, event: string, data: T): void {
    this.server.to(socketId).emit(event, data);
  }

  /** Health check: a client emitting `ping` gets the same payload back as `pong`. */
  @SubscribeMessage('ping')
  public handlePing(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ): WsResponse<unknown> {
    this.logger.debug(`Received "ping" from ${client.id}`);
    return { event: 'pong', data: payload };
  }

  /** Add the calling client to a room. Client-initiated, since it needs the client's own socket. */
  @SubscribeMessage('room:join')
  public handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ): WsResponse<string> {
    void client.join(room);
    this.logger.debug(`Client ${client.id} joined room "${room}"`);
    return { event: 'room:joined', data: room };
  }

  /** Remove the calling client from a room. */
  @SubscribeMessage('room:leave')
  public handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ): WsResponse<string> {
    void client.leave(room);
    this.logger.debug(`Client ${client.id} left room "${room}"`);
    return { event: 'room:left', data: room };
  }
}
