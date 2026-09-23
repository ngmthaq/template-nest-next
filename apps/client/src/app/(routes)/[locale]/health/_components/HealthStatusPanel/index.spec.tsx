import { screen } from '@testing-library/react';
import { renderWithIntl } from '@vitest-helpers';

import type { HealthResult } from '../../_schemas/healthResponseSchema';
import { HealthStatusPanel } from '.';

function renderPanel(report: HealthResult | null) {
  return renderWithIntl(<HealthStatusPanel report={report} />);
}

describe('HealthStatusPanel', () => {
  it('shows the overall ok badge and an up row per indicator for an ok report', () => {
    // Arrange
    const report: HealthResult = {
      status: 'ok',
      info: {
        server: { status: 'up', uptime: 123.45 },
        mysql: { status: 'up' },
      },
    };

    // Act
    renderPanel(report);

    // Assert
    expect(screen.getByText('All systems operational')).toBeInTheDocument();
    expect(screen.getAllByText('Up')).toHaveLength(2);
  });

  it('shows the server uptime as a human-readable duration', () => {
    // Arrange
    const report: HealthResult = {
      status: 'ok',
      info: { server: { status: 'up', uptime: 123.45 } },
    };

    // Act
    renderPanel(report);

    // Assert
    expect(screen.getByText('2 minutes 3 seconds')).toBeInTheDocument();
  });

  it('shows the overall error badge, a down row, and the error message for an error report', () => {
    // Arrange
    const report: HealthResult = {
      status: 'error',
      info: {
        server: { status: 'up', uptime: 10 },
        mysql: { status: 'down', error: 'connect ECONNREFUSED 127.0.0.1:3306' },
      },
    };

    // Act
    renderPanel(report);

    // Assert
    expect(screen.getByText('Degraded')).toBeInTheDocument();
    expect(screen.getByText('Down')).toBeInTheDocument();
    expect(screen.getByText('connect ECONNREFUSED 127.0.0.1:3306')).toBeInTheDocument();
  });

  it('shows the unreachable title and description when report is null', () => {
    // Arrange
    // Act
    renderPanel(null);

    // Assert
    expect(screen.getByText('API unreachable')).toBeInTheDocument();
    expect(
      screen.getByText('The health check could not reach the server. Try refreshing.'),
    ).toBeInTheDocument();
  });

  it('falls back to the raw indicator name when it is not a known indicator', () => {
    // Arrange
    const report: HealthResult = {
      status: 'ok',
      info: { customIndicator: { status: 'up' } },
    };

    // Act
    renderPanel(report);

    // Assert
    expect(screen.getByText('customIndicator')).toBeInTheDocument();
  });
});
