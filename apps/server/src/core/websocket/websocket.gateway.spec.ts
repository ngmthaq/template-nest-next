import type { Socket } from 'socket.io';

import { WebsocketGateway } from './websocket.gateway';

/** Minimal shape of the parts of a Socket.IO `Server` the gateway relies on. */
interface MockServer {
  emit: jest.Mock;
  except: jest.Mock;
  to: jest.Mock;
}

/** Build a mock `Server` with chainable `except()` / `to()` broadcast operators. */
function createMockServer(): {
  server: MockServer;
  emit: jest.Mock;
  exceptEmit: jest.Mock;
  toEmit: jest.Mock;
  toExceptEmit: jest.Mock;
} {
  const emit = jest.fn();
  const exceptEmit = jest.fn();
  const toEmit = jest.fn();
  const toExceptEmit = jest.fn();

  const server: MockServer = {
    emit,
    except: jest.fn().mockReturnValue({ emit: exceptEmit }),
    to: jest.fn().mockReturnValue({
      emit: toEmit,
      except: jest.fn().mockReturnValue({ emit: toExceptEmit }),
    }),
  };

  return { server, emit, exceptEmit, toEmit, toExceptEmit };
}

/** Build a mock `Socket` client exposing only what the gateway handlers use. */
function createMockClient(id: string): { client: Socket; join: jest.Mock; leave: jest.Mock } {
  const join = jest.fn();
  const leave = jest.fn();
  const client = { id, join, leave } as unknown as Socket;
  return { client, join, leave };
}

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;
  let mocks: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    gateway = new WebsocketGateway();
    mocks = createMockServer();
    Object.assign(gateway, { server: mocks.server });
  });

  it('broadcast emits the event and data to every connected client', () => {
    // Act
    gateway.broadcast('notice', { message: 'hi' });

    // Assert
    expect(mocks.emit).toHaveBeenCalledWith('notice', { message: 'hi' });
  });

  it('broadcastExcept emits to every client except the given socket id', () => {
    // Act
    gateway.broadcastExcept('socket-1', 'notice', { message: 'hi' });

    // Assert
    expect(mocks.server.except).toHaveBeenCalledWith('socket-1');
    expect(mocks.exceptEmit).toHaveBeenCalledWith('notice', { message: 'hi' });
  });

  it('emitToRoom emits to every client in the given room', () => {
    // Act
    gateway.emitToRoom('room-1', 'notice', { message: 'hi' });

    // Assert
    expect(mocks.server.to).toHaveBeenCalledWith('room-1');
    expect(mocks.toEmit).toHaveBeenCalledWith('notice', { message: 'hi' });
  });

  it('emitToRoomExcept emits to a room excluding the given socket id', () => {
    // Act
    gateway.emitToRoomExcept('room-1', 'socket-1', 'notice', { message: 'hi' });

    // Assert
    expect(mocks.server.to).toHaveBeenCalledWith('room-1');
    expect(mocks.toExceptEmit).toHaveBeenCalledWith('notice', { message: 'hi' });
  });

  it('emitToClient emits to a single client by socket id', () => {
    // Act
    gateway.emitToClient('socket-1', 'notice', { message: 'hi' });

    // Assert
    expect(mocks.server.to).toHaveBeenCalledWith('socket-1');
    expect(mocks.toEmit).toHaveBeenCalledWith('notice', { message: 'hi' });
  });

  it('handlePing echoes the received payload back in a pong response', () => {
    // Arrange
    const { client } = createMockClient('socket-1');
    const payload = { seq: 42, tag: 'ping' };

    // Act
    const result = gateway.handlePing(payload, client);

    // Assert
    expect(result).toEqual({ event: 'pong', data: payload });
  });

  it('handleJoinRoom joins the client to the room and confirms membership', () => {
    // Arrange
    const { client, join } = createMockClient('socket-1');

    // Act
    const result = gateway.handleJoinRoom('room-1', client);

    // Assert
    expect(join).toHaveBeenCalledWith('room-1');
    expect(result).toEqual({ event: 'room:joined', data: 'room-1' });
  });

  it('handleLeaveRoom removes the client from the room and confirms departure', () => {
    // Arrange
    const { client, leave } = createMockClient('socket-1');

    // Act
    const result = gateway.handleLeaveRoom('room-1', client);

    // Assert
    expect(leave).toHaveBeenCalledWith('room-1');
    expect(result).toEqual({ event: 'room:left', data: 'room-1' });
  });
});
