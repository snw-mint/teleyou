/**
 * hct-picker.js
 * Material You HCT Color Picker — floating fixed div appended to <body>.
 * CSS is in style.css; this module handles DOM + interaction only.
 *
 * Dependencies: @material/material-color-utilities (already in project)
 *
 * Usage:
 *   import { createHctPicker } from './hct-picker.js';
 *
 *   const picker = createHctPicker({
 *     initialArgb: scheme.primary,
 *     label: 'Primary',
 *     onchange: (argb) => { ... },  // rAF-throttled, called on every slider move
 *     onclose:  (argb) => { ... },  // called when user confirms / dismisses
 *   });
 *
 *   picker.open(argb, triggerElement);   // anchor below an element
 *   picker.setLabel('Secondary', 'Supporting elements');
 *   picker.close();
 *   picker.destroy();
 */

import {
  Hct,
  hexFromArgb,
  argbFromHex,
} from '@material/material-color-utilities';
import {
  sanitizeHct,
  getSliderLimits,
  renderConstraintWarning,
} from './hct-constraints.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function argbToCss(argb) {
  return hexFromArgb(argb);
}

function cssToArgb(hex) {
  return argbFromHex(hex);
}

function hctToArgb(h, c, t) {
  return Hct.from(h, c, t).toInt();
}

function argbToHct(argb) {
  const hct = Hct.fromInt(argb);
  return { h: hct.hue, c: hct.chroma, t: hct.tone };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Render a gradient on a canvas by sampling N stops along one HCT axis.
 */
function renderGradient(canvas, axis, current, steps = 60, limits = null) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grad = ctx.createLinearGradient(0, 0, w, 0);

  const defaultRanges = { hue: [0, 360], chroma: [0, 120], tone: [0, 100] };
  const [lo, hi] = limits ? [limits[axis].min, limits[axis].max] : defaultRanges[axis];

  for (let i = 0; i <= steps; i++) {
    const pct = i / steps;
    const val = lo + pct * (hi - lo);
    let argb;
    if (axis === 'hue')    argb = hctToArgb(val,       current.c, current.t);
    if (axis === 'chroma') argb = hctToArgb(current.h, val,       current.t);
    if (axis === 'tone')   argb = hctToArgb(current.h, current.c, val);
    grad.addColorStop(pct, argbToCss(argb));
  }

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a reusable HCT color picker instance.
 *
 * @param {object}   opts
 * @param {number}   [opts.initialArgb]   — starting color as ARGB int
 * @param {string}   [opts.label]         — e.g. "Primary"
 * @param {string}   [opts.description]   — e.g. "Key actions & highlights"
 * @param {function} [opts.onchange]      — (argb: number) => void  (rAF-throttled)
 * @param {function} [opts.onclose]       — (argb: number) => void  (on OK / dismiss)
 */
export function createHctPicker(opts = {}) {
  const {
    initialArgb = 0xFF6750A4,
    label = 'Color',
    description = 'Hue · Chroma · Tone',
    onchange = () => {},
    onclose = () => {},
  } = opts;

  // ── State ──
  let hct = argbToHct(initialArgb);
  let originalArgb = initialArgb;
  let rafPending = false;
  let isOpen = false;
  let currentRole = 'primary';

  function sliderLimits() {
    return getSliderLimits(currentRole, hct);
  }

  // ── DOM Build ──
  const backdrop = document.createElement('div');
  backdrop.className = 'hct-picker-backdrop';
  backdrop.style.display = 'none';

  const el = document.createElement('div');
  el.className = 'hct-picker';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', `${label} color picker`);

  el.innerHTML = `
    <div class="hct-picker__header">
      <div class="hct-picker__swatch"></div>
      <div class="hct-picker__title-group">
        <div class="hct-picker__label">${label}</div>
        <div class="hct-picker__desc">${description}</div>
      </div>
    </div>

    <div class="hct-picker__hex-row">
      <span>#</span>
      <input class="hct-picker__hex-input" type="text" maxlength="6" spellcheck="false" />
    </div>

    <div class="hct-picker__sliders">
      ${['hue', 'chroma', 'tone'].map(axis => `
        <div class="hct-picker__slider-row" data-axis="${axis}">
          <div class="hct-picker__slider-meta">
            <span class="hct-picker__slider-name">${axis.charAt(0).toUpperCase() + axis.slice(1)}</span>
            <span class="hct-picker__slider-val"></span>
          </div>
          <div class="hct-picker__slider-track">
            <canvas class="hct-picker__slider-canvas" height="28"></canvas>
            <div class="hct-picker__slider-thumb"></div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="hct-picker__footer">
      <button class="hct-picker__btn hct-picker__btn--cancel">Cancel</button>
      <button class="hct-picker__btn hct-picker__btn--ok">OK</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(el);

  // ── Refs ──
  const swatch    = el.querySelector('.hct-picker__swatch');
  const hexInput  = el.querySelector('.hct-picker__hex-input');
  const rows      = { hue: null, chroma: null, tone: null };
  const canvases  = { hue: null, chroma: null, tone: null };
  const thumbs    = { hue: null, chroma: null, tone: null };
  const valLabels = { hue: null, chroma: null, tone: null };

  el.querySelectorAll('.hct-picker__slider-row').forEach(row => {
    const axis = row.dataset.axis;
    rows[axis]      = row;
    canvases[axis]  = row.querySelector('.hct-picker__slider-canvas');
    thumbs[axis]    = row.querySelector('.hct-picker__slider-thumb');
    valLabels[axis] = row.querySelector('.hct-picker__slider-val');
  });

  // ── Render ──
  function updateCanvasSize(canvas) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0) canvas.width = rect.width * window.devicePixelRatio;
  }

  function redrawAll() {
    const limits = sliderLimits();
    ['hue', 'chroma', 'tone'].forEach(axis => {
      updateCanvasSize(canvases[axis]);
      renderGradient(canvases[axis], axis, hct, 60, limits);
    });
    updateThumbs();
    updateSwatch();
    updateHexInput();
    updateValLabels();
  }

  function updateThumbs() {
    const limits = sliderLimits();
    ['hue', 'chroma', 'tone'].forEach(axis => {
      const lo = limits[axis].min, hi = limits[axis].max;
      const val = axis === 'hue' ? hct.h : axis === 'chroma' ? hct.c : hct.t;
      const pct = clamp((val - lo) / (hi - lo), 0, 1);
      const trackW = canvases[axis].getBoundingClientRect().width;
      thumbs[axis].style.left = `${pct * trackW}px`;
    });
  }

  function updateSwatch() {
    swatch.style.backgroundColor = argbToCss(hctToArgb(hct.h, hct.c, hct.t));
  }

  function updateHexInput() {
    hexInput.value = argbToCss(hctToArgb(hct.h, hct.c, hct.t)).replace('#', '').toUpperCase();
  }

  function updateValLabels() {
    valLabels.hue.textContent    = Math.round(hct.h) + '°';
    valLabels.chroma.textContent = Math.round(hct.c);
    valLabels.tone.textContent   = Math.round(hct.t);
  }

  // ── Emit change (rAF-throttled) ──
  function emitChange() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      onchange(hctToArgb(hct.h, hct.c, hct.t));
    });
  }

  // ── Slider drag ──
  function makeSliderHandler(axis) {
    function handleMove(clientX) {
      const limits = sliderLimits();
      const rect = canvases[axis].getBoundingClientRect();
      const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
      const lo = limits[axis].min, hi = limits[axis].max;
      const val = lo + pct * (hi - lo);

      if (axis === 'hue')    hct = { ...hct, h: val };
      if (axis === 'chroma') hct = { ...hct, c: val };
      if (axis === 'tone')   hct = { ...hct, t: val };

      const { h, c, t, warnings } = sanitizeHct(hct.h, hct.c, hct.t, currentRole);
      hct = { h, c, t };
      renderConstraintWarning(warnings, el);

      const newLimits = sliderLimits();
      ['hue', 'chroma', 'tone'].forEach(a => {
        if (a !== axis) {
          updateCanvasSize(canvases[a]);
          renderGradient(canvases[a], a, hct, 60, newLimits);
        }
      });
      updateThumbs();
      updateSwatch();
      updateHexInput();
      updateValLabels();
      emitChange();
    }

    const track = rows[axis].querySelector('.hct-picker__slider-track');

    track.addEventListener('pointerdown', e => {
      e.preventDefault();
      track.setPointerCapture(e.pointerId);
      handleMove(e.clientX);
    });

    track.addEventListener('pointermove', e => {
      if (!e.buttons) return;
      handleMove(e.clientX);
    });
  }

  ['hue', 'chroma', 'tone'].forEach(makeSliderHandler);

  // ── HEX input ──
  hexInput.addEventListener('input', () => {
    const raw = hexInput.value.trim();
    if (raw.length === 6 && /^[0-9a-fA-F]{6}$/.test(raw)) {
      const rawHct = argbToHct(cssToArgb('#' + raw));
      const { h, c, t, warnings } = sanitizeHct(rawHct.h, rawHct.c, rawHct.t, currentRole);
      hct = { h, c, t };
      renderConstraintWarning(warnings, el);
      // Redraw sliders/swatch but keep hex input showing what the user typed
      const limits = sliderLimits();
      ['hue', 'chroma', 'tone'].forEach(axis => {
        updateCanvasSize(canvases[axis]);
        renderGradient(canvases[axis], axis, hct, 60, limits);
      });
      updateThumbs();
      updateSwatch();
      updateValLabels();
      emitChange();
    }
  });

  // ── Buttons ──
  el.querySelector('.hct-picker__btn--ok').addEventListener('click', () => {
    onclose(hctToArgb(hct.h, hct.c, hct.t));
    close();
  });

  el.querySelector('.hct-picker__btn--cancel').addEventListener('click', () => {
    hct = argbToHct(originalArgb);
    redrawAll();
    onchange(originalArgb);
    onclose(originalArgb);
    close();
  });

  backdrop.addEventListener('click', () => {
    onclose(hctToArgb(hct.h, hct.c, hct.t));
    close();
  });

  // ── Keyboard ──
  el.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      hct = argbToHct(originalArgb);
      redrawAll();
      onchange(originalArgb);
      onclose(originalArgb);
      close();
    }
    if (e.key === 'Enter') {
      onclose(hctToArgb(hct.h, hct.c, hct.t));
      close();
    }
  });

  // ── Position logic ──
  function position(anchorEl) {
    const MARGIN = 8;
    const pickerW = 288 + 48;
    const pickerH = 420;

    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      let top  = rect.bottom + MARGIN;
      let left = rect.left;

      if (top + pickerH > window.innerHeight - MARGIN) {
        top = rect.top - pickerH - MARGIN;
      }
      if (left + pickerW > window.innerWidth - MARGIN) {
        left = window.innerWidth - pickerW - MARGIN;
      }
      left = Math.max(MARGIN, left);
      top  = Math.max(MARGIN, top);

      el.style.top  = `${top}px`;
      el.style.left = `${left}px`;
      el.style.transformOrigin = top < rect.top ? 'bottom left' : 'top left';
    }
  }

  // ── Public API ──
  function open(argb, anchorEl) {
    if (isOpen) return;
    isOpen = true;

    if (argb != null) {
      originalArgb = argb;
      const raw = argbToHct(argb);
      const { h, c, t } = sanitizeHct(raw.h, raw.c, raw.t, currentRole);
      hct = { h, c, t };
    }
    renderConstraintWarning([], el);

    backdrop.style.display = 'block';
    el.style.display = 'flex';

    position(anchorEl);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        redrawAll();
        el.classList.add('open');
        hexInput.focus();
      });
    });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    el.classList.remove('open');
    backdrop.style.display = 'none';
    setTimeout(() => {
      if (!isOpen) el.style.display = 'none';
    }, 220);
  }

  function destroy() {
    el.remove();
    backdrop.remove();
  }

  el.style.display = 'none';

  return {
    open,
    close,
    destroy,
    setColor(argb) {
      hct = argbToHct(argb);
      if (isOpen) redrawAll();
    },
    /** Update the header label and description without reopening */
    setLabel(newLabel, newDesc) {
      el.querySelector('.hct-picker__label').textContent = newLabel;
      el.querySelector('.hct-picker__desc').textContent = newDesc ?? '';
      el.setAttribute('aria-label', `${newLabel} color picker`);
    },
    /** Set the active role for constraint enforcement and slider limits */
    setRole(newRole) {
      currentRole = newRole || 'primary';
      if (isOpen) redrawAll();
    },
    get isOpen() { return isOpen; },
  };
}
