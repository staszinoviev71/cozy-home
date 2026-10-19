import { getMoodById } from '../../constants/moods';

export interface CharacterAvatarRenderProps extends CharacterAvatarProps {
  mood: ReturnType<typeof getMoodById>;
  svgXml: string;
  children: string;
}

// React-compatible type declarations allowing zero-dependency compilation
// while maintaining full interoperability with React / React Native.
export namespace React {
  export interface ReactElement<P = any, T = any> {
    type: T;
    props: P;
    key: any;
  }
  export type FC<P = {}> = {
    (props: P): ReactElement<any>;
    displayName?: string;
  };
}

export interface CharacterAvatarProps {
  moodId: string;
  gender: 'husband' | 'wife';
  size?: number;
}

/**
 * Generates vector SVG XML for character alter-ego based on mood and gender.
 * Husband has cute bear ears; wife has cute cat ears.
 */
export function getCharacterSvgString(moodId: string, gender: 'husband' | 'wife', size: number = 64): string {
  const mood = getMoodById(moodId, gender);
  const color = mood.color || '#FF8A65';

  // Ears: Husband (Bear) vs Wife (Cat)
  let earsSvg = '';
  if (gender === 'husband') {
    earsSvg = `
      <!-- Bear Ears (Husband) -->
      <circle cx="16" cy="18" r="8" fill="${color}" stroke="#FFFFFF" stroke-width="1.5" />
      <circle cx="16" cy="18" r="4.5" fill="#FFE5EB" />
      <circle cx="48" cy="18" r="8" fill="${color}" stroke="#FFFFFF" stroke-width="1.5" />
      <circle cx="48" cy="18" r="4.5" fill="#FFE5EB" />
    `;
  } else {
    earsSvg = `
      <!-- Cat Ears (Wife) -->
      <path d="M12 24 C 6 12, 18 6, 23 19 Z" fill="${color}" stroke="#FFFFFF" stroke-width="1.5" />
      <path d="M14 20 C 10 13, 17 9, 20 18 Z" fill="#FFE5EB" />
      <path d="M52 24 C 58 12, 46 6, 41 19 Z" fill="${color}" stroke="#FFFFFF" stroke-width="1.5" />
      <path d="M50 20 C 54 13, 47 9, 44 18 Z" fill="#FFE5EB" />
    `;
  }

  // Facial features based on mood faceDetails
  let eyesSvg = '';
  let mouthSvg = '';
  let blushSvg = '<circle cx="16" cy="38" r="5" fill="#FF4081" opacity="0.35"/><circle cx="48" cy="38" r="5" fill="#FF4081" opacity="0.35"/>';
  let extraSvg = '';

  switch (mood.faceDetails) {
    case 'happy':
    case 'love':
      eyesSvg = `
        <path d="M16 30 Q 22 23 28 30" stroke="#1D1D26" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M36 30 Q 42 23 48 30" stroke="#1D1D26" stroke-width="3" stroke-linecap="round" fill="none" />
      `;
      mouthSvg = `
        <path d="M26 38 Q 32 46 38 38" stroke="#1D1D26" stroke-width="3" stroke-linecap="round" fill="#FF4D6D" />
      `;
      break;

    case 'tired':
      eyesSvg = `
        <path d="M16 32 L 28 32" stroke="#1D1D26" stroke-width="3.5" stroke-linecap="round" />
        <path d="M36 32 L 48 32" stroke="#1D1D26" stroke-width="3.5" stroke-linecap="round" />
      `;
      mouthSvg = `
        <ellipse cx="32" cy="41" rx="4" ry="6" fill="#1D1D26" />
      `;
      break;

    case 'hungry':
      eyesSvg = `
        <circle cx="21" cy="30" r="5" fill="#1D1D26" />
        <circle cx="19.5" cy="28.5" r="2" fill="#FFFFFF" />
        <circle cx="43" cy="30" r="5" fill="#1D1D26" />
        <circle cx="41.5" cy="28.5" r="2" fill="#FFFFFF" />
      `;
      mouthSvg = `
        <path d="M26 39 Q 32 47 38 39" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" fill="#FF708D" />
        <circle cx="39" cy="45" r="2" fill="#00F2FE" />
      `;
      break;

    case 'sad':
      eyesSvg = `
        <path d="M17 26 Q 22 29 27 28" stroke="#1D1D26" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M37 28 Q 42 29 47 26" stroke="#1D1D26" stroke-width="2" stroke-linecap="round" fill="none" />
        <circle cx="21" cy="32" r="4.5" fill="#1D1D26" />
        <circle cx="20" cy="31" r="1.5" fill="#FFFFFF" />
        <circle cx="43" cy="32" r="4.5" fill="#1D1D26" />
        <circle cx="42" cy="31" r="1.5" fill="#FFFFFF" />
      `;
      mouthSvg = `
        <path d="M27 43 Q 32 38 37 43" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" fill="none" />
      `;
      extraSvg = `
        <path d="M44 38 Q 43 45 46 45 Q 49 45 47 38 Z" fill="#00F2FE" opacity="0.8" />
      `;
      break;

    case 'grumpy':
      eyesSvg = `
        <path d="M17 27 L 27 30" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" />
        <path d="M37 30 L 47 27" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="23" cy="33" r="3.5" fill="#1D1D26" />
        <circle cx="41" cy="33" r="3.5" fill="#1D1D26" />
      `;
      mouthSvg = `
        <path d="M28 42 L 36 42" stroke="#1D1D26" stroke-width="3" stroke-linecap="round" />
      `;
      blushSvg = '<circle cx="15" cy="38" r="6" fill="#FF3366" opacity="0.6"/><circle cx="49" cy="38" r="6" fill="#FF3366" opacity="0.6"/>';
      break;

    case 'cozy':
    case 'treat':
    default:
      eyesSvg = `
        <path d="M17 31 Q 22 26 27 31" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <path d="M37 31 Q 42 26 47 31" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" fill="none" />
      `;
      mouthSvg = `
        <path d="M28 39 Q 32 44 36 39" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" fill="#FF708D" />
      `;
      break;
  }

  return `
    <svg class="character-svg ${mood.animClass}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${earsSvg}
      <!-- Face/Head -->
      <ellipse cx="32" cy="35" rx="24" ry="21" fill="${color}" stroke="#FFFFFF" stroke-width="1.5" />
      <!-- Blush -->
      ${blushSvg}
      <!-- Eyes -->
      ${eyesSvg}
      <!-- Nose -->
      <ellipse cx="32" cy="34" rx="2" ry="1.5" fill="#1D1D26" />
      <!-- Mouth -->
      ${mouthSvg}
      <!-- Mood Particle / Extra detail -->
      ${extraSvg}
    </svg>
  `.trim();
}

/**
 * Animated Vector Character Avatar Component
 */
export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  moodId,
  gender,
  size = 64,
}) => {
  const mood = getMoodById(moodId, gender);
  const svgXml = getCharacterSvgString(moodId, gender, size);

  return {
    type: 'CharacterAvatar',
    props: {
      moodId,
      gender,
      size,
      mood,
      svgXml,
      children: svgXml,
    },
    key: null,
  };
};

CharacterAvatar.displayName = 'CharacterAvatar';
