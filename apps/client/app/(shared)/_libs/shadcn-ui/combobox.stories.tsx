'use client';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from './combobox';
import { Label } from './label';

const frameworks = ['Next.js', 'Remix', 'Astro', 'SvelteKit', 'Nuxt', 'SolidStart'];

function ControlledComboboxDemo() {
  const [value, setValue] = useState<string | null>('Next.js');

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="combobox-framework">Framework</Label>
      <Combobox items={frameworks} value={value} onValueChange={setValue}>
        <ComboboxInput id="combobox-framework" placeholder="Search frameworks..." />
        <ComboboxContent>
          <ComboboxEmpty>No framework found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

function MultipleComboboxDemo() {
  const [value, setValue] = useState<string[]>(['Next.js']);
  const anchor = useComboboxAnchor();

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="combobox-frameworks">Frameworks</Label>
      <Combobox items={frameworks} value={value} onValueChange={setValue} multiple>
        <ComboboxChips ref={anchor}>
          {value.map((item) => (
            <ComboboxChip key={item}>{item}</ComboboxChip>
          ))}
          <ComboboxChipsInput id="combobox-frameworks" placeholder="Add a framework..." />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No framework found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

const meta = {
  title: 'Shadcn/Combobox',
  component: Combobox,
} satisfies Meta<typeof Combobox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ControlledComboboxDemo />,
};

export const Multiple: Story = {
  render: () => <MultipleComboboxDemo />,
};
