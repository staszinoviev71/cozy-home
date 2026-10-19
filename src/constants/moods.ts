import { MoodState, UserRole } from '../types/domain';

export interface MoodMetadata extends MoodState {
  particle: string;
  faceDetails: 'happy' | 'tired' | 'hungry' | 'sad' | 'treat' | 'grumpy' | 'cozy' | 'love';
}

export const HUSBAND_MOOD_PRESETS: Record<string, MoodMetadata> = {
  happy: {
    id: 'happy',
    title: 'Весёлый / В ударе! ✨',
    animClass: 'anim-happy',
    emoji: '✨',
    color: '#FF8A65',
    description: 'Отличный вайб, куча энергии, обнимаю весь мир!',
    particle: '💖',
    faceDetails: 'happy',
  },
  tired: {
    id: 'tired',
    title: 'Устал, села батарейка 🪫',
    animClass: 'anim-tired',
    emoji: '🪫',
    color: '#90A4AE',
    description: 'Тяжелый день... Нужен горячий чай, плед и тишина',
    particle: 'Zzz',
    faceDetails: 'tired',
  },
  hungry: {
    id: 'hungry',
    title: 'Голоден, хочу кушать! 🍕',
    animClass: 'anim-hungry',
    emoji: '🍕',
    color: '#FFB74D',
    description: 'Срочно требуется пицца, суши или сытный ужин',
    particle: '🍣',
    faceDetails: 'hungry',
  },
  sad: {
    id: 'sad',
    title: 'Грустно, нужны обнимашки 🥺',
    animClass: 'anim-sad',
    emoji: '🥺',
    color: '#64B5F6',
    description: 'Немного грустно, просто побудь со мной рядом',
    particle: '💧',
    faceDetails: 'sad',
  },
  treat: {
    id: 'treat',
    title: 'Хочу вкусняшку / Сладкоежка 🧁',
    animClass: 'anim-happy',
    emoji: '🧁',
    color: '#F06292',
    description: 'Жизненно необходима шоколадка, круассан или тортик',
    particle: '🍩',
    faceDetails: 'treat',
  },
  grumpy: {
    id: 'grumpy',
    title: 'Ворчу, не трогать 😾',
    animClass: 'anim-grumpy',
    emoji: '😾',
    color: '#E57373',
    description: 'Не трогать без вкусняшки! Надул щечки',
    particle: '🗯️',
    faceDetails: 'grumpy',
  },
  cozy: {
    id: 'cozy',
    title: 'Уютная булочка 🥐',
    animClass: 'anim-cozy',
    emoji: '🥐',
    color: '#FFD54F',
    description: 'Закутался в самый теплый плед, смотрю сериал',
    particle: '☕',
    faceDetails: 'cozy',
  },
  love: {
    id: 'love',
    title: 'Люблю & Скучаю 🥰',
    animClass: 'anim-happy',
    emoji: '🥰',
    color: '#FF4081',
    description: 'Очень жду тебя домой, считаю минутки до встречи',
    particle: '❤️',
    faceDetails: 'love',
  },
};

export const WIFE_MOOD_PRESETS: Record<string, MoodMetadata> = {
  happy: {
    id: 'happy',
    title: 'На волне радости! ✨',
    animClass: 'anim-happy',
    emoji: '✨',
    color: '#FF8A65',
    description: 'Отличный вайб, куча энергии, обнимаю весь мир!',
    particle: '💖',
    faceDetails: 'happy',
  },
  tired: {
    id: 'tired',
    title: 'Устала, села батарейка 🪫',
    animClass: 'anim-tired',
    emoji: '🪫',
    color: '#90A4AE',
    description: 'Тяжелый день... Нужен горячий чай, плед и тишина',
    particle: 'Zzz',
    faceDetails: 'tired',
  },
  hungry: {
    id: 'hungry',
    title: 'Хочу кушать! 🍕',
    animClass: 'anim-hungry',
    emoji: '🍕',
    color: '#FFB74D',
    description: 'Срочно требуется пицца, суши или сытный ужин',
    particle: '🍣',
    faceDetails: 'hungry',
  },
  sad: {
    id: 'sad',
    title: 'Нужны обнимашки 🥺',
    animClass: 'anim-sad',
    emoji: '🥺',
    color: '#64B5F6',
    description: 'Немного грустно, просто побудь со мной рядом',
    particle: '💧',
    faceDetails: 'sad',
  },
  treat: {
    id: 'treat',
    title: 'Сладкоежка 🧁',
    animClass: 'anim-happy',
    emoji: '🧁',
    color: '#F06292',
    description: 'Жизненно необходима шоколадка, круассан или тортик',
    particle: '🍩',
    faceDetails: 'treat',
  },
  grumpy: {
    id: 'grumpy',
    title: 'Вредничаю 😾',
    animClass: 'anim-grumpy',
    emoji: '😾',
    color: '#E57373',
    description: 'Не трогать без вкусняшки! Надула щечки',
    particle: '🗯️',
    faceDetails: 'grumpy',
  },
  cozy: {
    id: 'cozy',
    title: 'Уютная булочка 🥐',
    animClass: 'anim-cozy',
    emoji: '🥐',
    color: '#FFD54F',
    description: 'Закуталась в самый теплый плед, смотрю сериал',
    particle: '☕',
    faceDetails: 'cozy',
  },
  love: {
    id: 'love',
    title: 'Люблю & Скучаю 🥰',
    animClass: 'anim-happy',
    emoji: '🥰',
    color: '#FF4081',
    description: 'Очень жду тебя домой, считаю минутки до встречи',
    particle: '❤️',
    faceDetails: 'love',
  },
};

/**
 * Canonical 8-mood presets (matching MoodState interface)
 */
export const MOOD_PRESETS: Record<string, MoodState> = HUSBAND_MOOD_PRESETS;

/**
 * Returns mood metadata by ID and user role (husband or wife).
 * Defaults to husband and falls back to 'happy' mood if ID is not recognized.
 */
export function getMoodById(moodId: string, gender: UserRole = 'husband'): MoodMetadata {
  const presets = gender === 'wife' ? WIFE_MOOD_PRESETS : HUSBAND_MOOD_PRESETS;
  return presets[moodId] || MOOD_PRESETS[moodId] || MOOD_PRESETS['happy'] as MoodMetadata;
}
