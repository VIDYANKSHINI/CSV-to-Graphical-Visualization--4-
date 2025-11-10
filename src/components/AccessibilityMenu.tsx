import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Accessibility, Type, Contrast, ZoomIn } from 'lucide-react';

interface AccessibilityMenuProps {
  darkMode: boolean;
  onDarkModeChange: (enabled: boolean) => void;
}

export function AccessibilityMenu({ darkMode, onDarkModeChange }: AccessibilityMenuProps) {
  const [fontSize, setFontSize] = useState(100);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const handleFontSizeChange = (value: number[]) => {
    const size = value[0];
    setFontSize(size);
    document.documentElement.style.fontSize = `${(16 * size) / 100}px`;
  };

  const handleReducedMotion = (enabled: boolean) => {
    setReducedMotion(enabled);
    if (enabled) {
      document.documentElement.style.setProperty('--motion-duration', '0s');
    } else {
      document.documentElement.style.removeProperty('--motion-duration');
    }
  };

  const handleHighContrast = (enabled: boolean) => {
    setHighContrast(enabled);
    if (enabled) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Accessibility settings"
        >
          <Accessibility className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="rounded-l-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Accessibility className="w-5 h-5 text-blue-600" />
            Accessibility
          </SheetTitle>
          <SheetDescription>
            Customize the interface to meet your needs
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Dark Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex items-center gap-2">
                <Contrast className="w-4 h-4" />
                Dark Mode
              </Label>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={onDarkModeChange}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Reduce eye strain in low-light environments
            </p>
          </div>

          {/* Font Size */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Font Size: {fontSize}%
            </Label>
            <Slider
              value={[fontSize]}
              onValueChange={handleFontSizeChange}
              min={80}
              max={150}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Smaller</span>
              <span>Larger</span>
            </div>
          </div>

          {/* Reduced Motion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reduced-motion" className="flex items-center gap-2">
                <ZoomIn className="w-4 h-4" />
                Reduce Motion
              </Label>
              <Switch
                id="reduced-motion"
                checked={reducedMotion}
                onCheckedChange={handleReducedMotion}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Minimize animations and transitions
            </p>
          </div>

          {/* High Contrast */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="high-contrast" className="flex items-center gap-2">
                <Contrast className="w-4 h-4" />
                High Contrast
              </Label>
              <Switch
                id="high-contrast"
                checked={highContrast}
                onCheckedChange={handleHighContrast}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Increase color contrast for better visibility
            </p>
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl"
          >
            <h4 className="text-sm mb-2 text-blue-900 dark:text-blue-100">
              Keyboard Navigation
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border rounded">?</kbd> to view all keyboard shortcuts
            </p>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
