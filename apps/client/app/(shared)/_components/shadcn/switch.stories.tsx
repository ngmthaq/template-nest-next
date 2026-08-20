'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { Label } from './label';
import { Switch } from './switch';

function ControlledSwitchDemo() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Switch id="switch-controlled" checked={checked} onCheckedChange={setChecked} />
      <Label htmlFor="switch-controlled">{checked ? 'On' : 'Off'}</Label>
    </div>
  );
}

const meta = {
  title: 'Shadcn/Switch',
  component: Switch,
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Controlled: Story = {
  render: () => <ControlledSwitchDemo />,
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Switch id="switch-sm" size="sm" defaultChecked />
        <Label htmlFor="switch-sm">Small</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="switch-default" size="default" defaultChecked />
        <Label htmlFor="switch-default">Default</Label>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="switch-disabled" disabled />
      <Label htmlFor="switch-disabled">Unavailable</Label>
    </div>
  ),
};
