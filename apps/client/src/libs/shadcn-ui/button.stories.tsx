import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HeartIcon } from 'lucide-react';

import { Button } from './button';

const meta = {
  title: 'Shadcn/Button',
  component: Button,
  args: {
    children: 'Button',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: 'Button' } };

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="default">Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Like">
        <HeartIcon />
      </Button>
      <Button size="icon-xs" aria-label="Like">
        <HeartIcon />
      </Button>
      <Button size="icon-sm" aria-label="Like">
        <HeartIcon />
      </Button>
      <Button size="icon-lg" aria-label="Like">
        <HeartIcon />
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { children: 'Disabled', disabled: true },
};

export const AsChild: Story = {
  args: {
    asChild: true,
    children: <a href="https://example.com">Open documentation</a>,
  },
};
