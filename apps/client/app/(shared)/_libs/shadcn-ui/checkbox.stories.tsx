'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { Checkbox } from './checkbox';
import { Label } from './label';

function ControlledCheckboxDemo() {
  const [checked, setChecked] = useState<boolean | 'indeterminate'>(false);

  return (
    <div className="flex items-center gap-2">
      <Checkbox id="checkbox-controlled" checked={checked} onCheckedChange={setChecked} />
      <Label htmlFor="checkbox-controlled">
        {checked === 'indeterminate' ? 'Indeterminate' : checked ? 'Checked' : 'Unchecked'}
      </Label>
    </div>
  );
}

const meta = {
  title: 'Shadcn/Checkbox',
  component: Checkbox,
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Controlled: Story = {
  render: () => <ControlledCheckboxDemo />,
};

export const DefaultChecked: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="checkbox-default-checked" defaultChecked />
      <Label htmlFor="checkbox-default-checked">Subscribe to newsletter</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="checkbox-disabled" disabled />
      <Label htmlFor="checkbox-disabled">Unavailable option</Label>
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="checkbox-invalid" aria-invalid />
      <Label htmlFor="checkbox-invalid">Required option</Label>
    </div>
  ),
};
