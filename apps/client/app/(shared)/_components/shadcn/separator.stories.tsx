import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Separator } from './separator';

const meta = {
  title: 'Shadcn/Separator',
  component: Separator,
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-64">
      <div className="text-sm font-medium">Shadcn/ui</div>
      <div className="text-sm text-muted-foreground">An open-source component library.</div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center text-sm">
        <span>Docs</span>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center gap-4 text-sm">
      <span>Blog</span>
      <Separator orientation="vertical" />
      <span>Docs</span>
      <Separator orientation="vertical" />
      <span>Source</span>
    </div>
  ),
};
