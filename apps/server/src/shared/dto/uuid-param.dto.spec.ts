import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { UuidParamDto } from './uuid-param.dto';

describe('UuidParamDto', () => {
  const validateInput = (input: unknown) => {
    const dto = plainToInstance(UuidParamDto, input, { enableImplicitConversion: true });
    return { dto, errors: validateSync(dto) };
  };

  const constraintsFor = (input: unknown, property: string) =>
    validateInput(input).errors.find((error) => error.property === property)?.constraints ?? {};

  it('accepts a well-formed uuid', () => {
    // Arrange
    const input = { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6' };

    // Act
    const { dto, errors } = validateInput(input);

    // Assert
    expect(errors).toHaveLength(0);
    expect(dto.id).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');
  });

  it('rejects a string that is not a uuid', () => {
    // Arrange
    const input = { id: 'not-a-uuid' };

    // Act
    const constraints = constraintsFor(input, 'id');

    // Assert
    expect(constraints).toHaveProperty('isUuid');
  });

  it('rejects a numeric id, so uuid routes never accept a database integer', () => {
    // Arrange
    const input = { id: '1' };

    // Act
    const constraints = constraintsFor(input, 'id');

    // Assert
    expect(constraints).toHaveProperty('isUuid');
  });

  it('rejects a missing id because the field is required', () => {
    // Arrange
    const input = {};

    // Act
    const constraints = constraintsFor(input, 'id');

    // Assert
    expect(constraints).toHaveProperty('isUuid');
  });
});
