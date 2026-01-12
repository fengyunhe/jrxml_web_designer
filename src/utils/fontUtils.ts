import { SYSTEM_FONTS } from '../config/fonts.config';

const testFont = (fontFamily: string): boolean => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return false;

  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const testString = 'mmmmmmmmmmlli';

  context.font = '72px monospace';
  const baseWidth = context.measureText(testString).width;

  let available = false;
  for (const baseFont of baseFonts) {
    context.font = `72px ${fontFamily}, ${baseFont}`;
    const testWidth = context.measureText(testString).width;
    if (testWidth !== baseWidth) {
      available = true;
      break;
    }
  }

  return available;
};

export const getAvailableFonts = async (): Promise<string[]> => {
  if (typeof document === 'undefined') {
    return [...SYSTEM_FONTS];
  }

  const availableFonts: string[] = [];

  for (const font of SYSTEM_FONTS) {
    if (testFont(font)) {
      availableFonts.push(font);
    }
  }

  return availableFonts;
};

export const getSystemFonts = (): string[] => {
  if (typeof document === 'undefined') {
    return [...SYSTEM_FONTS];
  }

  if (document.fonts) {
    return [...SYSTEM_FONTS];
  }

  return [...SYSTEM_FONTS];
};
