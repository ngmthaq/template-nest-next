import { Test, TestingModule } from '@nestjs/testing';

import { WebsocketGateway } from './websocket.gateway';
import { WebsocketModule } from './websocket.module';

describe('WebsocketModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [WebsocketModule],
    }).compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('compiles and exposes WebsocketGateway as an exported provider', () => {
    // Act
    const gateway = moduleRef.get(WebsocketGateway);

    // Assert
    expect(gateway).toBeInstanceOf(WebsocketGateway);
  });
});
