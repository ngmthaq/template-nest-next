import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button } from './button';
import { Spinner } from './spinner';

const meta = {
  title: 'Shadcn/Spinner',
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner className="size-3" />
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  ),
};

export const InButton: Story = {
  render: () => (
    <Button disabled>
      <Spinner />
      Loading
    </Button>
  ),
};
