import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { Calendar } from './calendar';

const meta = {
  title: 'Shadcn/Calendar',
  component: Calendar,
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

function CalendarDemo() {
  const [selected, setSelected] = useState<Date | undefined>(new Date(2026, 7, 20));

  return (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={setSelected}
      className="rounded-lg border"
    />
  );
}

function CalendarRangeDemo() {
  const [selected, setSelected] = useState<DateRange | undefined>({
    from: new Date(2026, 7, 10),
    to: new Date(2026, 7, 17),
  });

  return (
    <Calendar
      mode="range"
      selected={selected}
      onSelect={setSelected}
      className="rounded-lg border"
    />
  );
}

export const Default: Story = {
  render: () => <CalendarDemo />,
};

export const Range: Story = {
  render: () => <CalendarRangeDemo />,
};
