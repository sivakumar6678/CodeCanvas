/**
 * Converts a 3 or 6 digit hex string to [r, g, b] (0-255)
 */
export function hexToRgb(hex = '') {
  let clean = hex.replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) {
    return [0, 0, 0];
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Calculates WCAG 2.1 relative luminance for an [r, g, b] color (0-255)
 */
export function getRelativeLuminance(rgb) {
  const [r, g, b] = rgb.map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates contrast ratio between two hex colors (e.g. 1.0 to 21.0)
 */
export function getContrastRatio(hex1, hex2) {
  const lum1 = getRelativeLuminance(hexToRgb(hex1));
  const lum2 = getRelativeLuminance(hexToRgb(hex2));
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

/**
 * Returns WCAG compliance level ('AAA', 'AA', or 'Fail')
 */
export function getWcagRating(ratio) {
  if (ratio >= 7.0) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'Fail';
}

/**
 * Generates Tailwind CSS theme.extend.colors JS snippet from a palette array
 */
export function generateTailwindConfig(palette = []) {
  const colorMap = {};
  palette.forEach((color, index) => {
    colorMap[`brand-${(index + 1) * 100}`] = color;
  });

  return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colorMap, null, 2)}
    }
  }
};`;
}

