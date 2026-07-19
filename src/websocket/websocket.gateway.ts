import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsResponse,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

/**
 * Application WebSocket gateway (Socket.IO).
 *
 * Attaches to the same HTTP server the app listens on. Connection lifecycle
 * events are logged, and inbound messages are handled by `@SubscribeMessage`
 * methods. Broadcast to every connected client via the injected `server`.
 *
 * CORS is not configured on the decorator: it is applied at bootstrap by
 * `ConfiguredIoAdapter` (see `websocket.adapter.ts`), which sources the same
 * `CORS_*` settings as the REST layer so both transports share one policy.
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

  /**
   * Broadcast an event and payload to every connected client. Prefer calling
   * this over reaching into `server` directly from other providers.
   */
  public broadcast<T>(event: string, data: T): void {
    this.server.emit(event, data);
  }

  /**
   * Broadcast to every connected client except one. A socket auto-joins a room
   * named after its own id, so excluding that id excludes just that client —
   * the server-side equivalent of `client.broadcast.emit(...)`.
   */
  public broadcastExcept<T>(socketId: string, event: string, data: T): void {
    this.server.except(socketId).emit(event, data);
  }

  /**
   * Emit an event to every client that has joined the given room. Clients join
   * rooms via the `room:join` message (see {@link handleJoinRoom}).
   */
  public emitToRoom<T>(room: string, event: string, data: T): void {
    this.server.to(room).emit(event, data);
  }

  /**
   * Emit an event to every client in `room` except the one with `socketId` —
   * e.g. notify a room of an action without echoing it back to its author.
   */
  public emitToRoomExcept<T>(room: string, socketId: string, event: string, data: T): void {
    this.server.to(room).except(socketId).emit(event, data);
  }

  /**
   * Emit an event to a single client by its socket id.
   */
  public emitToClient<T>(socketId: string, event: string, data: T): void {
    this.server.to(socketId).emit(event, data);
  }

  /**
   * Health-check message. A client emitting `ping` receives a `pong` back
   * carrying the same payload — useful for verifying the connection.
   */
  @SubscribeMessage('ping')
  public handlePing(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ): WsResponse<unknown> {
    this.logger.debug(`Received "ping" from ${client.id}`);
    return { event: 'pong', data: payload };
  }

  /**
   * Add the calling client to a room. Joining is client-initiated because it
   * needs the client's own socket, so it cannot be driven from the event bus.
   */
  @SubscribeMessage('room:join')
  public handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ): WsResponse<string> {
    void client.join(room);
    this.logger.debug(`Client ${client.id} joined room "${room}"`);
    return { event: 'room:joined', data: room };
  }

  /**
   * Remove the calling client from a room.
   */
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
