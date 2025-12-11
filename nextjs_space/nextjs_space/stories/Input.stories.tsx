import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search as SearchIcon, Mail, Lock } from 'lucide-react';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'date', 'search'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Ingrese texto...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'correo@ejemplo.com',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Contraseña',
  },
};

export const SearchInput: Story = {
  args: {
    type: 'search',
    placeholder: 'Buscar...',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: '0',
  },
};

export const Date: Story = {
  args: {
    type: 'date',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Deshabilitado',
    disabled: true,
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className="relative w-full max-w-sm">
      <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <Input placeholder="Buscar..." className="pl-8" />
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" placeholder="Juan Pérez" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email2">Email</Label>
        <div className="relative">
          <Mail className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input id="email2" type="email" placeholder="juan@ejemplo.com" className="pl-8" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password2">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input id="password2" type="password" placeholder="••••••••" className="pl-8" />
        </div>
      </div>
    </div>
  ),
};
