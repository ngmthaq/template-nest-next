import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { PaginationQueryDto } from './pagination-query.dto';

describe('PaginationQueryDto', () => {
  const validateInput = (input: unknown) => {
    const dto = plainToInstance(PaginationQueryDto, input, { enableImplicitConversion: true });
    return { dto, errors: validateSync(dto) };
  };

  const constraintsFor = (input: unknown, property: string) =>
    validateInput(input).errors.find((error) => error.property === property)?.constraints ?? {};

  it('defaults to the first page of twenty items when the query is empty', () => {
    // Arrange
    const input = {};

    // Act
    const { dto, errors } = validateInput(input);

    // Assert
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });

  it('coerces query strings into numbers', () => {
    // Arrange
    const input = { page: '2', limit: '50' };

    // Act
    const { dto, errors } = validateInput(input);

    // Assert
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);
  });

  it('keeps the default for the field that is omitted', () => {
    // Arrange
    const input = { page: '3' };

    // Act
    const { dto, errors } = validateInput(input);

    // Assert
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(20);
  });

  it('accepts a limit of exactly one hundred, the documented maximum', () => {
    // Arrange
    const input = { limit: '100' };

    // Act
    const { dto, errors } = validateInput(input);

    // Assert
    expect(errors).toHaveLength(0);
    expect(dto.limit).toBe(100);
  });

  it('rejects a limit above one hundred so oversized pages never reach the backend', () => {
    // Arrange
    const input = { limit: '101' };

    // Act
    const constraints = constraintsFor(input, 'limit');

    // Assert
    expect(constraints).toHaveProperty('max');
  });

  it('rejects a page below one', () => {
    // Arrange
    const input = { page: '0' };

    // Act
    const constraints = constraintsFor(input, 'page');

    // Assert
    expect(constraints).toHaveProperty('min');
  });

  it('rejects a fractional page', () => {
    // Arrange
    const input = { page: '1.5' };

    // Act
    const constraints = constraintsFor(input, 'page');

    // Assert
    expect(constraints).toHaveProperty('isInt');
  });

  it('rejects a non-numeric limit', () => {
    // Arrange
    const input = { limit: 'abc' };

    // Act
    const constraints = constraintsFor(input, 'limit');

    // Assert
    expect(constraints).toHaveProperty('isInt');
  });
});
