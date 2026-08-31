import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MailIcon, SearchIcon } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from './input-group';
import { Label } from './label';

const meta = {
  title: 'Shadcn/InputGroup',
  component: InputGroup,
} satisfies Meta<typeof InputGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="input-group-search">Search</Label>
      <InputGroup className="w-72">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput id="input-group-search" placeholder="Search the docs..." />
      </InputGroup>
    </div>
  ),
};

export const AddonAlignments: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="input-group-inline-end">Email</Label>
        <InputGroup className="w-72">
          <InputGroupInput id="input-group-inline-end" placeholder="you@example.com" />
          <InputGroupAddon align="inline-end">
            <MailIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="input-group-block-start">Message</Label>
        <InputGroup className="w-72">
          <InputGroupAddon align="block-start">
            <InputGroupText>To: support@example.com</InputGroupText>
          </InputGroupAddon>
          <InputGroupTextarea id="input-group-block-start" placeholder="Type your message..." />
          <InputGroupAddon align="block-end">
            <InputGroupButton size="sm">Send</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  ),
};

export const ButtonSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="input-group-button-sizes">Amount</Label>
      <InputGroup className="w-72">
        <InputGroupInput id="input-group-button-sizes" placeholder="0.00" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="xs">xs</InputGroupButton>
          <InputGroupButton size="sm">sm</InputGroupButton>
          <InputGroupButton size="icon-xs" aria-label="Decrease">
            <SearchIcon />
          </InputGroupButton>
          <InputGroupButton size="icon-sm" aria-label="Increase">
            <SearchIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};
