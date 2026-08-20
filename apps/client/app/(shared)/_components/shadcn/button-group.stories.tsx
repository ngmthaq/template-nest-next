import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button } from './button';
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from './button-group';

const meta = {
  title: 'Shadcn/ButtonGroup',
  component: ButtonGroup,
} satisfies Meta<typeof ButtonGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">Copy</Button>
      <Button variant="outline">Edit</Button>
      <Button variant="outline">Delete</Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical" className="w-40">
      <Button variant="outline">Copy</Button>
      <Button variant="outline">Edit</Button>
      <Button variant="outline">Delete</Button>
    </ButtonGroup>
  ),
};

export const WithTextAndSeparator: Story = {
  render: () => (
    <ButtonGroup>
      <ButtonGroupText>Page 1 of 10</ButtonGroupText>
      <ButtonGroupSeparator />
      <Button variant="outline">Previous</Button>
      <Button variant="outline">Next</Button>
    </ButtonGroup>
  ),
};
