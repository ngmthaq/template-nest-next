import 'reflect-metadata';

import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { FeatureModule } from './feature.module';
import { HealthModule } from './health/health.module';
import { UserModule } from './user/user.module';

describe('FeatureModule', () => {
  it('imports every feature module', () => {
    // Arrange
    const expectedModules = [UserModule, AuthModule, CacheModule, HealthModule];

    // Act
    const imports = Reflect.getMetadata('imports', FeatureModule) as unknown[];

    // Assert
    expect(imports).toHaveLength(expectedModules.length);
    expect(imports).toEqual(expect.arrayContaining(expectedModules));
  });

  it('exports the same modules it imports', () => {
    // Arrange
    const expectedModules = [UserModule, AuthModule, CacheModule, HealthModule];

    // Act
    const moduleExports = Reflect.getMetadata('exports', FeatureModule) as unknown[];

    // Assert
    expect(moduleExports).toHaveLength(expectedModules.length);
    expect(moduleExports).toEqual(expect.arrayContaining(expectedModules));
  });
});
