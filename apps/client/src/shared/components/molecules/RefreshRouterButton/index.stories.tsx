import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { RefreshRouterButton } from '.';

const meta = {
  title: 'Molecules/RefreshRouterButton',
  component: RefreshRouterButton,
} satisfies Meta<typeof RefreshRouterButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Refresh',
  },
};
