import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
	
	// screens: {
	// 	xs: "480px",
	// 	ss: "620px",
	// 	sm: "768px",
	// 	md: "1060px",
	// 	lg: "1200px",
	// 	xl: "1700px",
	//   },
	//   maxWidth: {
	// 	container: "1440px",
	// 	contentContainer: "1140px",
	// 	containerSmall: "1024px",
	//   },
	  container: {
		center: true,
		padding: "2rem",
	  },
	  
  	extend: {
		backgroundImage: {
        'gradient-to-r': 'linear-gradient(to right, var(--tw-gradient-stops))',
      },
  		colors: {
        brand: {
          '50': '#f0faf3',
          '100': '#daf3e2',
          '200': '#b7e6c8',
          '300': '#86d3a5',
          '400': '#4eb87c',
          '500': '#2b9d5f',
          '600': '#188049',
          '700': '#12663c',
          '800': '#0f5132',
          '900': '#0c3f28',
          '950': '#052316'
        },
        leaf: {
          '400': '#9ad14f',
          '500': '#7cc243',
          '600': '#63a531'
        },
        gold: {
          '400': '#f5be4d',
          '500': '#eda92f',
          '600': '#cf8a17'
        },
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
		  fontFamily: {
			header: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
			subtext: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
			alt: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
		  },
		keyframes: {
			'caret-blink': {
				'0%,70%,100%': { opacity: '1' },
				'20%,50%': { opacity: '0' }
			}
		},
		animation: {
			'caret-blink': 'caret-blink 1.25s ease-out infinite'
		},
		boxShadow: {
			card: '0 1px 2px rgba(12,63,40,0.06)',
			dropdown: '0 6px 24px -8px rgba(12,63,40,0.25)'
		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
//   plugins: [require("tailwindcss-animate")],
} satisfies Config;
