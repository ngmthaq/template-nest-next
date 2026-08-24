import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Badge } from './badge';

const meta = {
  title: 'Shadcn/Badge',
  component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: 'Badge' } };

export const Secondary: Story = { args: { variant: 'secondary', children: 'Secondary' } };

export const Destructive: Story = { args: { variant: 'destructive', children: 'Destructive' } };

export const Outline: Story = { args: { variant: 'outline', children: 'Outline' } };

export const Ghost: Story = { args: { variant: 'ghost', children: 'Ghost' } };

export const Link: Story = { args: { variant: 'link', children: 'Link' } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </div>
  ),
};
