import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { HealthStatusPanel } from '.';

const meta = {
  title: 'Organisms/HealthStatusPanel',
  component: HealthStatusPanel,
} satisfies Meta<typeof HealthStatusPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ok: Story = {
  args: {
    report: {
      status: 'ok',
      info: {
        server: { status: 'up', uptime: 123.45 },
        mysql: { status: 'up' },
        redis: { status: 'up' },
      },
    },
  },
};

export const Degraded: Story = {
  args: {
    report: {
      status: 'error',
      info: {
        server: { status: 'up', uptime: 987.65 },
        mysql: { status: 'down', error: 'connect ECONNREFUSED 127.0.0.1:3306' },
        redis: { status: 'up' },
      },
    },
  },
};

export const Unreachable: Story = {
  args: {
    report: null,
  },
};
