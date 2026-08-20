'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from './input-otp';
import { Label } from './label';

function ControlledInputOTPDemo() {
  const [value, setValue] = useState('');

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="otp-demo">One-time passcode</Label>
      <InputOTP id="otp-demo" maxLength={6} value={value} onChange={setValue}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-sm text-muted-foreground">Value: {value || '—'}</p>
    </div>
  );
}

const meta = {
  title: 'Shadcn/InputOtp',
  component: InputOTP,
  args: {
    maxLength: 6,
    children: null,
  },
} satisfies Meta<typeof InputOTP>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Controlled: Story = {
  render: () => <ControlledInputOTPDemo />,
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="otp-disabled">One-time passcode</Label>
      <InputOTP id="otp-disabled" maxLength={4} disabled>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  ),
};
