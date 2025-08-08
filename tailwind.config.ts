import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

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
			spacing: {
				'safe-top': 'env(safe-area-inset-top)',
				'safe-bottom': 'env(safe-area-inset-bottom)',
				'safe-left': 'env(safe-area-inset-left)',
				'safe-right': 'env(safe-area-inset-right)',
			},
			padding: {
				'safe-top': 'env(safe-area-inset-top)',
				'safe-bottom': 'env(safe-area-inset-bottom)',
				'safe-left': 'env(safe-area-inset-left)',
				'safe-right': 'env(safe-area-inset-right)',
			},
			margin: {
				'safe-top': 'env(safe-area-inset-top)',
				'safe-bottom': 'env(safe-area-inset-bottom)',
				'safe-left': 'env(safe-area-inset-left)',
				'safe-right': 'env(safe-area-inset-right)',
			},
			colors: {
				// Shadcn/ui colors
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
				// Game-specific color palette
				'game-primary': '#8b5cf6',
				'game-secondary': '#ec4899', 
				'game-accent': '#06b6d4',
				'game-success': '#10b981',
				'game-warning': '#f59e0b',
				'game-error': '#ef4444',
				'game-text': {
					primary: '#ffffff',
					secondary: '#e2e8f0',
					muted: '#94a3b8',
					dark: '#1e293b'
				},
				'game-bg': {
					primary: '#0f172a',
					secondary: '#1e293b',
					card: 'rgba(30, 41, 59, 0.8)'
				}
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
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-20px)' }
				},
				'float-slow': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-30px)' }
				},
				'pulse-slow': {
					'0%, 100%': { opacity: '0.3' },
					'50%': { opacity: '0.7' }
				},
				'shimmer': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' }
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-in-down': {
					'0%': { opacity: '0', transform: 'translateY(-20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				// Game-specific animations
				'epic-timeline-enter': {
					'0%': {
						opacity: '0',
						transform: 'translateX(-100vw) scale(0.3) rotateY(-90deg)',
						filter: 'blur(20px)'
					},
					'30%': {
						opacity: '0.3',
						transform: 'translateX(-20vw) scale(0.7) rotateY(-30deg)',
						filter: 'blur(10px)'
					},
					'70%': {
						opacity: '0.8',
						transform: 'translateX(5vw) scale(1.1) rotateY(10deg)',
						filter: 'blur(3px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0) scale(1) rotateY(0deg)',
						filter: 'blur(0px)'
					}
				},
				'epic-card-drop': {
					'0%': {
						transform: 'scale(0.3) translateY(-200px) rotateZ(-45deg)',
						opacity: '0',
						filter: 'blur(15px)'
					},
					'60%': {
						transform: 'scale(0.95) translateY(-15px) rotateZ(-5deg)',
						opacity: '1',
						filter: 'blur(1px)'
					},
					'100%': {
						transform: 'scale(1) translateY(0) rotateZ(0deg)',
						opacity: '1',
						filter: 'blur(0px)'
					}
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.9)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'bounce-in': {
					'0%': { opacity: '0', transform: 'scale(0.3)' },
					'50%': { opacity: '1', transform: 'scale(1.05)' },
					'70%': { transform: 'scale(0.9)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'slide-in-left': {
					'0%': { opacity: '0', transform: 'translateX(-50px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' }
				},
				'slide-in-right': {
					'0%': { opacity: '0', transform: 'translateX(50px)' },
					'100%': { opacity: '1', transform: 'translateX(0)' }
				},
				'glow-pulse': {
					'0%, 100%': { boxShadow: '0 0 20px rgba(16, 119, 147, 0.3)' },
					'50%': { boxShadow: '0 0 40px rgba(16, 119, 147, 0.8)' }
				},
				'card-hover': {
					'0%': { transform: 'translateY(0) scale(1)' },
					'100%': { transform: 'translateY(-5px) scale(1.02)' }
				},
				'spin-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
				'wiggle': {
					'0%, 100%': { transform: 'rotate(-3deg)' },
					'50%': { transform: 'rotate(3deg)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 6s ease-in-out infinite',
				'float-slow': 'float-slow 8s ease-in-out infinite',
				'pulse-slow': 'pulse-slow 6s ease-in-out infinite',
				'shimmer': 'shimmer 2s linear infinite',
				'fade-in-up': 'fade-in-up 0.6s ease-out',
				'fade-in-down': 'fade-in-down 0.6s ease-out',
				'scale-in': 'scale-in 0.4s ease-out',
				'bounce-in': 'bounce-in 0.6s ease-out',
				'slide-in-left': 'slide-in-left 0.6s ease-out',
				'slide-in-right': 'slide-in-right 0.6s ease-out',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'card-hover': 'card-hover 0.3s ease-out forwards',
				'spin-slow': 'spin-slow 20s linear infinite',
				'wiggle': 'wiggle 1s ease-in-out infinite',
				// Game-specific animations
				'epic-timeline-enter': 'epic-timeline-enter 2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
				'epic-card-drop': 'epic-card-drop 2.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
