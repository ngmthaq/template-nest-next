import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta = {
  title: 'Shadcn/Tabs',
  component: Tabs,
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

function TabsDemo({ variant }: { variant: 'default' | 'line' }) {
  const [value, setValue] = useState('account');

  return (
    <Tabs value={value} onValueChange={setValue} className="w-96">
      <TabsList variant={variant}>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Update your account details here.</TabsContent>
      <TabsContent value="password">Change your password here.</TabsContent>
      <TabsContent value="settings">Manage your workspace settings here.</TabsContent>
    </Tabs>
  );
}

function TabsVerticalDemo() {
  const [value, setValue] = useState('overview');

  return (
    <Tabs value={value} onValueChange={setValue} orientation="vertical" className="w-96 flex-row">
      <TabsList className="h-fit flex-col">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">High-level summary of your workspace.</TabsContent>
      <TabsContent value="analytics">Traffic and usage analytics.</TabsContent>
      <TabsContent value="reports">Generated reports and exports.</TabsContent>
    </Tabs>
  );
}

export const Default: Story = {
  render: () => <TabsDemo variant="default" />,
};

export const Line: Story = {
  render: () => <TabsDemo variant="line" />,
};

export const Vertical: Story = {
  render: () => <TabsVerticalDemo />,
};
