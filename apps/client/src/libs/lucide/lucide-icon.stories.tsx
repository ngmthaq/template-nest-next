import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Bell, Check, Heart, icons, type LucideIcon, Search, Settings, Trash2 } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';

import { Input } from '@/libs/shadcn-ui/input';
import { Typography } from '@/libs/shadcn-ui/typography';

const iconEntries = Object.entries(icons) as [string, LucideIcon][];

type LucideIconGalleryProps = {
  query?: string;
  size?: number;
  strokeWidth?: number;
  iconClassName?: string;
};

function LucideIconGallery({
  query = '',
  size = 24,
  strokeWidth = 2,
  iconClassName,
}: LucideIconGalleryProps) {
  const [search, setSearch] = useState(query);
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const matches = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    if (!needle) return iconEntries;

    return iconEntries.filter(([name]) => name.toLowerCase().includes(needle));
  }, [deferredSearch]);

  const copyName = (name: string) => {
    setCopiedName(name);
    void navigator.clipboard?.writeText(name).catch(() => undefined);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search icons…"
          aria-label="Search icons"
          className="max-w-xs"
        />
        <Typography variant="muted">
          {matches.length} of {iconEntries.length} icons
        </Typography>
        {copiedName ? <Typography variant="muted">Copied “{copiedName}”</Typography> : null}
      </div>

      {matches.length === 0 ? (
        <Typography variant="muted">No icon name contains “{deferredSearch.trim()}”.</Typography>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
          {matches.map(([name, Icon]) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => copyName(name)}
                title={`${name} — click to copy`}
                className="flex size-full flex-col items-center gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Icon size={size} strokeWidth={strokeWidth} className={iconClassName} aria-hidden />
                <span className="w-full truncate text-center text-xs text-muted-foreground">
                  {name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const meta = {
  title: 'Icons/Lucide',
  component: LucideIconGallery,
  parameters: {
    layout: 'padded',
    a11y: { disable: true },
  },
  render: (args) => <LucideIconGallery key={args.query} {...args} />,
  argTypes: {
    query: { control: 'text' },
    size: { control: { type: 'range', min: 12, max: 64, step: 2 } },
    strokeWidth: { control: { type: 'range', min: 0.5, max: 3, step: 0.25 } },
    iconClassName: { control: 'text' },
  },
  args: {
    query: '',
    size: 24,
    strokeWidth: 2,
  },
} satisfies Meta<typeof LucideIconGallery>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {};

export const Filtered: Story = { args: { query: 'arrow' } };

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {[16, 20, 24, 32, 48].map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Settings size={size} aria-hidden />
          <span className="text-xs text-muted-foreground">{size}px</span>
        </div>
      ))}
    </div>
  ),
};

export const StrokeWidths: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {[1, 1.5, 2, 2.5, 3].map((strokeWidth) => (
        <div key={strokeWidth} className="flex flex-col items-center gap-2">
          <Heart size={32} strokeWidth={strokeWidth} aria-hidden />
          <span className="text-xs text-muted-foreground">{strokeWidth}</span>
        </div>
      ))}
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Bell className="text-foreground" aria-hidden />
      <Search className="text-muted-foreground" aria-hidden />
      <Check className="text-primary" aria-hidden />
      <Trash2 className="text-destructive" aria-hidden />
    </div>
  ),
};
