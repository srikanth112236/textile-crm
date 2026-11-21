import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge cannot know about the custom type scale in tailwind.config.js,
 * so `text-body` (a font size) was being treated as a text *colour* and would
 * strip a real colour class like `text-primary-foreground` — which made button
 * labels render in the wrong colour. Registering the scale fixes it globally.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'h1', 'h2', 'body', 'label', 'caption'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
