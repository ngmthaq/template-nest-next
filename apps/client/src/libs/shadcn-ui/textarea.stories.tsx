import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Label } from './label';
import { Textarea } from './textarea';

const meta = {
  title: 'Shadcn/Textarea',
  component: Textarea,
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-1.5">
      <Label htmlFor="textarea-default">Message</Label>
      <Textarea id="textarea-default" placeholder="Type your message here." />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-1.5">
      <Label htmlFor="textarea-disabled">Message</Label>
      <Textarea id="textarea-disabled" placeholder="Type your message here." disabled />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-1.5">
      <Label htmlFor="textarea-invalid">Message</Label>
      <Textarea id="textarea-invalid" defaultValue="Too short" aria-invalid />
    </div>
  ),
};
