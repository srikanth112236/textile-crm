import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    // NOTE: listing `screens` here REPLACES Tailwind's defaults, so every
    // breakpoint must be repeated. Declaring only 2xl produced a `.container`
    // with `max-width: none` below 1400px — the storefront then stretched
    // edge-to-edge and the rounded hero card lost its frame.
    container: {
      center: true,
      padding: '2rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // P0 editorial tokens. Channels live in globals.css so the
        // `/opacity` modifier keeps working.
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
          subtle: 'rgb(var(--color-ink-subtle) / <alpha-value>)',
        },
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        sand: {
          DEFAULT: 'rgb(var(--color-sand) / <alpha-value>)',
          deep: 'rgb(var(--color-sand-deep) / <alpha-value>)',
        },
        line: 'rgb(var(--color-line) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          strong: 'rgb(var(--color-brand-strong) / <alpha-value>)',
          soft: 'rgb(var(--color-brand-soft) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          soft: 'rgb(var(--color-success-soft) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          soft: 'rgb(var(--color-danger-soft) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Slow push-in on the active hero photo (was only applied to slide 1).
        'hero-kenburns': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.08)' },
        },
        // Entrance for the hero copy each time a slide becomes active.
        'hero-rise': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Infinite marquee for the announcement bar (track is duplicated 2x,
        // so -50% lands exactly on the start of the second copy).
        marquee: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(-50%, 0, 0)' },
        },
        meteor: {
          '0%': { transform: 'rotate(215deg) translateX(0)', opacity: '1' },
          '70%': { opacity: '1' },
          '100%': {
            transform: 'rotate(215deg) translateX(-500px)',
            opacity: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'hero-rise': 'hero-rise 600ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        marquee: 'marquee 38s linear infinite',
        meteor: 'meteor 5s linear infinite',
      },
      fontSize: {
        base: ['1rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        // P0 semantic scale. Existing utilities are untouched; new work
        // should use these names so sizes stop being invented per component.
        display: ['clamp(2rem, 5vw, 3.625rem)', { lineHeight: '1.04', letterSpacing: '-0.035em', fontWeight: '800' }],
        hero: ['clamp(1.75rem, 4vw, 2.75rem)', { lineHeight: '1.08', letterSpacing: '-0.03em', fontWeight: '800' }],
        h1: ['clamp(1.5rem, 3vw, 2rem)', { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '800' }],
        h2: ['1.4375rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '800' }],
        h3: ['1rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '750' }],
        label: ['0.6875rem', { lineHeight: '1.35', letterSpacing: '0.08em', fontWeight: '800' }],
        micro: ['0.625rem', { lineHeight: '1.3', letterSpacing: '0.06em', fontWeight: '800' }],
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;

