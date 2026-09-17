import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { IdParamDto } from './id-param.dto';

describe('IdParamDto', () => {
  const validateInput = (input: unknown) => {
    const dto = plainToInstance(IdParamDto, input, { enableImplicitConversion: true });
    return { dto, errors: validateSync(dto) };
  };

  const constraintsFor = (input: unknown, property: string) =>
    validateInput(input).errors.find((error) => error.property === property)?.constraints ?? {};

  it('coerces a numeric route string into a number', () => {
    // Arrange
    const input = { id: '42' };

    // Act
    const { dto, errors } = validateInput(input);

    // Assert
    expect(errors).toHaveLength(0);
    expect(dto.id).toBe(42);
  });

  it('rejects zero because ids start at one', () => {
    // Arrange
    const input = { id: '0' };

    // Act
    const constraints = constraintsFor(input, 'id');

    // Assert
    expect(constraints).toHaveProperty('min');
  });

  it('rejects a negative id', () => {
    // Arrange
    const input = { id: '-1' };

    // Act
    const constraints = constraintsFor(input, 'id');

    // Assert
    expect(constraints).toHaveProperty('min');
  });

  it('rejects a fractional id', () => {
    // Arrange
    const input = { id: '1.5' };

    // Act
    const constraints = constraintsFor(input, 'id');

    // Assert
    expect(constraints).toHaveProperty('isInt');
  });

  it('rejects a non-numeric id', () => {
    // Arrange
    const input = { id: 'abc' };

    // Act
    const constraints = constraintsFor(input, 'id');

    // Assert
    expect(constraints).toHaveProperty('isInt');
  });
});
