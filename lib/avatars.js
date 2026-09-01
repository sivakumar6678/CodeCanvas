/**
 * Predefined Avatar System for CodeCraft
 * Provides built-in developer and AI-themed avatar presets with zero file upload dependency.
 */

export const PREDEFINED_AVATARS = [
  {
    id: 'avatar-coder',
    label: 'Developer',
    icon: '👨‍💻',
    bg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    textColor: '#ffffff',
    borderColor: '#818cf8',
  },
  {
    id: 'avatar-robot',
    label: 'AI Bot',
    icon: '🤖',
    bg: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
    textColor: '#ffffff',
    borderColor: '#22d3ee',
  },
  {
    id: 'avatar-sparkle',
    label: 'AI Architect',
    icon: '✨',
    bg: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    textColor: '#ffffff',
    borderColor: '#fbbf24',
  },
  {
    id: 'avatar-designer',
    label: 'UI/UX Creator',
    icon: '🎨',
    bg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    textColor: '#ffffff',
    borderColor: '#f472b6',
  },
  {
    id: 'avatar-ninja',
    label: 'Code Ninja',
    icon: '🥷',
    bg: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
    textColor: '#ffffff',
    borderColor: '#64748b',
  },
  {
    id: 'avatar-rocket',
    label: 'Fast Shipper',
    icon: '🚀',
    bg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    textColor: '#ffffff',
    borderColor: '#f87171',
  },
  {
    id: 'avatar-brain',
    label: 'Deep Thinker',
    icon: '🧠',
    bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    textColor: '#ffffff',
    borderColor: '#34d399',
  },
  {
    id: 'avatar-terminal',
    label: 'CLI Hacker',
    icon: '💻',
    bg: 'linear-gradient(135deg, #1e293b 0%, #022c22 100%)',
    textColor: '#4ade80',
    borderColor: '#22c55e',
  },
  {
    id: 'avatar-wizard',
    label: 'Tech Wizard',
    icon: '🧙',
    bg: 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)',
    textColor: '#ffffff',
    borderColor: '#a78bfa',
  },
  {
    id: 'avatar-cat',
    label: 'Vibe Coder',
    icon: '🐱',
    bg: 'linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)',
    textColor: '#ffffff',
    borderColor: '#fb7185',
  },
  {
    id: 'avatar-gem',
    label: 'Quality Pro',
    icon: '💎',
    bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    textColor: '#ffffff',
    borderColor: '#60a5fa',
  },
  {
    id: 'avatar-shield',
    label: 'Security Sentinel',
    icon: '🛡️',
    bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    textColor: '#ffffff',
    borderColor: '#38bdf8',
  },
];

const AVATAR_MAP = new Map(PREDEFINED_AVATARS.map((a) => [a.id, a]));

export function getAvatarById(id) {
  if (!id) return null;
  return AVATAR_MAP.get(id) || null;
}

export const getAvatarPreset = getAvatarById;

export function isValidAvatarId(id) {
  if (!id || typeof id !== 'string') return false;
  return AVATAR_MAP.has(id.trim());
}

export function resolveAvatarDisplay(avatarValue, username = 'User') {
  const raw = typeof avatarValue === 'string' ? avatarValue.trim() : '';

  if (raw && AVATAR_MAP.has(raw)) {
    const preset = AVATAR_MAP.get(raw);
    return {
      type: 'preset',
      preset,
      label: preset.label,
      icon: preset.icon,
      style: {
        background: preset.bg,
        color: preset.textColor,
        border: `2px solid ${preset.borderColor}`,
      },
    };
  }

  if (raw && (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:image/'))) {
    return {
      type: 'url',
      url: raw,
      label: username,
    };
  }

  // Fallback to initial
  const initial = (username || 'U').charAt(0).toUpperCase();
  return {
    type: 'initials',
    initial,
    label: username,
    style: {
      background: 'var(--primary, #3b82f6)',
      color: '#ffffff',
    },
  };
}
