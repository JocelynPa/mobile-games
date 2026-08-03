import { CandyColor } from '../engine/types';

export interface CandyTheme {
  gradient: [string, string];
  glyph: string;
  glow: string;
}

export const CANDY_THEME: Record<CandyColor, CandyTheme> = {
  red: { gradient: ['#FF8A8A', '#E63950'], glyph: '♥', glow: '#FF4D67' },
  orange: { gradient: ['#FFC26B', '#FF7A18'], glyph: '★', glow: '#FF9432' },
  yellow: { gradient: ['#FFF0A0', '#FFC300'], glyph: '◆', glow: '#FFD93D' },
  green: { gradient: ['#B0F5B0', '#2FAE60'], glyph: '▲', glow: '#4CD671' },
  blue: { gradient: ['#9FE6FF', '#2E86DE'], glyph: '✦', glow: '#4FC3F7' },
  purple: { gradient: ['#E3B8FF', '#8E44AD'], glyph: '❖', glow: '#B368E0' },
};

export interface WorldTheme {
  name: string;
  background: [string, string, string];
  panel: string;
  accent: string;
}

export const WORLD_THEMES: WorldTheme[] = [
  {
    name: 'Sucré Rose',
    background: ['#FFD1E8', '#FF9AD5', '#B57EDC'],
    panel: 'rgba(255,255,255,0.85)',
    accent: '#FF4D9D',
  },
  {
    name: 'Menthe Fraîche',
    background: ['#CFFFF4', '#7BE0AD', '#2FAE83'],
    panel: 'rgba(255,255,255,0.85)',
    accent: '#12A876',
  },
  {
    name: 'Agrumes Dorés',
    background: ['#FFF3B0', '#FFD36E', '#FF9A56'],
    panel: 'rgba(255,255,255,0.88)',
    accent: '#FF7A18',
  },
  {
    name: 'Nuit Étoilée',
    background: ['#2B1055', '#6A3AC1', '#D76D9A'],
    panel: 'rgba(255,255,255,0.9)',
    accent: '#8E44AD',
  },
];

export const UI = {
  bgDeep: '#3A1C71',
  textDark: '#3A2352',
  textLight: '#FFFFFF',
  gold: '#FFC300',
  success: '#2FAE60',
  danger: '#E63950',
  shadow: '#00000055',
};
