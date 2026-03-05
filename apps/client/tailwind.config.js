/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
          elevated: 'hsl(var(--card-elevated) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
          dim: 'hsl(var(--muted-foreground-dim) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
          green: 'hsl(var(--accent-green) / <alpha-value>)',
          'green-muted': 'hsl(var(--accent-green-muted) / <alpha-value>)',
          'green-dim': 'hsl(var(--accent-green-dim) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'hsl(var(--border) / <alpha-value>)',
          hover: 'hsl(var(--border-hover) / <alpha-value>)',
        },
        input: {
          DEFAULT: 'hsl(var(--input) / <alpha-value>)',
          focus: 'hsl(var(--input-focus) / <alpha-value>)',
        },
        ring: 'hsl(var(--ring) / <alpha-value>)',
        status: {
          success: 'hsl(var(--status-success) / <alpha-value>)',
          'success-foreground': 'hsl(var(--status-success-foreground) / <alpha-value>)',
          active: 'hsl(var(--status-active) / <alpha-value>)',
          warning: 'hsl(var(--status-warning) / <alpha-value>)',
          error: 'hsl(var(--status-error) / <alpha-value>)',
        },
        trace: {
          bg: 'hsl(var(--trace-bg) / <alpha-value>)',
          border: 'hsl(var(--trace-border) / <alpha-value>)',
          header: 'hsl(var(--trace-header) / <alpha-value>)',
        }
      },
      borderRadius: {
        xl: 'var(--radius-xl)',
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
        xs: 'var(--radius-xs)',
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      }
    },
  },
  plugins: [],
}