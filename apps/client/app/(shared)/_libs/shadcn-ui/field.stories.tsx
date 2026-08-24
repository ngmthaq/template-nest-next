'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { Checkbox } from './checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from './field';
import { Input } from './input';
import { Switch } from './switch';

function InvalidFieldDemo() {
  const [email, setEmail] = useState('not-an-email');
  const isInvalid = !email.includes('@');

  return (
    <Field className="w-80" data-invalid={isInvalid}>
      <FieldLabel htmlFor="field-email">Email</FieldLabel>
      <Input
        id="field-email"
        value={email}
        aria-invalid={isInvalid}
        onChange={(event) => setEmail(event.target.value)}
      />
      <FieldError errors={isInvalid ? [{ message: 'Enter a valid email address.' }] : []} />
    </Field>
  );
}

const meta = {
  title: 'Shadcn/Field',
  component: Field,
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: () => (
    <Field className="w-80" orientation="vertical">
      <FieldLabel htmlFor="field-vertical-name">Name</FieldLabel>
      <Input id="field-vertical-name" placeholder="Ada Lovelace" />
      <FieldDescription>This is your public display name.</FieldDescription>
    </Field>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Field className="w-80" orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor="field-horizontal-notifications">Email notifications</FieldLabel>
        <FieldDescription>Receive updates about your account activity.</FieldDescription>
      </FieldContent>
      <Switch id="field-horizontal-notifications" defaultChecked />
    </Field>
  ),
};

export const Responsive: Story = {
  render: () => (
    <FieldGroup className="w-80">
      <Field orientation="responsive">
        <FieldContent>
          <FieldLabel htmlFor="field-responsive-marketing">Marketing emails</FieldLabel>
          <FieldDescription>Product news, tips and offers.</FieldDescription>
        </FieldContent>
        <Switch id="field-responsive-marketing" />
      </Field>
    </FieldGroup>
  ),
};

export const Invalid: Story = {
  render: () => <InvalidFieldDemo />,
};

export const CardStyle: Story = {
  render: () => (
    <FieldLabel htmlFor="field-card-checkbox" className="w-80">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Enable notifications</FieldTitle>
          <FieldDescription>Get notified when someone comments on your posts.</FieldDescription>
        </FieldContent>
        <Checkbox id="field-card-checkbox" defaultChecked />
      </Field>
    </FieldLabel>
  ),
};

export const FieldSetWithLegend: Story = {
  render: () => (
    <FieldSet className="w-80">
      <FieldLegend>Contact details</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-set-name">Name</FieldLabel>
          <Input id="field-set-name" placeholder="Ada Lovelace" />
        </Field>
        <FieldSeparator>Or</FieldSeparator>
        <Field>
          <FieldLabel htmlFor="field-set-email">Email</FieldLabel>
          <Input id="field-set-email" type="email" placeholder="ada@example.com" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};
