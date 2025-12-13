import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@/components/ui/badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Destructive',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-green-500">Activo</Badge>
      <Badge className="bg-yellow-500">Pendiente</Badge>
      <Badge className="bg-red-500">Vencido</Badge>
      <Badge className="bg-blue-500">En Proceso</Badge>
      <Badge className="bg-gray-500">Cancelado</Badge>
    </div>
  ),
};

export const RoleBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="destructive">Super Admin</Badge>
      <Badge variant="default">Admin</Badge>
      <Badge variant="secondary">Gestor</Badge>
      <Badge variant="outline">Inquilino</Badge>
    </div>
  ),
};
