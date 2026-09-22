import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { HealthReportFallback } from '.';

const meta = {
  title: 'Routes/Health/HealthReportFallback',
  component: HealthReportFallback,
} satisfies Meta<typeof HealthReportFallback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
