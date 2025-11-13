"use client";

/**
 * Color picker component for selecting hex colors
 */

import { useState } from "react";

interface ColorPickerProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function ColorPicker({ label, value = "#000000", onChange, required }: ColorPickerProps) {
  const [hexValue, setHexValue] = useState(value);

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHexValue(newValue);
    onChange(newValue);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHexValue(newValue);
    
    // Validate hex format
    if (/^#[0-9A-Fa-f]{0,6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={hexValue}
            onChange={handleColorInputChange}
            className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
        </div>
        <input
          type="text"
          value={hexValue}
          onChange={handleHexInputChange}
          placeholder="#000000"
          pattern="^#[0-9A-Fa-f]{6}$"
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 font-mono"
        />
        <div
          className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: hexValue }}
        />
      </div>
    </div>
  );
}

