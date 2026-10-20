import { MOOD_PRESETS, getMoodById, WIFE_MOOD_PRESETS, HUSBAND_MOOD_PRESETS } from '../src/constants/moods';
import { liquidGlassTheme, LiquidGlassTheme } from '../src/theme/liquidGlass';
import { CharacterAvatar, getCharacterSvgString } from '../src/components/character/CharacterAvatar';

describe('Moods & Character configuration', () => {
  it('contains exactly 8 emotional states', () => {
    expect(Object.keys(MOOD_PRESETS)).toHaveLength(8);
    expect(MOOD_PRESETS).toHaveProperty('happy');
    expect(MOOD_PRESETS).toHaveProperty('tired');
    expect(MOOD_PRESETS).toHaveProperty('hungry');
    expect(MOOD_PRESETS).toHaveProperty('sad');
    expect(MOOD_PRESETS).toHaveProperty('treat');
    expect(MOOD_PRESETS).toHaveProperty('grumpy');
    expect(MOOD_PRESETS).toHaveProperty('cozy');
    expect(MOOD_PRESETS).toHaveProperty('love');
  });

  it('returns valid mood metadata with title and animation tags', () => {
    const mood = getMoodById('tired');
    expect(mood.title).toContain('Устал');
    expect(mood.animClass).toBe('anim-tired');
  });

  it('supports gender-specific mood descriptions for husband and wife', () => {
    const husbandMood = getMoodById('tired', 'husband');
    const wifeMood = getMoodById('tired', 'wife');

    expect(husbandMood.title).toContain('Устал');
    expect(wifeMood.title).toContain('Устала');
    expect(Object.keys(HUSBAND_MOOD_PRESETS)).toHaveLength(8);
    expect(Object.keys(WIFE_MOOD_PRESETS)).toHaveLength(8);
  });

  it('falls back to happy mood for unknown mood id', () => {
    const unknown = getMoodById('non_existent_mood');
    expect(unknown.id).toBe('happy');
  });
});

describe('Liquid Glass Theme', () => {
  it('exports complete liquid glass design tokens', () => {
    expect(liquidGlassTheme.colors.primary).toBe('#FF5E62');
    expect(liquidGlassTheme.colors.accentCyan).toBe('#00F2FE');
    expect(liquidGlassTheme.glass.blurRadius).toBe(28);
    expect(liquidGlassTheme.glass.bg).toBe('rgba(255, 255, 255, 0.22)');
    expect(liquidGlassTheme.gradients.auraWarm).toBeDefined();
    expect(liquidGlassTheme.radius.phone).toBe(48);
  });
});

describe('CharacterAvatar Component & SVG Generation', () => {
  it('generates distinct SVG markup for husband and wife alter-egos', () => {
    const husbandSvg = getCharacterSvgString('happy', 'husband', 64);
    const wifeSvg = getCharacterSvgString('happy', 'wife', 64);

    expect(husbandSvg).toContain('<svg');
    expect(husbandSvg).toContain('viewBox="0 0 64 64"');
    expect(husbandSvg).toContain('anim-happy');
    // Husband has round bear ears, wife has triangular cat ears
    expect(husbandSvg).toContain('circle');
    expect(wifeSvg).toContain('path');
  });

  it('renders facial expressions for tired, grumpy, hungry and sad moods', () => {
    const tiredSvg = getCharacterSvgString('tired', 'husband');
    const hungrySvg = getCharacterSvgString('hungry', 'wife');
    const grumpySvg = getCharacterSvgString('grumpy', 'wife');
    const sadSvg = getCharacterSvgString('sad', 'husband');

    expect(tiredSvg).toContain('anim-tired');
    expect(hungrySvg).toContain('anim-hungry');
    expect(grumpySvg).toContain('anim-grumpy');
    expect(sadSvg).toContain('anim-sad');
  });

  it('supports corgi archetype with characteristic ears and muzzle', () => {
    const corgiSvg = getCharacterSvgString('happy', 'wife', 64, 'corgi');
    expect(corgiSvg).toContain('Corgi');
    expect(corgiSvg).toContain('#FB8C00');
    expect(corgiSvg).toContain('anim-happy');
  });

  it('supports human archetype with black-haired girl for wife and highlighted blonde guy for husband', () => {
    const girlSvg = getCharacterSvgString('happy', 'wife', 64, 'human');
    const guySvg = getCharacterSvgString('happy', 'husband', 64, 'human');

    // Wife: jet black hair and earrings
    expect(girlSvg).toContain('#12131A');
    expect(girlSvg).toContain('earrings');

    // Husband: dark hair base and blonde highlighted strands
    expect(guySvg).toContain('#20222B');
    expect(guySvg).toContain('#FAD02C');
    expect(guySvg).toContain('Blonde Highlights');
  });

  it('returns valid CharacterAvatar component descriptor', () => {
    const avatar = CharacterAvatar({ moodId: 'love', gender: 'wife', archetype: 'human', size: 80 });
    expect(avatar).toBeDefined();
    expect(avatar.props.moodId).toBe('love');
    expect(avatar.props.gender).toBe('wife');
    expect(avatar.props.archetype).toBe('human');
    expect(avatar.props.size).toBe(80);
    expect(avatar.props.svgXml).toContain('viewBox="0 0 64 64"');
  });
});
