import type { Config } from 'tailwindcss';

/** Brand tokens from the Agre Hub toolkit (Konsept .1) + derived tokens from the PRD, Section 4. */
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        agre: {
          navy: '#121E2E',        // deep navy
          lime: '#E2EA99',        // dusty lime — CTAs, active tag; always with navy text
          olive: '#A1A27B',       // washed olive
          sage: '#7A7967',        // muted sage — borders, icons (not small text on light)
          ink: '#231F20',         // warm black — body text
          paper: '#F7F6F0',       // app background
          'lime-tint': '#F4F6DC', // selected rows, sector chips
          muted: '#66654F',       // secondary text, 5.5:1 on paper
        },
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
      },
    },
  },
} satisfies Config;
