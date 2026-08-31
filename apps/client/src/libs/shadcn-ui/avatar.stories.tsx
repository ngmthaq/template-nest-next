import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from './avatar';

const meta = {
  title: 'Shadcn/Avatar',
  component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="Shadcn avatar" />
      <AvatarFallback>SC</AvatarFallback>
    </Avatar>
  ),
};

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://broken-image-url.invalid/avatar.png" alt="Jane Doe avatar" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar size="sm">
        <AvatarImage src="https://github.com/shadcn.png" alt="Shadcn avatar, small" />
        <AvatarFallback>SC</AvatarFallback>
      </Avatar>
      <Avatar size="default">
        <AvatarImage src="https://github.com/shadcn.png" alt="Shadcn avatar, default" />
        <AvatarFallback>SC</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarImage src="https://github.com/shadcn.png" alt="Shadcn avatar, large" />
        <AvatarFallback>SC</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="Shadcn avatar" />
      <AvatarFallback>SC</AvatarFallback>
      <AvatarBadge />
    </Avatar>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="Shadcn avatar" />
        <AvatarFallback>SC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>AK</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  ),
};
