import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button } from './button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';

const meta = {
  title: 'Shadcn/HoverCard',
  component: HoverCard,
} satisfies Meta<typeof HoverCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@shadcn</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="font-medium">@shadcn</p>
        <p className="text-muted-foreground">
          Built with React, Radix UI and Tailwind CSS. Hover over the trigger to see this card.
        </p>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const Open: Story = {
  render: () => (
    <HoverCard open>
      <HoverCardTrigger asChild>
        <Button variant="link">@shadcn</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="font-medium">@shadcn</p>
        <p className="text-muted-foreground">
          Built with React, Radix UI and Tailwind CSS. This card is force-opened via the `open`
          prop.
        </p>
      </HoverCardContent>
    </HoverCard>
  ),
};
