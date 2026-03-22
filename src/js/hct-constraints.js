import { Hct, hexFromArgb } from '@material/material-color-utilities';
export const ROLE_CONSTRAINTS = {
  primary: {
    tone: { min: 10, max: 90 },
    chroma: { min: 12, max: 100 },
    hue: { min: 0, max: 360 },
    fallback: { h: 270, c: 60, t: 40 },
    label: 'Primary',
    hint: 'Avoid pure black, white, or grey. Needs enough colour to generate contrast.',
  },
  secondary: {
    tone: { min: 10, max: 90 },
    chroma: { min: 4, max: 60 },
    hue: { min: 0, max: 360 },
    fallback: { h: 270, c: 24, t: 40 },
    label: 'Secondary',
    hint: 'Should be less saturated than Primary.',
  },
  tertiary: {
    tone: { min: 10, max: 90 },
    chroma: { min: 4, max: 60 },
    hue: { min: 0, max: 360 },
    fallback: { h: 330, c: 24, t: 40 },
    label: 'Tertiary',
    hint: 'Accent colour, should complement Primary.',
  },
  error: {
    tone: { min: 10, max: 90 },
    chroma: { min: 48, max: 100 },
    hue: { min: 0, max: 35 },
    fallback: { h: 25, c: 84, t: 40 },
    label: 'Error',
    hint: 'Must stay in the red family (0–35°). Needs high saturation.',
  },
  neutral: {
    tone: { min: 10, max: 90 },
    chroma: { min: 0, max: 12 },
    hue: { min: 0, max: 360 },
    fallback: { h: 270, c: 4, t: 40 },
    label: 'Neutral',
    hint: 'Used for surfaces and text. Must stay near-grey (low chroma).',
  },
  neutralVariant: {
    tone: { min: 10, max: 90 },
    chroma: { min: 0, max: 16 },
    hue: { min: 0, max: 360 },
    fallback: { h: 270, c: 8, t: 40 },
    label: 'Neutral Variant',
    hint: 'Slightly more colourful than Neutral. Used for outlines and secondary text.',
  },
};
function isInGamut(h, c, t) {
  const argb = Hct.from(h, c, t).toInt();
  const back = Hct.fromInt(argb);
  return back.chroma >= c - 2;
}
export function maxChromaForHueTone(hue, tone, step = 1) {
  for (let c = 120; c >= 0; c -= step) {
    if (isInGamut(hue, c, tone)) return c;
  }
  return 0;
}
export function sanitizeHct(h, c, t, role = 'primary') {
  const rules = ROLE_CONSTRAINTS[role];
  if (!rules) return { h, c, t, warnings: [] };
  const warnings = [];
  let sh = h,
    sc = c,
    st = t;
  sh = ((sh % 360) + 360) % 360;
  if (rules.hue.max < 360) {
    if (sh < rules.hue.min || sh > rules.hue.max) {
      const fb = rules.fallback;
      warnings.push(
        `${rules.label} hue must be between ${rules.hue.min}° and ${rules.hue.max}°. ` + `Clamped to ${fb.h}°.`,
      );
      sh = fb.h;
    }
  }
  if (st < rules.tone.min) {
    warnings.push(`Tone too dark (${Math.round(st)}). Minimum is ${rules.tone.min}.`);
    st = rules.tone.min;
  }
  if (st > rules.tone.max) {
    warnings.push(`Tone too light (${Math.round(st)}). Maximum is ${rules.tone.max}.`);
    st = rules.tone.max;
  }
  if (sc < rules.chroma.min) {
    warnings.push(`Chroma too low (${Math.round(sc)}). Minimum for ${rules.label} is ${rules.chroma.min}.`);
    sc = rules.chroma.min;
  }
  if (sc > rules.chroma.max) {
    warnings.push(`Chroma too high (${Math.round(sc)}). Maximum for ${rules.label} is ${rules.chroma.max}.`);
    sc = rules.chroma.max;
  }
  const gamutMax = maxChromaForHueTone(sh, st);
  if (sc > gamutMax) {
    warnings.push(
      `Colour is outside sRGB gamut at this hue/tone. ` +
        `Chroma reduced from ${Math.round(sc)} to ${Math.round(gamutMax)}.`,
    );
    sc = gamutMax;
  }
  return { h: sh, c: sc, t: st, warnings };
}
export function getSliderLimits(role = 'primary', current = { h: 270, c: 60, t: 40 }) {
  const rules = ROLE_CONSTRAINTS[role] ?? ROLE_CONSTRAINTS.primary;
  const gamutChromaMax = maxChromaForHueTone(current.h, current.t, 2);
  const chromaMax = Math.min(rules.chroma.max, gamutChromaMax);
  return {
    hue: { min: rules.hue.min, max: rules.hue.max },
    chroma: { min: rules.chroma.min, max: chromaMax },
    tone: { min: rules.tone.min, max: rules.tone.max },
  };
}
export function renderConstraintWarning(warnings, pickerEl) {
  const old = pickerEl.querySelector('.hct-picker__warning');
  if (old) old.remove();
  if (!warnings.length) return;
  const el = document.createElement('div');
  el.className = 'hct-picker__warning';
  el.textContent = warnings[0];
  const footer = pickerEl.querySelector('.hct-picker__footer');
  if (footer) pickerEl.insertBefore(el, footer);
  else pickerEl.appendChild(el);
}
export function sanitizeArgb(argb, role = 'primary') {
  const hct = Hct.fromInt(argb);
  const { h, c, t, warnings } = sanitizeHct(hct.hue, hct.chroma, hct.tone, role);
  return {
    argb: Hct.from(h, c, t).toInt(),
    warnings,
  };
}
