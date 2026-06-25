/**
 * MarioSprite — Pixel-art character, warna diambil dari karakter.png
 * Palet: merah #F93700, emas/coklat #AF8000, kulit #FFAD46
 * Grid: 20 × 26 unit, di-render sebagai SVG (crisp di semua resolusi)
 * State: idle | walk | jump
 */
import { useEffect, useRef, useState } from 'react';

/* ── Palet ──────────────────────────────────────────────────────────────────── */
const SKIN  = '#FFAD46';
const SKINS = '#D4862A';      // skin shadow
const RED   = '#F93700';
const REDK  = '#B52B00';      // red dark
const GOLD  = '#B88800';
const GOLDK = '#7A5C00';      // gold dark
const HAIR  = '#2E1800';
const EYE   = '#0D0700';
const WHT   = '#FFFDF0';
const SHOE  = '#3C1E00';
const SHOEK = '#1A0900';
const GLOVE = '#F5F5F5';

/* ── SVG rect helper ────────────────────────────────────────────────────────── */
const R = (x, y, w, h, f) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;

/* ── Static parts ────────────────────────────────────────────────────────────
   Coordinate system: 20 cols × 26 rows (0-indexed)
   Hat top: rows 0-2  |  Face: rows 3-8  |  Body: rows 9-16
   Pants: rows 17-20  |  Legs/feet: rows 21-26
*/

function hat() {
  return (
    R(6,0,8,1,HAIR)   +   // hair peek
    R(5,1,10,1,RED)   +   // hat brim left
    R(4,2,12,2,RED)   +   // hat brim wider
    R(5,4,10,1,REDK)  +   // brim shadow
    // 'M' initial on hat
    R(7,1,1,3,WHT) + R(9,1,1,3,WHT) + R(8,2,1,1,WHT)
  );
}

function face() {
  return (
    // ears
    R(2,6,2,3,SKIN) + R(16,6,2,3,SKIN) +
    R(2,7,1,1,SKINS)+ R(17,7,1,1,SKINS)+
    // face base
    R(4,5,12,6,SKIN)+
    // hairline
    R(4,5,12,1,HAIR)+
    R(4,6,2,1,HAIR) + R(14,6,2,1,HAIR)+
    // whites of eyes
    R(5,6,4,3,WHT) + R(11,6,4,3,WHT)+
    // pupils
    R(6,7,2,2,EYE) + R(12,7,2,2,EYE)+
    // pupil shine
    R(7,7,1,1,WHT) + R(13,7,1,1,WHT)+
    // nose
    R(9,9,3,1,SKINS)+ R(8,10,4,1,SKINS)+
    // moustache
    R(5,9,10,2,HAIR)+
    // mouth
    R(7,11,6,1,HAIR)+
    // cheeks
    R(4,9,2,2,SKINS)+ R(14,9,2,2,SKINS)
  );
}

function torso() {
  return (
    // neck
    R(8,11,4,1,SKIN)+
    // shirt / overalls outer (red)
    R(3,12,14,6,RED)+
    R(3,16,14,2,REDK)+
    // shoulders
    R(2,12,2,3,RED)+ R(16,12,2,3,RED)+
    // overalls bib (gold)
    R(7,12,6,5,GOLD)+
    R(7,15,6,2,GOLDK)+
    // pocket / button detail
    R(9,13,2,2,GOLDK)+
    // belt
    R(3,18,14,1,GOLDK)+
    R(8,18,4,1,GOLD)+   // buckle
    R(9,18,2,1,WHT)     // buckle shine
  );
}

/* ── Arms: phase 0 = right fwd, 1 = neutral, 2 = left fwd, 3 = neutral ───── */
function arms(phase) {
  if (phase === 0) return (
    R(0,14,3,4,SKIN)+R(0,17,3,1,GOLDK)+ // left arm back-low
    R(1,18,2,2,GLOVE)+
    R(17,11,3,4,SKIN)+R(17,14,3,1,GOLDK)+ // right arm fwd-high
    R(17,15,2,2,GLOVE)
  );
  if (phase === 2) return (
    R(0,11,3,4,SKIN)+R(0,14,3,1,GOLDK)+  // left arm fwd-high
    R(0,15,2,2,GLOVE)+
    R(17,14,3,4,SKIN)+R(17,17,3,1,GOLDK)+ // right arm back-low
    R(17,18,2,2,GLOVE)
  );
  // neutral (phase 1 & 3)
  return (
    R(0,12,3,5,SKIN)+R(0,17,2,2,GLOVE)+
    R(17,12,3,5,SKIN)+R(17,17,2,2,GLOVE)
  );
}

/* ── Legs: 4-phase walk cycle ────────────────────────────────────────────────
   Left leg = x 3-7  |  Right leg = x 10-14
*/
function legs(phase) {
  if (phase === 0) {
    // right leg forward-low, left leg back-high
    return (
      // left leg (back)
      R(3,19,5,4,GOLD)+ R(3,22,5,2,GOLDK)+
      R(2,23,6,3,SHOE)+ R(2,25,6,1,SHOEK)+
      // right leg (forward, extended)
      R(11,19,5,3,GOLD)+ R(11,21,6,3,GOLDK)+
      R(12,23,7,3,SHOE)+ R(12,25,7,1,SHOEK)
    );
  }
  if (phase === 1) {
    // both legs centre (mid-stride)
    return (
      R(3,19,5,5,GOLD)+  R(3,23,5,1,GOLDK)+
      R(2,23,6,3,SHOE)+  R(2,25,6,1,SHOEK)+
      R(11,19,5,5,GOLD)+ R(11,23,5,1,GOLDK)+
      R(11,23,6,3,SHOE)+ R(11,25,6,1,SHOEK)
    );
  }
  if (phase === 2) {
    // left leg forward-low, right leg back-high
    return (
      // left leg (forward)
      R(3,19,5,3,GOLD)+ R(3,21,6,3,GOLDK)+
      R(2,23,7,3,SHOE)+ R(2,25,7,1,SHOEK)+
      // right leg (back)
      R(11,19,5,4,GOLD)+ R(11,22,5,2,GOLDK)+
      R(11,23,6,3,SHOE)+ R(11,25,6,1,SHOEK)
    );
  }
  // phase 3 = same as 1
  return (
    R(3,19,5,5,GOLD)+  R(3,23,5,1,GOLDK)+
    R(2,23,6,3,SHOE)+  R(2,25,6,1,SHOEK)+
    R(11,19,5,5,GOLD)+ R(11,23,5,1,GOLDK)+
    R(11,23,6,3,SHOE)+ R(11,25,6,1,SHOEK)
  );
}

function jumpPose() {
  return (
    // arms raised diagonally
    R(0,9,3,4,SKIN)+  R(0,8,2,2,GLOVE)+
    R(17,9,3,4,SKIN)+ R(18,8,2,2,GLOVE)+
    // legs bent & spread
    R(2,19,5,4,GOLD)+  R(1,22,6,3,SHOE)+ R(1,24,6,1,SHOEK)+
    R(12,19,5,4,GOLD)+ R(13,22,6,3,SHOE)+R(13,24,6,1,SHOEK)
  );
}

function idlePose() {
  return (
    arms(1) + legs(1)
  );
}

/* ── Assemble full SVG ───────────────────────────────────────────────────────── */
function buildSVG(state, phase) {
  const body = hat() + face() + torso();
  const limbs =
    state === 'jump' ? jumpPose() :
    state === 'idle' ? idlePose() :
    arms(phase) + legs(phase);   // walk

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 26" shape-rendering="crispEdges">` +
    body + limbs +
    `</svg>`
  );
}

function toDataURL(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/* ── React Component ─────────────────────────────────────────────────────────── */
const WALK_FPS = 9;
const IDLE_FPS = 2;

export default function MarioSprite({ state = 'idle', facingLeft = false, size = 80 }) {
  const [phase, setPhase] = useState(1);
  const timerRef = useRef(null);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (state === 'jump') { setPhase(0); return; }
    if (state === 'idle') { setPhase(1); return; }
    // walk
    const fps = WALK_FPS;
    timerRef.current = setInterval(() => {
      setPhase(p => (p + 1) % 4);
    }, 1000 / fps);
    return () => clearInterval(timerRef.current);
  }, [state]);

  // idle slow blink: phase toggles 1↔2 slowly
  useEffect(() => {
    if (state !== 'idle') return;
    const t = setInterval(() => setPhase(p => p === 1 ? 2 : 1), 1000 / IDLE_FPS);
    return () => clearInterval(t);
  }, [state]);

  const h = Math.round(size * 26 / 20); // keep aspect ratio 20:26
  const src = toDataURL(buildSVG(state, phase));

  return (
    <div style={{
      width: size,
      height: h,
      transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)',
      transition: 'transform 0.08s',
      filter: 'drop-shadow(2px 6px 8px rgba(0,0,0,0.55))',
      // vertical bob while walking
      animation: state === 'walk' ? 'marioWalkBob 0.22s ease-in-out infinite' : 'none',
    }}>
      <img
        src={src}
        alt="karakter"
        width={size}
        height={h}
        style={{ imageRendering: 'pixelated', display: 'block' }}
        draggable={false}
      />
    </div>
  );
}
