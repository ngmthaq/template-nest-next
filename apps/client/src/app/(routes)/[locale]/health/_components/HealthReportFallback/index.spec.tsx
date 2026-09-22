import { renderWithIntl } from '@vitest-helpers';

import { HealthReportFallback } from '.';

describe('HealthReportFallback', () => {
  it('renders exactly two skeletons', () => {
    // Arrange
    // Act
    const { container } = renderWithIntl(<HealthReportFallback />);

    // Assert
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(2);
  });
});
