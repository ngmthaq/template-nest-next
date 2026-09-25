import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { PyServiceHealthDto } from './py-service-health.dto';

describe('PyServiceHealthDto', () => {
  const validateInput = (input: unknown) => {
    const dto = plainToInstance(PyServiceHealthDto, input, { enableImplicitConversion: true });
    return { dto, errors: validateSync(dto) };
  };

  const constraintsFor = (input: unknown, property: string) =>
    validateInput(input).errors.find((error) => error.property === property)?.constraints ?? {};

  it('accepts a body whose status is ok', () => {
    // Arrange
    const input = { status: 'ok' };

    // Act
    const { dto, errors } = validateInput(input);

    // Assert
    expect(errors).toHaveLength(0);
    expect(dto.status).toBe('ok');
  });

  it('accepts a body with extra fields as long as status is ok', () => {
    // Arrange
    const input = { status: 'ok', version: '1.2.3' };

    // Act
    const { errors } = validateInput(input);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('rejects a status value other than ok', () => {
    // Arrange
    const input = { status: 'error' };

    // Act
    const constraints = constraintsFor(input, 'status');

    // Assert
    expect(constraints).toHaveProperty('isIn');
  });

  it('rejects a missing status field', () => {
    // Arrange
    const input = {};

    // Act
    const constraints = constraintsFor(input, 'status');

    // Assert
    expect(constraints).toHaveProperty('isIn');
  });

  it('rejects a non-string status value', () => {
    // Arrange
    const input = { status: 1 };

    // Act
    const constraints = constraintsFor(input, 'status');

    // Assert
    expect(constraints).toHaveProperty('isIn');
  });
});
