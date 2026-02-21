'use client';

import { cn } from '@/lib/utils';
import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, type, onKeyDown, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    const [capsLock, setCapsLock] = useState(false);
    const isPassword = type === 'password';

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isPassword) setCapsLock(e.getModifierState('CapsLock'));
      onKeyDown?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            error ? 'border-red-500' : 'border-gray-300',
            className
          )}
          onKeyDown={handleKeyDown}
          {...props}
        />
        {isPassword && capsLock && (
          <p className="mt-1 text-xs text-amber-600">Caps Lock이 켜져 있습니다</p>
        )}
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
