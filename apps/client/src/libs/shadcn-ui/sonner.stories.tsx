import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { toast } from 'sonner';

import { Button } from './button';
import { Toaster } from './sonner';

const meta = {
  title: 'Shadcn/Sonner',
  component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <Toaster />
      <Button
        variant="outline"
        onClick={() =>
          toast('Event has been created', {
            description: 'Sunday, December 3rd at 9:00 AM',
          })
        }
      >
        Show toast
      </Button>
    </>
  ),
};

export const Variants: Story = {
  render: () => (
    <>
      <Toaster />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => toast.success('Changes saved successfully')}>
          Success
        </Button>
        <Button variant="outline" onClick={() => toast.info('New update available')}>
          Info
        </Button>
        <Button variant="outline" onClick={() => toast.warning('Storage is almost full')}>
          Warning
        </Button>
        <Button variant="outline" onClick={() => toast.error('Failed to save changes')}>
          Error
        </Button>
      </div>
    </>
  ),
};
