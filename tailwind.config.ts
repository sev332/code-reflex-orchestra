import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// WisdomNET Neural Colors
				neural: 'hsl(var(--wisdom-neural))',
				'data-flow': 'hsl(var(--wisdom-data-flow))',
				'agent-active': 'hsl(var(--wisdom-agent-active))',
				'wisdom-memory': 'hsl(var(--wisdom-memory))',
				'wisdom-success': 'hsl(var(--wisdom-success))',
				'wisdom-warning': 'hsl(var(--wisdom-warning))'
			},
			backgroundImage: {
				'gradient-neural': 'var(--gradient-neural)',
				'gradient-data-flow': 'var(--gradient-data-flow)',
				'gradient-mind': 'var(--gradient-mind)',
				'gradient-electric': 'var(--gradient-electric)'
			},
			boxShadow: {
				'neural': 'var(--shadow-neural)',
				'glow': 'var(--shadow-glow)',
				'data': 'var(--shadow-data)'
			},
			fontFamily: {
				'neural': 'var(--font-neural)',
				'interface': 'var(--font-interface)'
			},
			transitionTimingFunction: {
				'neural': 'cubic-bezier(0.4, 0, 0.2, 1)',
				'data-flow': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				// Neural Network Animations
				'neural-pulse': {
					'0%, 100%': {
						opacity: '0.5',
						transform: 'scale(1)'
					},
					'50%': {
						opacity: '1',
						transform: 'scale(1.05)'
					}
				},
				'data-flow': {
					'0%': {
						transform: 'translateX(-100%)',
						opacity: '0'
					},
					'50%': {
						opacity: '1'
					},
					'100%': {
						transform: 'translateX(100%)',
						opacity: '0'
					}
				},
				'neural-glow': {
					'0%, 100%': {
						boxShadow: '0 0 5px hsl(var(--primary))'
					},
					'50%': {
						boxShadow: '0 0 20px hsl(var(--primary)), 0 0 30px hsl(var(--primary))'
					}
				},
				'mind-expand': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'agent-think': {
					'0%, 100%': {
						transform: 'rotate(0deg) scale(1)'
					},
					'25%': {
						transform: 'rotate(5deg) scale(1.02)'
					},
					'75%': {
						transform: 'rotate(-5deg) scale(1.02)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'neural-pulse': 'neural-pulse 2s ease-in-out infinite',
				'data-flow': 'data-flow 3s ease-in-out infinite',
				'neural-glow': 'neural-glow 2s ease-in-out infinite',
				'mind-expand': 'mind-expand 0.5s ease-out',
				'agent-think': 'agent-think 1s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
