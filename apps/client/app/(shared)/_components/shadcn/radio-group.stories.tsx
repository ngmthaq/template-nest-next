'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { Label } from './label';
import { RadioGroup, RadioGroupItem } from './radio-group';

function ControlledRadioGroupDemo() {
  const [value, setValue] = useState('comfortable');

  return (
    <RadioGroup value={value} onValueChange={setValue}>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="default" id="radio-default" />
        <Label htmlFor="radio-default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="comfortable" id="radio-comfortable" />
        <Label htmlFor="radio-comfortable">Comfortable</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="compact" id="radio-compact" />
        <Label htmlFor="radio-compact">Compact</Label>
      </div>
    </RadioGroup>
  );
}

const meta = {
  title: 'Shadcn/RadioGroup',
  component: RadioGroup,
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Controlled: Story = {
  render: () => <ControlledRadioGroupDemo />,
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="compact" disabled>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="default" id="radio-disabled-default" />
        <Label htmlFor="radio-disabled-default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="compact" id="radio-disabled-compact" />
        <Label htmlFor="radio-disabled-compact">Compact</Label>
      </div>
    </RadioGroup>
  ),
};
