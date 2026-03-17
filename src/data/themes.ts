export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  /** Google Fonts import URL (appended at runtime) */
  fontUrl: string;
}

export const themes: ThemeDefinition[] = [
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    description: 'Professional and calming maritime theme',
    colors: {
      primary: '#0077B6',
      secondary: '#00B4D8',
      accent: '#90E0EF',
      background: '#03045E',
      surface: '#0A1628',
      text: '#CAF0F8',
      textMuted: '#90E0EF',
    },
    fonts: { heading: 'Playfair Display', body: 'Source Sans 3' },
    fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Sans+3:wght@300;400;600;700&display=swap',
  },
  {
    id: 'sunset-boulevard',
    name: 'Sunset Boulevard',
    description: 'Warm and vibrant sunset colors',
    colors: {
      primary: '#FF6B35',
      secondary: '#F7C59F',
      accent: '#EFEFD0',
      background: '#1A0A00',
      surface: '#2D1810',
      text: '#FFF8F0',
      textMuted: '#F7C59F',
    },
    fonts: { heading: 'Bebas Neue', body: 'Karla' },
    fontUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Karla:wght@300;400;500;700&display=swap',
  },
  {
    id: 'forest-canopy',
    name: 'Forest Canopy',
    description: 'Natural and grounded earth tones',
    colors: {
      primary: '#2D6A4F',
      secondary: '#52B788',
      accent: '#B7E4C7',
      background: '#081C15',
      surface: '#1B4332',
      text: '#D8F3DC',
      textMuted: '#95D5B2',
    },
    fonts: { heading: 'Lora', body: 'Nunito' },
    fontUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Nunito:wght@300;400;600;700&display=swap',
  },
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Clean and contemporary grayscale',
    colors: {
      primary: '#2D2D2D',
      secondary: '#555555',
      accent: '#E0E0E0',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      text: '#1A1A1A',
      textMuted: '#757575',
    },
    fonts: { heading: 'Space Grotesk', body: 'Inter' },
    fontUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    description: 'Rich and warm autumnal palette',
    colors: {
      primary: '#B8860B',
      secondary: '#DAA520',
      accent: '#FFD700',
      background: '#1C1409',
      surface: '#2E2210',
      text: '#FFF8DC',
      textMuted: '#D4A853',
    },
    fonts: { heading: 'Cormorant Garamond', body: 'Raleway' },
    fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Raleway:wght@300;400;500;700&display=swap',
  },
  {
    id: 'arctic-frost',
    name: 'Arctic Frost',
    description: 'Cool and crisp winter-inspired theme',
    colors: {
      primary: '#4A90D9',
      secondary: '#7EC8E3',
      accent: '#C4E0F9',
      background: '#F0F4F8',
      surface: '#FFFFFF',
      text: '#1B2A4A',
      textMuted: '#5B7BA5',
    },
    fonts: { heading: 'Outfit', body: 'DM Sans' },
    fontUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&family=DM+Sans:wght@300;400;500;700&display=swap',
  },
  {
    id: 'desert-rose',
    name: 'Desert Rose',
    description: 'Soft and sophisticated dusty tones',
    colors: {
      primary: '#C2727A',
      secondary: '#D4A5A5',
      accent: '#F9E4D4',
      background: '#1A1015',
      surface: '#2D1F28',
      text: '#FAF0E6',
      textMuted: '#D4A5A5',
    },
    fonts: { heading: 'Philosopher', body: 'Quicksand' },
    fontUrl: 'https://fonts.googleapis.com/css2?family=Philosopher:wght@400;700&family=Quicksand:wght@300;400;500;700&display=swap',
  },
  {
    id: 'tech-innovation',
    name: 'Tech Innovation',
    description: 'Bold and modern tech aesthetic',
    colors: {
      primary: '#6C63FF',
      secondary: '#3F3D56',
      accent: '#A8A5FF',
      background: '#0D0D1A',
      surface: '#1A1A2E',
      text: '#E8E8FF',
      textMuted: '#9090C0',
    },
    fonts: { heading: 'Syne', body: 'Inter' },
    fontUrl: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap',
  },
  {
    id: 'botanical-garden',
    name: 'Botanical Garden',
    description: 'Fresh and organic garden colors',
    colors: {
      primary: '#6B8F71',
      secondary: '#AAC0AA',
      accent: '#E8F0E8',
      background: '#FAFDF7',
      surface: '#FFFFFF',
      text: '#2C3E2D',
      textMuted: '#6B8F71',
    },
    fonts: { heading: 'Fraunces', body: 'Work Sans' },
    fontUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700;900&family=Work+Sans:wght@300;400;500;600&display=swap',
  },
  {
    id: 'midnight-galaxy',
    name: 'Midnight Galaxy',
    description: 'Dramatic and cosmic deep tones',
    colors: {
      primary: '#BB86FC',
      secondary: '#CF6679',
      accent: '#03DAC6',
      background: '#0B0B1E',
      surface: '#1E1E3A',
      text: '#E8DEF8',
      textMuted: '#A790D5',
    },
    fonts: { heading: 'Clash Display', body: 'General Sans' },
    fontUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&display=swap',
  },
];

export function getThemeById(id: string): ThemeDefinition | undefined {
  return themes.find(t => t.id === id);
}
