import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from '@vitest-helpers';
import { toast } from 'sonner';

import type { CacheDeleteResult, CacheEntry } from '../../_schemas/cacheResponseSchema';
import type { CacheActionResult } from '.';
import { CacheExplorer } from '.';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('@/shared/utils/logUtils', () => ({
  logUtils: { error: vi.fn() },
}));

function renderExplorer(
  searchAction: (pattern: string) => Promise<CacheActionResult<CacheEntry[]>>,
  deleteAction: (key: string) => Promise<CacheActionResult<CacheDeleteResult>>,
) {
  return renderWithIntl(<CacheExplorer searchAction={searchAction} deleteAction={deleteAction} />);
}

async function searchFor(user: ReturnType<typeof userEvent.setup>, pattern: string) {
  await user.type(screen.getByLabelText('Key pattern'), pattern);
  await user.click(screen.getByRole('button', { name: 'Search' }));
}

describe('CacheExplorer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search happy path', () => {
    it('calls searchAction with the typed pattern and renders a row per entry', async () => {
      // Arrange
      const entries: CacheEntry[] = [{ key: 'user:42', value: { id: 42 } }];
      const searchAction = vi.fn().mockResolvedValue({ ok: true, data: entries });
      const user = userEvent.setup();
      renderExplorer(searchAction, vi.fn());

      // Act
      await searchFor(user, 'user:*');

      // Assert
      expect(searchAction).toHaveBeenCalledWith('user:*');
      const keyCell = await screen.findByText('user:42');
      const row = keyCell.closest('tr');
      expect(row?.querySelector('pre')?.textContent).toContain('"id": 42');
    });
  });

  describe('search edge cases', () => {
    it('shows the empty message when the search returns no entries', async () => {
      // Arrange
      const searchAction = vi.fn().mockResolvedValue({ ok: true, data: [] });
      const user = userEvent.setup();
      renderExplorer(searchAction, vi.fn());

      // Act
      await searchFor(user, 'none:*');

      // Assert
      expect(await screen.findByText('No entries found.')).toBeInTheDocument();
    });

    it('shows the required error and does not call searchAction for an empty pattern', async () => {
      // Arrange
      const searchAction = vi.fn();
      const user = userEvent.setup();
      renderExplorer(searchAction, vi.fn());

      // Act
      await user.click(screen.getByRole('button', { name: 'Search' }));

      // Assert
      expect(await screen.findByText('Enter a pattern to search.')).toBeInTheDocument();
      expect(searchAction).not.toHaveBeenCalled();
    });

    it('shows the too-long error for a pattern over 200 characters', async () => {
      // Arrange
      const searchAction = vi.fn();
      renderExplorer(searchAction, vi.fn());
      const input = screen.getByLabelText('Key pattern');

      // Act
      // maxLength=200 blocks real typing, so the value is set directly to bypass it.
      fireEvent.change(input, { target: { value: 'a'.repeat(201) } });
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));

      // Assert
      expect(
        await screen.findByText('Pattern must be at most 200 characters.'),
      ).toBeInTheDocument();
      expect(searchAction).not.toHaveBeenCalled();
    });
  });

  describe('search failures', () => {
    it('shows the search-failed toast for an unexpected error', async () => {
      // Arrange
      const searchAction = vi.fn().mockResolvedValue({ ok: false, error: 'unexpected' });
      const user = userEvent.setup();
      renderExplorer(searchAction, vi.fn());

      // Act
      await searchFor(user, 'user:*');

      // Assert
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Could not search the cache. Try again.'),
      );
    });

    it('shows the production-blocked toast for a production error', async () => {
      // Arrange
      const searchAction = vi.fn().mockResolvedValue({ ok: false, error: 'production' });
      const user = userEvent.setup();
      renderExplorer(searchAction, vi.fn());

      // Act
      await searchFor(user, 'user:*');

      // Assert
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('This page is not available in production.'),
      );
    });

    it('shows the search-failed toast and re-enables the button when searchAction rejects', async () => {
      // Arrange
      const searchAction = vi.fn().mockRejectedValue(new Error('network down'));
      const user = userEvent.setup();
      renderExplorer(searchAction, vi.fn());

      // Act
      await searchFor(user, 'user:*');

      // Assert
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Could not search the cache. Try again.'),
      );
      expect(screen.getByRole('button', { name: 'Search' })).toBeEnabled();
    });
  });

  describe('delete', () => {
    const entries: CacheEntry[] = [{ key: 'user:42', value: { id: 42 } }];

    async function searchAndOpenDeleteDialog(user: ReturnType<typeof userEvent.setup>) {
      await searchFor(user, 'user:*');
      await screen.findByText('user:42');
      await user.click(screen.getByRole('button', { name: 'Delete user:42' }));
      return screen.findByRole('alertdialog');
    }

    it('calls deleteAction, removes the row, and shows a success toast when confirmed and deleted', async () => {
      // Arrange
      const searchAction = vi.fn().mockResolvedValue({ ok: true, data: entries });
      const deleteAction = vi
        .fn()
        .mockResolvedValue({ ok: true, data: { key: 'user:42', deleted: true } });
      const user = userEvent.setup();
      renderExplorer(searchAction, deleteAction);
      const dialog = await searchAndOpenDeleteDialog(user);

      // Act
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

      // Assert
      await waitFor(() => expect(deleteAction).toHaveBeenCalledWith('user:42'));
      await waitFor(() => expect(screen.queryByText('user:42')).not.toBeInTheDocument());
      expect(toast.success).toHaveBeenCalledWith('Deleted "user:42".');
    });

    it('removes the row and shows an info toast when the key was not found', async () => {
      // Arrange
      const searchAction = vi.fn().mockResolvedValue({ ok: true, data: entries });
      const deleteAction = vi
        .fn()
        .mockResolvedValue({ ok: true, data: { key: 'user:42', deleted: false } });
      const user = userEvent.setup();
      renderExplorer(searchAction, deleteAction);
      const dialog = await searchAndOpenDeleteDialog(user);

      // Act
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

      // Assert
      await waitFor(() => expect(screen.queryByText('user:42')).not.toBeInTheDocument());
      expect(toast.info).toHaveBeenCalledWith('"user:42" was not found.');
    });

    it('does not call deleteAction and keeps the row when canceled', async () => {
      // Arrange
      const searchAction = vi.fn().mockResolvedValue({ ok: true, data: entries });
      const deleteAction = vi.fn();
      const user = userEvent.setup();
      renderExplorer(searchAction, deleteAction);
      const dialog = await searchAndOpenDeleteDialog(user);

      // Act
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      // Assert
      expect(deleteAction).not.toHaveBeenCalled();
      expect(screen.getByText('user:42')).toBeInTheDocument();
    });

    it('shows the delete-failed toast and keeps the row when deleteAction fails', async () => {
      // Arrange
      const searchAction = vi.fn().mockResolvedValue({ ok: true, data: entries });
      const deleteAction = vi.fn().mockResolvedValue({ ok: false, error: 'unexpected' });
      const user = userEvent.setup();
      renderExplorer(searchAction, deleteAction);
      const dialog = await searchAndOpenDeleteDialog(user);

      // Act
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

      // Assert
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Could not delete the entry. Try again.'),
      );
      expect(screen.getByText('user:42')).toBeInTheDocument();
    });

    it('shows the delete-failed toast and clears the spinner when deleteAction rejects', async () => {
      // Arrange
      const searchAction = vi.fn().mockResolvedValue({ ok: true, data: entries });
      const deleteAction = vi.fn().mockRejectedValue(new Error('network down'));
      const user = userEvent.setup();
      renderExplorer(searchAction, deleteAction);
      const dialog = await searchAndOpenDeleteDialog(user);

      // Act
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

      // Assert
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Could not delete the entry. Try again.'),
      );
      expect(screen.getByText('user:42')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete user:42' })).toBeEnabled();
    });
  });
});
