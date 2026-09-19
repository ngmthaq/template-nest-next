import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useRouter } from '@/libs/next-intl/configs/navigation';

import { RefreshRouterButton } from '.';

vi.mock('@/libs/next-intl/configs/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('RefreshRouterButton', () => {
  const refresh = vi.fn();

  beforeEach(() => {
    refresh.mockClear();
    vi.mocked(useRouter).mockReturnValue({ refresh } as unknown as ReturnType<typeof useRouter>);
  });

  it('renders the given label', () => {
    // Arrange
    // Act
    render(<RefreshRouterButton label="Refresh" />);

    // Assert
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });

  it('calls router.refresh once when clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<RefreshRouterButton label="Refresh" />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    // Assert
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
