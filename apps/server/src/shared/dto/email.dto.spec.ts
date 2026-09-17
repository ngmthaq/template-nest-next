import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { EmailDto } from './email.dto';

describe('EmailDto', () => {
  const validateInput = (input: unknown) => {
    const dto = plainToInstance(EmailDto, input, { enableImplicitConversion: true });
    return { dto, errors: validateSync(dto) };
  };

  const constraintsFor = (input: unknown, property: string) =>
    validateInput(input).errors.find((error) => error.property === property)?.constraints ?? {};

  it('accepts a well-formed email address', () => {
    // Arrange
    const input = { email: 'user@example.com' };

    // Act
    const { dto, errors } = validateInput(input);

    // Assert
    expect(errors).toHaveLength(0);
    expect(dto.email).toBe('user@example.com');
  });

  it('rejects a string that is not an email address', () => {
    // Arrange
    const input = { email: 'not-an-email' };

    // Act
    const constraints = constraintsFor(input, 'email');

    // Assert
    expect(constraints).toHaveProperty('isEmail');
  });

  it('rejects a missing email because the field is required', () => {
    // Arrange
    const input = {};

    // Act
    const constraints = constraintsFor(input, 'email');

    // Assert
    expect(constraints).toHaveProperty('isEmail');
  });
});
