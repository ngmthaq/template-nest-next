import 'reflect-metadata';

import { AppModule } from './app.module';
import { CoreModule } from './core/core.module';
import { FeatureModule } from './feature/feature.module';

// Jest can't resolve the generated client's `.js` imports, so stub it; importing
// the module is enough to load it.
jest.mock('./generated/prisma/client', () => ({
  PrismaClient: class PrismaClientStub {},
}));

describe('AppModule', () => {
  it('imports CoreModule and FeatureModule', () => {
    // Arrange
    const expectedModules = [CoreModule, FeatureModule];

    // Act
    const imports = Reflect.getMetadata('imports', AppModule) as unknown[];

    // Assert
    expect(imports).toHaveLength(expectedModules.length);
    expect(imports).toEqual(expect.arrayContaining(expectedModules));
  });

  it('exports no module', () => {
    // Act
    const moduleExports = Reflect.getMetadata('exports', AppModule) as unknown[] | undefined;

    // Assert
    expect(moduleExports ?? []).toHaveLength(0);
  });
});
