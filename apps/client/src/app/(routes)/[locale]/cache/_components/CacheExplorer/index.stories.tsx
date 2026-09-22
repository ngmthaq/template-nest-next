import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import type { CacheActionResult, CacheDeleteResult, CacheEntry } from '.';
import { CacheExplorer } from '.';

const sampleEntries: CacheEntry[] = [
  { key: 'user:42', value: { id: 42, name: 'Ada Lovelace' } },
  { key: 'user:43', value: { id: 43, name: 'Alan Turing' } },
];

const meta = {
  title: 'Routes/Cache/CacheExplorer',
  component: CacheExplorer,
  args: {
    searchAction: fn(async (): Promise<CacheActionResult<CacheEntry[]>> => ({
      ok: true,
      data: sampleEntries,
    })),
    deleteAction: fn(async (key: string): Promise<CacheActionResult<CacheDeleteResult>> => ({
      ok: true,
      data: { key, deleted: true },
    })),
  },
} satisfies Meta<typeof CacheExplorer>;

export default meta;

type Story = StoryObj<typeof meta>;

async function search(canvasElement: HTMLElement, pattern: string) {
  const canvas = within(canvasElement);
  await userEvent.type(canvas.getByLabelText(/pattern/i), pattern);
  await userEvent.click(canvas.getByRole('button', { name: /search/i }));
}

export const WithResults: Story = {
  play: async ({ canvasElement }) => {
    await search(canvasElement, 'user:*');
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('user:42')).toBeInTheDocument());
  },
};

export const Empty: Story = {
  args: {
    searchAction: fn(async (): Promise<CacheActionResult<CacheEntry[]>> => ({
      ok: true,
      data: [],
    })),
  },
  play: async ({ canvasElement }) => {
    await search(canvasElement, 'no-match:*');
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText(/no entries found/i)).toBeInTheDocument());
  },
};

export const ProductionBlocked: Story = {
  args: {
    searchAction: fn(async (): Promise<CacheActionResult<CacheEntry[]>> => ({
      ok: false,
      error: 'production',
    })),
  },
  play: async ({ canvasElement }) => {
    await search(canvasElement, 'user:*');
  },
};
