export interface SoftPalette {
  accent: string
  accentStrong: string
  tint: string
  tintStrong: string
  border: string
  text: string
}

export const BRAND_COLORS = {
  primary: '#0A84FF',
  primaryStrong: '#0071E3',
  secondary: '#5AC8FA',
  secondaryStrong: '#32ADE6',
  accent: '#FF9F0A',
  accentStrong: '#F08B00',
  success: '#34C759',
  warning: '#FF9F0A',
  danger: '#FF453A',
  page: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceSoft: '#F7F7FA',
  border: '#E5E5EA',
  text: '#1C1C1E',
  textSecondary: '#636366',
  textMuted: '#8E8E93',
} as const

const PALETTES: Record<string, SoftPalette> = {
  blue: {
    accent: '#0A84FF',
    accentStrong: '#0071E3',
    tint: '#EDF5FF',
    tintStrong: '#DCEBFF',
    border: '#D6E7FF',
    text: '#2160A6',
  },
  green: {
    accent: '#34C759',
    accentStrong: '#24A946',
    tint: '#ECFAF0',
    tintStrong: '#DDF3E3',
    border: '#D6EEDC',
    text: '#2E7D44',
  },
  purple: {
    accent: '#AF52DE',
    accentStrong: '#9747C3',
    tint: '#F6EDFC',
    tintStrong: '#EBDDF8',
    border: '#E4D4F5',
    text: '#7A57A5',
  },
  yellow: {
    accent: '#FFD60A',
    accentStrong: '#D4AC00',
    tint: '#FFF9DB',
    tintStrong: '#FFF0B8',
    border: '#F5E7A8',
    text: '#8B6A00',
  },
  pink: {
    accent: '#FF6482',
    accentStrong: '#F24D71',
    tint: '#FFF0F4',
    tintStrong: '#FFE2EA',
    border: '#F5D7E1',
    text: '#A54E67',
  },
  red: {
    accent: '#FF453A',
    accentStrong: '#E13931',
    tint: '#FFF0EE',
    tintStrong: '#FFE2DE',
    border: '#F5D6D2',
    text: '#A54F46',
  },
  orange: {
    accent: '#FF9F0A',
    accentStrong: '#F08B00',
    tint: '#FFF5E8',
    tintStrong: '#FFE8C9',
    border: '#F5DDB8',
    text: '#9A6220',
  },
  teal: {
    accent: '#30B0C7',
    accentStrong: '#1D95AA',
    tint: '#EAF8FB',
    tintStrong: '#D7F0F6',
    border: '#D1EAF0',
    text: '#2E7888',
  },
  indigo: {
    accent: '#5856D6',
    accentStrong: '#4442BF',
    tint: '#EFEEFF',
    tintStrong: '#E0DEFF',
    border: '#DAD7FB',
    text: '#5C5AA5',
  },
  cyan: {
    accent: '#64D2FF',
    accentStrong: '#38BDEB',
    tint: '#EEF9FF',
    tintStrong: '#DCF4FF',
    border: '#D8EEF9',
    text: '#347A97',
  },
  lime: {
    accent: '#9BC53D',
    accentStrong: '#7FA128',
    tint: '#F4F8E8',
    tintStrong: '#E7F0D2',
    border: '#DFE8C5',
    text: '#667E2B',
  },
  amber: {
    accent: '#FFB340',
    accentStrong: '#E09217',
    tint: '#FFF6E6',
    tintStrong: '#FFE8C8',
    border: '#F5DEB7',
    text: '#94621A',
  },
  neutral: {
    accent: '#AEAEB2',
    accentStrong: '#8E8E93',
    tint: '#F7F7FA',
    tintStrong: '#ECECF1',
    border: '#E5E5EA',
    text: '#636366',
  },
}

const TOKEN_TO_PALETTE: Array<{ key: keyof typeof PALETTES; includes: string[] }> = [
  { key: 'blue', includes: ['blue', 'kid-blue'] },
  { key: 'green', includes: ['green'] },
  { key: 'purple', includes: ['purple'] },
  { key: 'yellow', includes: ['yellow'] },
  { key: 'pink', includes: ['pink'] },
  { key: 'red', includes: ['red'] },
  { key: 'orange', includes: ['orange'] },
  { key: 'teal', includes: ['teal'] },
  { key: 'indigo', includes: ['indigo'] },
  { key: 'cyan', includes: ['cyan'] },
  { key: 'lime', includes: ['lime'] },
  { key: 'amber', includes: ['amber'] },
]

export const getSoftPalette = (token?: string | null): SoftPalette => {
  if (!token) return PALETTES.neutral

  const normalized = token.toLowerCase()
  const matched = TOKEN_TO_PALETTE.find(({ includes }) =>
    includes.some(keyword => normalized.includes(keyword))
  )

  return matched ? PALETTES[matched.key] : PALETTES.neutral
}
