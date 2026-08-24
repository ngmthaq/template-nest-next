import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Input } from './input';
import { Label } from './label';

const meta = {
  title: 'Shadcn/Input',
  component: Input,
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="input-default">Email</Label>
      <Input id="input-default" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="input-disabled">Email</Label>
      <Input id="input-disabled" type="email" placeholder="you@example.com" disabled />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="input-invalid">Email</Label>
      <Input id="input-invalid" type="email" defaultValue="not-an-email" aria-invalid />
    </div>
  ),
};

export const File: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="input-file">Attachment</Label>
      <Input id="input-file" type="file" />
    </div>
  ),
};
