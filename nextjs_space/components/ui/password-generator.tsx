'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Copy, Eye, EyeOff, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PasswordGeneratorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export function PasswordGenerator({ value, onChange, label = 'Contraseña', required = false }: PasswordGeneratorProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{};\':"|,.<>/?';
    const allChars = uppercase + lowercase + numbers + special;

    let password = '';
    // Asegurar al menos un carácter de cada tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Completar hasta 16 caracteres
    for (let i = password.length; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Mezclar los caracteres
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    onChange(password);
    toast.success('Contraseña segura generada');
  };

  const copyToClipboard = async () => {
    if (value) {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success('Contraseña copiada al portapapeles');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Error al copiar contraseña');
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="password">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Introduce o genera una contraseña segura"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={generatePassword}
          title="Generar contraseña segura"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          disabled={!value}
          title="Copiar contraseña"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      {value && (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className={`h-2 flex-1 rounded-full ${
              value.length >= 12 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)
                ? 'bg-green-500'
                : value.length >= 8 ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-muted-foreground">
              {value.length >= 12 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)
                ? 'Segura' : value.length >= 8 ? 'Media' : 'Débil'}
            </span>
          </div>
          <p className="text-muted-foreground">
            La contraseña debe contener: mayúsculas, minúsculas, números y caracteres especiales (min. 8 caracteres)
          </p>
        </div>
      )}
    </div>
  );
}
