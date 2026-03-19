/**
 * hct-constraints.js
 * Material You color constraints and gamut sanitization.
 *
 * Enforces the same limits the Material You spec applies when generating
 * color schemes — preventing pure black/white, over-saturated primaries,
 * achromatic accents, wrong-hue errors, etc.
 *
 * Usage:
 *   import { sanitizeHct, ROLE_CONSTRAINTS, getSliderLimits } from './hct-constraints.js';
 *
 *   // Before applying a user-picked color:
 *   const safe = sanitizeHct(hue, chroma, tone, 'primary');
 *
 *   // To drive slider min/max in the picker UI:
 *   const limits = getSliderLimits('primary', current);
 *   // → { hue: {min,max}, chroma: {min,max}, tone: {min,max} }
 */

import { Hct, hexFromArgb } from '@material/material-color-utilities';

// ─── Per-role constraints ─────────────────────────────────────────────────────

export const ROLE_CONSTRAINTS = {
  primary: {
    tone:   { min: 10, max: 90 },
    chroma: { min: 12, max: 100 },
    hue:    { min: 0,  max: 360 },
    fallback: { h: 270, c: 60, t: 40 },
    label: 'Primary',
    hint: 'Avoid pure black, white, or grey. Needs enough colour to generate contrast.',
  },
  secondary: {
    tone:   { min: 10, max: 90 },
    chroma: { min: 4,  max: 60 },
    hue:    { min: 0,  max: 360 },
    fallback: { h: 270, c: 24, t: 40 },
    label: 'Secondary',
    hint: 'Should be less saturated than Primary.',
  },
  tertiary: {
    tone:   { min: 10, max: 90 },
    chroma: { min: 4,  max: 60 },
    hue:    { min: 0,  max: 360 },
    fallback: { h: 330, c: 24, t: 40 },
    label: 'Tertiary',
    hint: 'Accent colour, should complement Primary.',
  },
  error: {
    tone:   { min: 10, max: 90 },
    chroma: { min: 48, max: 100 },
    hue:    { min: 0,  max: 35  },
    fallback: { h: 25, c: 84, t: 40 },
    label: 'Error',
    hint: 'Must stay in the red family (0–35°). Needs high saturation.',
  },
  neutral: {
    tone:   { min: 10, max: 90 },
    chroma: { min: 0,  max: 12  },
    hue:    { min: 0,  max: 360 },
    fallback: { h: 270, c: 4, t: 40 },
    label: 'Neutral',
    hint: 'Used for surfaces and text. Must stay near-grey (low chroma).',
  },
  neutralVariant: {
    tone:   { min: 10, max: 90 },
    chroma: { min: 0,  max: 16  },
    hue:    { min: 0,  max: 360 },
    fallback: { h: 270, c: 8, t: 40 },
    label: 'Neutral Variant',
    hint: 'Slightly more colourful than Neutral. Used for outlines and secondary text.',
  },
};

// ─── Gamut check ─────────────────────────────────────────────────────────────

function isInGamut(h, c, t) {
  const argb = Hct.from(h, c, t).toInt();
  const back = Hct.fromInt(argb);
  return back.chroma >= c - 2;
}

/**
 * Find the maximum in-gamut chroma for a given hue and tone.
 */
export function maxChromaForHueTone(hue, tone, step = 1) {
  for (let c = 120; c >= 0; c -= step) {
    if (isInGamut(hue, c, tone)) return c;
  }
  return 0;
}

// ─── Sanitize ─────────────────────────────────────────────────────────────────

/**
 * Clamp and adjust an HCT triplet to satisfy the Material You constraints
 * for a given role. Returns a safe { h, c, t, warnings } object.
 *
 * @param {number} h    — hue (0–360)
 * @param {number} c    — chroma (0–120)
 * @param {number} t    — tone (0–100)
 * @param {string} role — key of ROLE_CONSTRAINTS
 * @returns {{ h: number, c: number, t: number, warnings: string[] }}
 */
export function sanitizeHct(h, c, t, role = 'primary') {
  const rules = ROLE_CONSTRAINTS[role];
  if (!rules) return { h, c, t, warnings: [] };

  const warnings = [];
  let sh = h, sc = c, st = t;

  // 1. Hue wrapping
  sh = ((sh % 360) + 360) % 360;

  // 2. Hue range lock (error only)
  if (rules.hue.max < 360) {
    if (sh < rules.hue.min || sh > rules.hue.max) {
      const fb = rules.fallback;
      warnings.push(
        `${rules.label} hue must be between ${rules.hue.min}° and ${rules.hue.max}°. ` +
        `Clamped to ${fb.h}°.`
      );
      sh = fb.h;
    }
  }

  // 3. Tone range
  if (st < rules.tone.min) {
    warnings.push(`Tone too dark (${Math.round(st)}). Minimum is ${rules.tone.min}.`);
    st = rules.tone.min;
  }
  if (st > rules.tone.max) {
    warnings.push(`Tone too light (${Math.round(st)}). Maximum is ${rules.tone.max}.`);
    st = rules.tone.max;
  }

  // 4. Chroma minimum
  if (sc < rules.chroma.min) {
    warnings.push(
      `Chroma too low (${Math.round(sc)}). Minimum for ${rules.label} is ${rules.chroma.min}.`
    );
    sc = rules.chroma.min;
  }

  // 5. Chroma maximum (role ceiling)
  if (sc > rules.chroma.max) {
    warnings.push(
      `Chroma too high (${Math.round(sc)}). Maximum for ${rules.label} is ${rules.chroma.max}.`
    );
    sc = rules.chroma.max;
  }

  // 6. Gamut clamp
  const gamutMax = maxChromaForHueTone(sh, st);
  if (sc > gamutMax) {
    warnings.push(
      `Colour is outside sRGB gamut at this hue/tone. ` +
      `Chroma reduced from ${Math.round(sc)} to ${Math.round(gamutMax)}.`
    );
    sc = gamutMax;
  }

  return { h: sh, c: sc, t: st, warnings };
}

// ─── Slider limits ────────────────────────────────────────────────────────────

/**
 * Get the slider min/max values for a given role.
 * The chroma ceiling is the minimum of the role max and the current gamut max.
 *
 * @param {string} role
 * @param {{ h, c, t }} current
 * @returns {{ hue, chroma, tone }} each with { min, max }
 */
export function getSliderLimits(role = 'primary', current = { h: 270, c: 60, t: 40 }) {
  const rules = ROLE_CONSTRAINTS[role] ?? ROLE_CONSTRAINTS.primary;
  const gamutChromaMax = maxChromaForHueTone(current.h, current.t, 2);
  const chromaMax = Math.min(rules.chroma.max, gamutChromaMax);

  return {
    hue:    { min: rules.hue.min,    max: rules.hue.max    },
    chroma: { min: rules.chroma.min, max: chromaMax         },
    tone:   { min: rules.tone.min,   max: rules.tone.max    },
  };
}

// ─── Warning renderer ─────────────────────────────────────────────────────────

/**
 * Show an inline warning inside the picker element when a constraint fires.
 * Styling lives in .hct-picker__warning in style.css.
 *
 * @param {string[]} warnings
 * @param {HTMLElement} pickerEl
 */
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

// ─── ARGB convenience wrapper ─────────────────────────────────────────────────

/**
 * Sanitize an ARGB int for a given role. Returns a safe ARGB int.
 *
 * @param {number} argb
 * @param {string} role
 * @returns {{ argb: number, warnings: string[] }}
 */
export function sanitizeArgb(argb, role = 'primary') {
  const hct = Hct.fromInt(argb);
  const { h, c, t, warnings } = sanitizeHct(hct.hue, hct.chroma, hct.tone, role);
  return {
    argb: Hct.from(h, c, t).toInt(),
    warnings,
  };
}
