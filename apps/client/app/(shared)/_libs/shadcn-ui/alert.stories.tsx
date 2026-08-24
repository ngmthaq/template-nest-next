import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AlertTriangleIcon, CheckCircle2Icon } from 'lucide-react';

import { Alert, AlertAction, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';

const meta = {
  title: 'Shadcn/Alert',
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert className="w-96">
      <CheckCircle2Icon />
      <AlertTitle>Changes saved</AlertTitle>
      <AlertDescription>Your profile has been updated successfully.</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive" className="w-96">
      <AlertTriangleIcon />
      <AlertTitle>Unable to process payment</AlertTitle>
      <AlertDescription>Please verify your billing details and try again.</AlertDescription>
    </Alert>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Alert className="w-96">
      <CheckCircle2Icon />
      <AlertTitle>New version available</AlertTitle>
      <AlertDescription>Update the app to get the latest features.</AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">
          Update
        </Button>
      </AlertAction>
    </Alert>
  ),
};
