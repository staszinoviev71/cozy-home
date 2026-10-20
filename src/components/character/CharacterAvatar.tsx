import { getMoodById } from '../../constants/moods';
import { AvatarArchetype } from '../../types/domain';

export type { AvatarArchetype };

export interface CharacterAvatarProps {
  moodId: string;
  gender: 'husband' | 'wife';
  archetype?: AvatarArchetype;
  size?: number;
}

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

/**
 * Generates vector SVG XML for character alter-ego.
 * Supports:
 *  - 'corgi': Adorable Welsh Corgi pup with perky ears, white blaze, black button nose and expressive moods.
 *  - 'human':
 *      - Wife: Girl with stylish jet-black hair, soft contours, expressive lashes and cute blush.
 *      - Husband: Guy with dark textured hair with blonde/golden highlights, handsome jawline and lively expressions.
 */
export function getCharacterSvgString(
  moodId: string,
  gender: 'husband' | 'wife',
  size: number = 64,
  archetype: AvatarArchetype = 'corgi'
): string {
  const mood = getMoodById(moodId, gender);
  const color = mood.color || '#FF8A65';

  if (archetype === 'human') {
    return getHumanSvgString(mood, gender, size);
  }

  return getCorgiSvgString(mood, gender, size, color);
}

/**
 * Corgi alter-ego vector illustration
 */
function getCorgiSvgString(
  mood: ReturnType<typeof getMoodById>,
  gender: 'husband' | 'wife',
  size: number,
  accentColor: string
): string {
  // Corgi ears: large upright with soft pinkish peach interior
  const earsSvg = `
    <!-- Corgi Left Ear -->
    <path d="M12 28 C 7 10, 19 3, 27 18 Z" fill="#FB8C00" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round" />
    <path d="M14 24 C 11 12, 19 8, 23 18 Z" fill="#FFE0B2" />
    <!-- Corgi Right Ear -->
    <path d="M52 28 C 57 10, 45 3, 37 18 Z" fill="#FB8C00" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round" />
    <path d="M50 24 C 53 12, 45 8, 41 18 Z" fill="#FFE0B2" />
  `;

  // Dynamic expressions based on mood
  let eyesSvg = '';
  let mouthSvg = '';
  let blushSvg = '<circle cx="16" cy="40" r="5" fill="#FF4081" opacity="0.35"/><circle cx="48" cy="40" r="5" fill="#FF4081" opacity="0.35"/>';
  let extraSvg = '';

  switch (mood.faceDetails) {
    case 'happy':
    case 'love':
      eyesSvg = `
        <path d="M17 32 Q 22 25 27 32" stroke="#1D1D26" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M37 32 Q 42 25 47 32" stroke="#1D1D26" stroke-width="3" stroke-linecap="round" fill="none" />
      `;
      mouthSvg = `
        <!-- Happy open mouth with pink corgi tongue -->
        <path d="M26 42 Q 32 49 38 42" stroke="#1D1D26" stroke-width="2" fill="#FF4D6D" />
        <path d="M30 45 Q 32 50 34 45" fill="#FF8DA1" />
      `;
      if (mood.id === 'love') {
        extraSvg = '<text x="44" y="22" font-size="12">❤️</text>';
      }
      break;

    case 'tired':
      eyesSvg = `
        <path d="M17 33 L 27 33" stroke="#1D1D26" stroke-width="3" stroke-linecap="round" />
        <path d="M37 33 L 47 33" stroke="#1D1D26" stroke-width="3" stroke-linecap="round" />
      `;
      mouthSvg = `
        <ellipse cx="32" cy="43" rx="3" ry="4" fill="#1D1D26" />
      `;
      extraSvg = '<text x="44" y="22" font-size="10" fill="#90A4AE" font-weight="bold">zZ</text>';
      break;

    case 'hungry':
      eyesSvg = `
        <circle cx="22" cy="32" r="4.5" fill="#1D1D26" />
        <circle cx="20.5" cy="30.5" r="1.8" fill="#FFFFFF" />
        <circle cx="42" cy="32" r="4.5" fill="#1D1D26" />
        <circle cx="40.5" cy="30.5" r="1.8" fill="#FFFFFF" />
      `;
      mouthSvg = `
        <path d="M27 42 Q 32 48 37 42" stroke="#1D1D26" stroke-width="2" fill="#FF708D" />
        <!-- Drool drop -->
        <circle cx="38" cy="48" r="2" fill="#00F2FE" />
      `;
      break;

    case 'sad':
      eyesSvg = `
        <circle cx="22" cy="33" r="4.5" fill="#1D1D26" />
        <circle cx="21" cy="31.5" r="1.5" fill="#FFFFFF" />
        <circle cx="42" cy="33" r="4.5" fill="#1D1D26" />
        <circle cx="41" cy="31.5" r="1.5" fill="#FFFFFF" />
      `;
      mouthSvg = `
        <path d="M28 44 Q 32 40 36 44" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" fill="none" />
      `;
      extraSvg = `
        <path d="M43 38 Q 42 44 45 44 Q 48 44 46 38 Z" fill="#00F2FE" opacity="0.85" />
      `;
      break;

    case 'grumpy':
      eyesSvg = `
        <path d="M18 30 L 27 32" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" />
        <path d="M37 32 L 46 30" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="23" cy="34" r="3" fill="#1D1D26" />
        <circle cx="41" cy="34" r="3" fill="#1D1D26" />
      `;
      mouthSvg = `
        <path d="M28 43 L 36 43" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" />
      `;
      blushSvg = '<circle cx="16" cy="40" r="5" fill="#FF3366" opacity="0.5"/><circle cx="48" cy="40" r="5" fill="#FF3366" opacity="0.5"/>';
      break;

    case 'treat':
    case 'cozy':
    default:
      eyesSvg = `
        <path d="M17 32 Q 22 27 27 32" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <path d="M37 32 Q 42 27 47 32" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" fill="none" />
      `;
      mouthSvg = `
        <path d="M28 41 Q 32 46 36 41" stroke="#1D1D26" stroke-width="2" stroke-linecap="round" fill="#FF708D" />
      `;
      break;
  }

  return `
    <svg class="character-svg ${mood.animClass}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${earsSvg}
      <!-- Head Base (Golden Corgi Fur) -->
      <ellipse cx="32" cy="37" rx="23" ry="19" fill="#FB8C00" stroke="#FFFFFF" stroke-width="1.5" />
      <!-- White Muzzle & Cheeks -->
      <path d="M18 37 Q 22 47 32 47 Q 42 47 46 37 Q 49 44 42 50 Q 32 54 22 50 Q 15 44 18 37 Z" fill="#FFFFFF" />
      <!-- White Forehead Blaze -->
      <path d="M29 20 Q 32 17 35 20 L 36 34 Q 32 32 28 34 Z" fill="#FFFFFF" />
      <!-- Blush -->
      ${blushSvg}
      <!-- Eyes -->
      ${eyesSvg}
      <!-- Corgi Button Nose -->
      <ellipse cx="32" cy="38" rx="3.5" ry="2.2" fill="#1D1D26" />
      <ellipse cx="31" cy="37.2" rx="1" ry="0.6" fill="#FFFFFF" opacity="0.75" />
      <!-- Mouth -->
      ${mouthSvg}
      <!-- Extra details -->
      ${extraSvg}
    </svg>
  `.trim();
}

/**
 * Human alter-ego vector illustration
 * Wife: Girl with black hair
 * Husband: Guy with dark hair + blonde highlights
 */
function getHumanSvgString(
  mood: ReturnType<typeof getMoodById>,
  gender: 'husband' | 'wife',
  size: number
): string {
  const isWife = gender === 'wife';

  // Base facial features
  let eyesSvg = '';
  let mouthSvg = '';
  let extraSvg = '';
  let blushSvg = `<circle cx="20" cy="37" r="4.5" fill="#FF4081" opacity="${isWife ? '0.45' : '0.25'}"/><circle cx="44" cy="37" r="4.5" fill="#FF4081" opacity="${isWife ? '0.45' : '0.25'}"/>`;

  switch (mood.faceDetails) {
    case 'happy':
    case 'love':
      eyesSvg = `
        <path d="M20 30 Q 24 24 28 30" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <path d="M36 30 Q 40 24 44 30" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" fill="none" />
        ${isWife ? '<path d="M28 28 L 30 26 M44 28 L 46 26" stroke="#1D1D26" stroke-width="1.5" stroke-linecap="round" />' : ''}
      `;
      mouthSvg = `
        <path d="M27 38 Q 32 44 37 38" stroke="#1D1D26" stroke-width="2" stroke-linecap="round" fill="#FF5E62" />
      `;
      if (mood.id === 'love') {
        extraSvg = '<text x="44" y="20" font-size="12">💖</text>';
      }
      break;

    case 'tired':
      eyesSvg = `
        <path d="M20 31 L 28 31" stroke="#1D1D26" stroke-width="2.8" stroke-linecap="round" />
        <path d="M36 31 L 44 31" stroke="#1D1D26" stroke-width="2.8" stroke-linecap="round" />
      `;
      mouthSvg = `
        <ellipse cx="32" cy="40" rx="2.5" ry="3.5" fill="#1D1D26" />
      `;
      extraSvg = '<text x="45" y="20" font-size="10" fill="#90A4AE" font-weight="bold">zZ</text>';
      break;

    case 'hungry':
      eyesSvg = `
        <circle cx="24" cy="30" r="4" fill="#1D1D26" />
        <circle cx="22.5" cy="28.5" r="1.5" fill="#FFFFFF" />
        <circle cx="40" cy="30" r="4" fill="#1D1D26" />
        <circle cx="38.5" cy="28.5" r="1.5" fill="#FFFFFF" />
      `;
      mouthSvg = `
        <path d="M27 38 Q 32 43 37 38" stroke="#1D1D26" stroke-width="2" fill="#FF708D" />
        <circle cx="38" cy="43" r="1.8" fill="#00F2FE" />
      `;
      break;

    case 'sad':
      eyesSvg = `
        <circle cx="24" cy="31" r="3.8" fill="#1D1D26" />
        <circle cx="23" cy="29.8" r="1.4" fill="#FFFFFF" />
        <circle cx="40" cy="31" r="3.8" fill="#1D1D26" />
        <circle cx="39" cy="29.8" r="1.4" fill="#FFFFFF" />
      `;
      mouthSvg = `
        <path d="M28 40 Q 32 37 36 40" stroke="#1D1D26" stroke-width="2" stroke-linecap="round" fill="none" />
      `;
      extraSvg = `
        <path d="M42 34 Q 41 40 44 40 Q 47 40 45 34 Z" fill="#00F2FE" opacity="0.85" />
      `;
      break;

    case 'grumpy':
      eyesSvg = `
        <path d="M20 28 L 28 30" stroke="#1D1D26" stroke-width="2" stroke-linecap="round" />
        <path d="M36 30 L 44 28" stroke="#1D1D26" stroke-width="2" stroke-linecap="round" />
        <circle cx="24" cy="32" r="3" fill="#1D1D26" />
        <circle cx="40" cy="32" r="3" fill="#1D1D26" />
      `;
      mouthSvg = `
        <path d="M28 39 L 36 39" stroke="#1D1D26" stroke-width="2.5" stroke-linecap="round" />
      `;
      blushSvg = '<circle cx="20" cy="37" r="4.5" fill="#FF3366" opacity="0.6"/><circle cx="44" cy="37" r="4.5" fill="#FF3366" opacity="0.6"/>';
      break;

    case 'treat':
    case 'cozy':
    default:
      eyesSvg = `
        <path d="M20 30 Q 24 25 28 30" stroke="#1D1D26" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M36 30 Q 40 25 44 30" stroke="#1D1D26" stroke-width="2" stroke-linecap="round" fill="none" />
      `;
      mouthSvg = `
        <path d="M28 38 Q 32 42 36 38" stroke="#1D1D26" stroke-width="2" stroke-linecap="round" fill="#FF708D" />
      `;
      break;
  }

  if (isWife) {
    // Girl with sleek black hair, cute bob and gold earrings
    return `
      <svg class="character-svg ${mood.animClass}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Back Hair (Jet Black) -->
        <path d="M15 28 C 14 12, 50 12, 49 28 C 52 42, 48 48, 46 50 C 44 40, 44 33, 44 29 C 38 29, 26 29, 20 29 C 20 33, 20 40, 18 50 C 16 48, 12 42, 15 28 Z" fill="#12131A" stroke="#252836" stroke-width="1" />
        <!-- Neck -->
        <rect x="28" y="44" width="8" height="8" rx="3" fill="#FFDFC4" />
        <!-- Face -->
        <ellipse cx="32" cy="33" rx="16.5" ry="15.5" fill="#FFDFC4" stroke="#FFFFFF" stroke-width="1.2" />
        <!-- Front Black Hair / Bangs -->
        <path d="M15 27 C 15 15, 49 15, 49 27 C 45 21, 38 21, 32 24 C 26 21, 19 21, 15 27 Z" fill="#12131A" />
        <path d="M19 19 Q 26 16 33 18" stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-linecap="round" fill="none" />
        <!-- Cute gold earrings -->
        <circle cx="15" cy="35" r="1.6" fill="#FFD700" />
        <circle cx="49" cy="35" r="1.6" fill="#FFD700" />
        <!-- Facial details -->
        ${blushSvg}
        ${eyesSvg}
        <ellipse cx="32" cy="34" rx="1.5" ry="1" fill="#E0A58A" />
        ${mouthSvg}
        ${extraSvg}
      </svg>
    `.trim();
  }

  // Husband: Guy with dark hair + blonde highlighted textured streaks
  return `
    <svg class="character-svg ${mood.animClass}" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Neck -->
      <rect x="27" y="44" width="10" height="8" rx="3" fill="#FAD7BD" />
      <!-- Face (Masculine contour) -->
      <path d="M17 30 C 17 21, 47 21, 47 30 C 47 39, 42 47, 32 48 C 22 47, 17 39, 17 30 Z" fill="#FAD7BD" stroke="#FFFFFF" stroke-width="1.2" />
      <!-- Dark Hair Base (Dark brunette #20222B) -->
      <path d="M15 27 C 14 15, 50 15, 49 27 C 50 19, 46 12, 32 12 C 18 12, 14 19, 15 27 Z" fill="#20222B" />
      <path d="M16 23 C 18 14, 28 11, 35 12 C 43 11, 48 15, 48 22 C 45 19, 39 18, 33 20 C 27 18, 20 19, 16 23 Z" fill="#20222B" />
      <!-- Blonde Highlights (Мелированные светлые пряди блонд) -->
      <path d="M23 15 Q 26 10 31 12 Q 28 17 26 19 Z" fill="#FAD02C" />
      <path d="M30 13 Q 35 9 39 12 Q 36 17 33 19 Z" fill="#FCE38A" />
      <path d="M37 14 Q 43 11 45 16 Q 41 19 38 19 Z" fill="#FAD02C" />
      <path d="M19 18 Q 23 14 26 16 Q 24 20 21 21 Z" fill="#FCE38A" />
      <!-- Masculine Eyebrows -->
      <path d="M21 26 L 27 27" stroke="#20222B" stroke-width="2" stroke-linecap="round" />
      <path d="M37 27 L 43 26" stroke="#20222B" stroke-width="2" stroke-linecap="round" />
      <!-- Facial details -->
      ${blushSvg}
      ${eyesSvg}
      <ellipse cx="32" cy="35" rx="1.8" ry="1.2" fill="#DFA98F" />
      ${mouthSvg}
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
  archetype = 'corgi',
  size = 64,
}) => {
  const mood = getMoodById(moodId, gender);
  const svgXml = getCharacterSvgString(moodId, gender, size, archetype);

  return {
    type: 'CharacterAvatar',
    props: {
      moodId,
      gender,
      archetype,
      size,
      mood,
      svgXml,
      children: svgXml,
    },
    key: null,
  };
};

CharacterAvatar.displayName = 'CharacterAvatar';
