function hexChannels(value: string) {
  const normalized = value.replace("#", "");
  const full = normalized.length === 3 ? normalized.split("").map((part) => part + part).join("") : normalized;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((offset) => Number.parseInt(full.slice(offset, offset + 2), 16) / 255);
}

export function luminance(hex: string) {
  const channels = hexChannels(hex);
  if (!channels) return 0;
  return channels.reduce((total, channel, index) => {
    const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return total + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
}

export function contrastRatio(first: string, second: string) {
  const high = Math.max(luminance(first), luminance(second));
  const low = Math.min(luminance(first), luminance(second));
  return (high + 0.05) / (low + 0.05);
}

export function accentContent(accent: string) {
  return contrastRatio(accent, "#111716") >= contrastRatio(accent, "#fffdf7") ? "#111716" : "#fffdf7";
}
