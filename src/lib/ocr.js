import Tesseract from 'tesseract.js';

/**
 * Run OCR on an image source (canvas / dataURL / blob) and return raw text.
 */
export async function readText(image, onProgress) {
  const { data } = await Tesseract.recognize(image, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(Math.round(m.progress * 100));
    },
  });
  return data?.text || '';
}

/**
 * Extract likely product codes (HK / NO / TL / EXP) from OCR text.
 * Handles common OCR mix-ups (O→0, I/L→1) inside the numeric part and falls
 * back to treating a bare 6–9 digit run as an HK tag.
 * Returns an ordered, de-duplicated list of candidate codes.
 */
export function extractCodeCandidates(rawText) {
  if (!rawText) return [];
  const text = rawText.toUpperCase();
  const candidates = [];
  const seen = new Set();
  const push = (c) => {
    const code = c.replace(/\s+/g, '');
    if (code && !seen.has(code)) {
      seen.add(code);
      candidates.push(code);
    }
  };

  // normalise digit-like letters only inside detected tokens
  const fixDigits = (s) => s.replace(/O/g, '0').replace(/[IL]/g, '1').replace(/S/g, '5').replace(/B/g, '8');

  // 1) prefix + digits  (HK0765760, NO8626650, TL9690991, EXP8600995)
  const prefixed = text.match(/(HK|NO|TL|EXP)[\s]?[O0-9ILSB]{5,9}/g) || [];
  prefixed.forEach((m) => {
    const prefix = (m.match(/HK|NO|TL|EXP/) || ['HK'])[0];
    const rest = fixDigits(m.replace(/HK|NO|TL|EXP|\s/g, ''));
    if (rest.length >= 5) push(prefix + rest);
  });

  // 2) fallback: a standalone 6–9 digit run → assume HK tag
  const bare = text.match(/\b\d{6,9}\b/g) || [];
  bare.forEach((d) => push('HK' + d));

  return candidates;
}
