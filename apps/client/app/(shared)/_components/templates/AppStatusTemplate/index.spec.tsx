import { render, screen } from '@testing-library/react';

import { AppStatusTemplate } from './index';

describe('AppStatusTemplate', () => {
  it('renders the code into a small element', () => {
    // Arrange
    // Act
    render(<AppStatusTemplate code={404} title="Not found" description="Page missing." />);

    // Assert
    expect(screen.getByText('404').tagName).toBe('SMALL');
  });

  it('renders the title into a level-1 heading', () => {
    // Arrange
    // Act
    render(<AppStatusTemplate code={404} title="Not found" description="Page missing." />);

    // Assert
    expect(screen.getByRole('heading', { level: 1, name: 'Not found' })).toBeInTheDocument();
  });

  it('renders the description into a paragraph', () => {
    // Arrange
    // Act
    render(<AppStatusTemplate code={404} title="Not found" description="Page missing." />);

    // Assert
    expect(screen.getByText('Page missing.').tagName).toBe('P');
  });

  it('renders children when provided', () => {
    // Arrange
    // Act
    render(
      <AppStatusTemplate code={404} title="Not found" description="Page missing.">
        <button type="button">Go home</button>
      </AppStatusTemplate>,
    );

    // Assert
    expect(screen.getByRole('button', { name: 'Go home' })).toBeInTheDocument();
  });

  it('omits the children region when no children are passed', () => {
    // Arrange
    // Act
    render(<AppStatusTemplate code={404} title="Not found" description="Page missing." />);

    // Assert
    expect(screen.getByRole('main').children).toHaveLength(3);
  });
});
