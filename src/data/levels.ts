import raw from './levels.json';

export type LevelDetails = {
  key: string;
  name: string;
  badge: string;
  headline: string;
  summary: string;
  heroImage?: string;
  duration?: string;
  intensity?: string;
  nextCohort?: string;
  whoFor?: {
    title?: string;
    description: string;
    bullets?: Array<{
      title: string;
      description?: string;
    }>;
  };
  prerequisite?: {
    title?: string;
    description: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
  gallery?: {
    image: string;
    eyebrow?: string;
    title?: string;
    alt?: string;
  };
  testimonial?: {
    quote: string;
    author: string;
    role?: string;
    initials?: string;
  };
  highlights: string[];
  outcomes: string[];
  curriculum: Array<{ title: string; items: string[] }>;
  curriculumHighlights?: Array<{
    title: string;
    subtitle?: string;
    description: string;
    tags?: string[];
    tone?: 'dark' | 'light' | 'red' | 'sand';
    image?: string;
    icon?: 'business' | 'culture' | 'voice' | 'grammar';
  }>;
  capabilities?: Array<{
    title: string;
    description: string;
  }>;
  readyToMaster?: {
    headline: string;
    description: string;
    bullets: string[];
  };
  lessonShowcase?: {
    leftImage: string;
    leftLabel: string;
    quote: {
      text: string;
      author: string;
      role: string;
    };
  };
  assessment: {
    format: string;
    passingScore: number;
    notes: string;
  };
};

export const LEVEL_DETAILS = raw as LevelDetails[];

export function getLevelDetailsByKey(keyOrName: string): LevelDetails | null {
  const k = decodeURIComponent(keyOrName).trim().toLowerCase();
  return LEVEL_DETAILS.find(l => l.key.toLowerCase() === k || l.name.toLowerCase() === k) ?? null;
}

// Helper function to get all level keys
export function getAllLevelKeys(): string[] {
  return LEVEL_DETAILS.map(l => l.key);
}

// Helper function to get level by key (case insensitive)
export function getLevelByKey(key: string): LevelDetails | null {
  const normalizedKey = key.trim().toUpperCase();
  return LEVEL_DETAILS.find(l => l.key.toUpperCase() === normalizedKey) ?? null;
}

// Helper function to get next level
export function getNextLevel(currentLevelKey: string): LevelDetails | null {
  const currentIndex = LEVEL_DETAILS.findIndex(l => l.key === currentLevelKey);
  if (currentIndex === -1 || currentIndex === LEVEL_DETAILS.length - 1) return null;
  return LEVEL_DETAILS[currentIndex + 1];
}

// Helper function to get previous level
export function getPreviousLevel(currentLevelKey: string): LevelDetails | null {
  const currentIndex = LEVEL_DETAILS.findIndex(l => l.key === currentLevelKey);
  if (currentIndex <= 0) return null;
  return LEVEL_DETAILS[currentIndex - 1];
}

// Helper function to get level progress percentage
export function getLevelProgress(currentLevelKey: string): number {
  const currentIndex = LEVEL_DETAILS.findIndex(l => l.key === currentLevelKey);
  if (currentIndex === -1) return 0;
  return (currentIndex / (LEVEL_DETAILS.length - 1)) * 100;
}

// Helper function to check if level exists
export function levelExists(keyOrName: string): boolean {
  return getLevelDetailsByKey(keyOrName) !== null;
}

// Helper function to get all levels with basic info
export function getAllLevelsBasic() {
  return LEVEL_DETAILS.map(({ key, name, badge, headline }) => ({
    key,
    name,
    badge,
    headline,
  }));
}

// Helper function to get level by name (convenience wrapper)
export function getLevelByName(name: string): LevelDetails | null {
  return getLevelDetailsByKey(name);
}

// Helper function to get level badge color (for UI)
export function getLevelBadgeColor(levelKey: string): string {
  const colors: Record<string, string> = {
    A1: '#6B7280',
    A2: '#D4A373',
    B1: '#C62828',
    B2: '#1A1A1A',
    C1: '#2C3E50',
    C2: '#27AE60',
  };
  return colors[levelKey.toUpperCase()] || '#1A1A1A';
}

// Helper function to get level display name with badge
export function getLevelDisplay(levelKey: string): string {
  const level = getLevelByKey(levelKey);
  return level ? `${level.key}: ${level.badge}` : levelKey;
}

// Helper function to get level description for progress tracking
export function getLevelDescription(levelKey: string): string {
  const level = getLevelByKey(levelKey);
  return level?.headline || level?.summary || '';
}