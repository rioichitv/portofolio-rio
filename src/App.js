import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { playJumpSound, playSlideSound, playCoinSound } from './useMarioSound';
import MarioSprite from './MarioSprite';

// ============ DATA ============
const SLIDES = [
  { id: 'beranda',    label: 'Beranda',     flag: 'WORLD 1-1' },
  { id: 'tentang',   label: 'Tentang Saya', flag: 'WORLD 1-2' },
  { id: 'portfolio', label: 'Portfolio',    flag: 'WORLD 1-3' },
  { id: 'pendidikan',label: 'Pendidikan',   flag: 'WORLD 1-4' },
  { id: 'pengalaman',label: 'Pengalaman',   flag: 'WORLD 1-5' },
  { id: 'kontak',    label: 'Kontak',       flag: 'WORLD 1-6' },
];

const DECORATIONS_INITIAL = [
  // Slide 0 (Beranda)
  [
    { id: 's0-d0', type: 'block-question', x: '10%', y: 215 },
    { id: 's0-d1', type: 'block-question', x: '15%', y: 215 },
    { id: 's0-d2', type: 'coin', x: '12.5%', y: 275 },
    { id: 's0-d3', type: 'pipe', x: '50%' },
  ],
  // Slide 1 (Tentang)
  [
    { id: 's1-d0', type: 'pipe', x: '50%' },
    { id: 's1-d1', type: 'block-brick', x: '10%', y: 230 },
    { id: 's1-d2', type: 'block-brick', x: '14%', y: 230 },
    { id: 's1-d3', type: 'block-question', x: '18%', y: 230 },
    { id: 's1-d4', type: 'block-brick', x: '22%', y: 230 },
    { id: 's1-d5', type: 'coin', x: '18%', y: 290 },
  ],
  // Slide 2 (Portfolio)
  [
    { id: 's2-d0', type: 'block-question', x: '8%', y: 215 },
    { id: 's2-d1', type: 'coin', x: '6%', y: 275 },
    { id: 's2-d2', type: 'coin', x: '10%', y: 275 },
    { id: 's2-d3', type: 'pipe', x: '50%' },
  ],
  // Slide 3 (Pendidikan)
  [
    { id: 's3-d0', type: 'pipe', x: '50%' },
    { id: 's3-d1', type: 'block-brick', x: '10%', y: 220 },
    { id: 's3-d2', type: 'block-question', x: '15%', y: 220 },
    { id: 's3-d3', type: 'coin', x: '12.5%', y: 280 },
  ],
  // Slide 4 (Pengalaman)
  [
    { id: 's4-d0', type: 'block-question', x: '10%', y: 215 },
    { id: 's4-d1', type: 'block-question', x: '15%', y: 215 },
    { id: 's4-d2', type: 'coin', x: '12.5%', y: 275 },
    { id: 's4-d3', type: 'pipe', x: '50%' },
  ],
  // Slide 5 (Kontak)
  [
    { id: 's5-d0', type: 'block-brick', x: '10%', y: 225 },
    { id: 's5-d1', type: 'coin', x: '10%', y: 285 },
    { id: 's5-d2', type: 'flagpole' },
  ],
];

const MARIO_SPEED = 6;
const JUMP_HEIGHT = 180;
const SLIDE_THRESHOLD = 0.96; // 96% of slide width

// ============ CLOUD ============
function Clouds() {
  return (
    <div className="clouds-layer">
      <div className="cloud cloud-1" style={{ left: '10%' }} />
      <div className="cloud cloud-2" style={{ left: '40%' }} />
      <div className="cloud cloud-3" style={{ left: '65%' }} />
    </div>
  );
}

// ============ NIGHT STARS ============
function NightStars({ count = 30 }) {
  const stars = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 60,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 2,
  }));
  return (
    <div className="night-stars">
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            left: s.x + '%', top: s.y + '%',
            width: s.size + 'px', height: s.size + 'px',
            animationDelay: s.delay + 's',
          }}
        />
      ))}
    </div>
  );
}

// ============ HILLS ============
function Hills({ config = [] }) {
  return (
    <div className="hills">
      {config.map((h, i) => (
        <div key={i} className="hill" style={{ left: h.x, width: h.w, height: h.h }} />
      ))}
    </div>
  );
}

// ============ GROUND DECORATIONS ============
function GroundDecos({ items = [], isMobile, flagY }) {
  return (
    <>
      {items.map((item, i) => {
        if (item.type === 'pipe') {
          return (
            <div key={i} className="pipe" style={{ left: item.x }}>
              <div className="pipe-top" />
              <div className="pipe-body" />
            </div>
          );
        }
        if (item.type === 'flagpole') {
          return (
            <div key={i} className="flagpole" style={{ right: isMobile ? '20px' : '80px' }}>
              <div className="flagpole-ball" />
              <div className="flagpole-pole" />
              <div className="flagpole-flag" style={{ transform: `translateY(${flagY}px)` }} />
            </div>
          );
        }
        if (item.type === 'coin') {
          if (item.collected) return null;
          return <div key={i} className="coin" style={{ left: item.x, bottom: item.y + 'px' }} />;
        }
        
        const isHit = item.hit;
        const isHitting = item.isHitting;
        
        return (
          <React.Fragment key={i}>
            <div 
              className={`block ${item.type} ${isHit ? 'hit' : ''} ${isHitting ? 'bounce' : ''}`}
              style={{ left: item.x, bottom: item.y + 'px' }}
            >
              {!isHit && item.type === 'block-question' ? '?' : ''}
            </div>
            {isHitting && (
              <div 
                className="popping-coin" 
                style={{ left: `calc(${item.x} + 13px)`, bottom: (item.y + 50) + 'px' }} 
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

// ============ SLIDE CONTENTS ============
function SlideBerandaContent() {
  return (
    <div className="slide-content">
      <div className="pixel-card" style={{ textAlign: 'center' }}>
        <div className="beranda-title">Rio Developer</div>
        <div className="beranda-subtitle">Full Stack Web Developer</div>
        <p className="beranda-desc">
          Halo! Saya seorang developer yang passionate dalam membangun web yang keren,
          fungsional, dan user-friendly. Selamat datang di dunia saya! 
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="skill-tag skill-red">React.js</span>
          <span className="skill-tag skill-blue">Node.js</span>
          <span className="skill-tag skill-green">Laravel</span>
          <span className="skill-tag skill-yellow">MySQL</span>
          <span className="skill-tag skill-purple">CodeIgniter</span>
          <span className="skill-tag skill-purple">Python</span>
        </div>
        <p className="start-arrow">▶ Tekan → untuk mulai petualangan!</p>
      </div>
    </div>
  );
}

function SlideTentangContent() {
  return (
    <div className="slide-content">
      <div className="pixel-card" style={{ maxWidth: '750px' }}>
        <div className="section-title">TENTANG SAYA</div>
        <div className="section-flag">WORLD 1-2</div>
        <div className="about-grid">
          <div className="about-avatar">
            <div className="avatar-frame">
              <img src="/mario.png" alt="Rio" />
            </div>
            <div className="avatar-name">RIO</div>
            <div className="avatar-role">Full Stack Dev</div>
          </div>
          <div className="about-text">
            <p>
              Saya adalah Full Stack Web Developer dengan pengalaman membangun aplikasi
              web modern yang scalable dan berkualitas tinggi.
            </p>
            <p>
              Saya suka memecahkan masalah kompleks dengan solusi yang elegan,
              belajar teknologi baru, dan berkolaborasi dalam tim yang dinamis.
            </p>
            <div className="skills-list">
              <span className="skill-tag skill-red">HTML/CSS</span>
              <span className="skill-tag skill-blue">JavaScript</span>
              <span className="skill-tag skill-red">React.js</span>
              <span className="skill-tag skill-green">PHP</span>
              <span className="skill-tag skill-green">Laravel</span>
              <span className="skill-tag skill-blue">Node.js</span>
              <span className="skill-tag skill-yellow">MySQL</span>
              <span className="skill-tag skill-purple">Git</span>
              <span className="skill-tag skill-purple">CodeIgniter</span>
              <span className="skill-tag skill-purple">MySQL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlidePortfolioContent() {
  const projects = [
    { icon: '', title: 'E-Commerce', desc: 'Platform belanja online dengan fitur lengkap', tech: ['CodeIgniter4', 'MySQL'], color: '#e52222', url: 'https://riostore.id' },
    { icon: '', title: 'Forum Marketplace', desc: 'Forum Platform Jual Beli Games dengan fitur lengkap', tech: ['Next.js', 'Node.js', 'MySQL'], color: '#1a6ed8', url: 'https://akunfarispedia.com' },
    { icon: '', title: 'Website Bisindo', desc: 'Website yang dibuat untuk komunikasi inklusif', tech: ['Next,js', 'Node.js', 'MySQL'], color: '#3cb043', url: 'https://github.com/rioichitv/website-sysnable-ai' },
    { icon: '', title: 'E-Commerce Amour Hijab', desc: 'Platform belanja hijab online fitur lengkap dengan pembayaran', tech: ['Laravel', 'MySQL'], color: '#f5c518', url: 'https://github.com/rioichitv/AmourHijab' },
    { icon: '', title: 'Kampung Tematik', desc: 'Website untuk memperkenalkan ciri khas daerah', tech: ['Laravel', 'MySQL', 'Bootstrap'], color: '#7c3aed', url: 'https://github.com/rioichitv/kampung-tematik' },
    { icon: '', title: 'Profil Github', desc: 'Github saya untuk menunjukkan profil dan portofolio saya', tech: ['React', 'Node.js', 'PostgreSQL'], color: '#c84b11', url: 'https://github.com/rioichitv' },
  ];

  return (
    <div className="slide-content">
      <div className="pixel-card" style={{ maxWidth: '860px' }}>
        <div className="section-title">PORTFOLIO</div>
        <div className="section-flag">WORLD 1-3</div>
        <div className="portfolio-grid">
          {projects.map((p, i) => (
            <div key={i} className="portfolio-card" style={{ '--card-color': p.color }}>
              <div className="card-icon">{p.icon}</div>
              <div className="card-title">{p.title}</div>
              <div className="card-desc">{p.desc}</div>
              <div className="card-tech">
                {p.tech.map((t, j) => <span key={j} className="tech-badge">{t}</span>)}
              </div>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-lihat-project"
                onClick={(e) => e.stopPropagation()}
              >
                ▶ Lihat Project
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlidePendidikanContent() {
  const edu = [
    { year: '2024-Sekarang', title: 'D3 Teknologi Informasi', sub: 'Universitas Brawijaya', icon: '🎓' },
    { year: '2021-2024', title: 'SMA Jurusan IPA', sub: 'SMA Negeri 60 Jakarta', icon: '🏫' },
    { year: '2024', title: 'Microsoft Office Desktop Apllication', sub: 'Microsoft Global and Learning Partner', icon: '📜' },
  ];

  return (
    <div className="slide-content">
      <div className="pixel-card" style={{ maxWidth: '700px' }}>
        <div className="section-title">PENDIDIKAN</div>
        <div className="section-flag">WORLD 1-4</div>
        <div className="timeline">
          {edu.map((e, i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-dot">{e.icon}</div>
              <div className="timeline-content">
                <div className="timeline-year">{e.year}</div>
                <div className="timeline-title">{e.title}</div>
                <div className="timeline-sub">{e.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlidePengalamanContent() {
  const exp = [
    {
      company: 'Freelance',
      position: 'Full Stack Developer',
      period: '2021 - Kini',
      desc: 'Membuka jasa untuk pembuatan website menggunakan framework laravel, codeigniter dan nextjs.',
    },
    {
      company: 'Freelance',
      position: 'Frontend Developer',
      period: '2021 - Kini',
      desc: 'Membangun antarmuka pengguna responsif untuk berbagai klien.',
    },
    {
      company: 'Freelance',
      position: 'Web Developer',
      period: '2021 - Kini',
      desc: 'Mengerjakan proyek web yang kekinian dengan memaksimalkan AI sebagai referensi dan fitur lengkap',
    },
  ];

  return (
    <div className="slide-content">
      <div className="pixel-card" style={{ maxWidth: '700px' }}>
        <div className="section-title">PENGALAMAN</div>
        <div className="section-flag">WORLD 1-5</div>
        <div className="exp-list">
          {exp.map((e, i) => (
            <div key={i} className="exp-card">
              <div className="exp-header">
                <div className="exp-company">{e.company}</div>
                <div className="exp-period">{e.period}</div>
              </div>
              <div className="exp-position">{e.position}</div>
              <div className="exp-desc">{e.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideKontakContent() {
  const [form, setForm] = useState({ nama: '', email: '', pesan: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const contacts = [
    { icon: '📧', label: 'EMAIL', value: 'riopratamaputra43@gmail.com', href: 'mailto:riopratamaputra43@gmail.com' },
    { icon: '💼', label: 'LINKEDIN', value: 'Rio Pratama Putra', href: 'https://id.linkedin.com/in/rio-pratama-putra-a62094308' },
    { icon: '🐙', label: 'GITHUB', value: 'github.com/rioichitv', href: 'https://github.com/rioichitv' },
    { icon: '📱', label: 'WHATSAPP', value: '+6285280944573', href: 'https://wa.me/6285280944573' },
  ];

  const validate = () => {
    const e = {};
    if (!form.nama.trim())  e.nama  = 'Nama wajib diisi';
    if (!form.email.trim()) e.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid';
    if (!form.pesan.trim()) e.pesan = 'Pesan wajib diisi';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setStatus('sending');

    // Build mailto link — akan membuka email client dengan data terisi
    const subject = encodeURIComponent(`[Portfolio] Pesan dari ${form.nama}`);
    const body = encodeURIComponent(
      `Nama    : ${form.nama}\n` +
      `Email   : ${form.email}\n` +
      `\nPesan:\n${form.pesan}\n\n` +
      `---\nDikirim dari portfolio Rio Pratama Putra`
    );
    const mailtoLink = `mailto:riopratamaputra43@gmail.com?subject=${subject}&body=${body}`;

    // Buka email client
    window.location.href = mailtoLink;

    // Tampilkan success setelah jeda singkat
    setTimeout(() => {
      setStatus('success');
      setForm({ nama: '', email: '', pesan: '' });
    }, 800);
  };

  const handleReset = () => setStatus('idle');

  return (
    <div className="slide-content">
      <div className="pixel-card" style={{ maxWidth: '700px' }}>
        <div className="section-title">KONTAK</div>
        <div className="section-flag">WORLD 1-6</div>

        <div className="contact-grid">
          {contacts.map((c, i) => (
            <a key={i} className="contact-item" href={c.href} target="_blank" rel="noreferrer">
              <div className="contact-icon">{c.icon}</div>
              <div>
                <div className="contact-label">{c.label}</div>
                <div className="contact-value">{c.value}</div>
              </div>
            </a>
          ))}
        </div>

        {/* ── FORM ── */}
        {status === 'success' ? (
          <div className="contact-success">
            <div className="success-icon">🎉</div>
            <div className="success-title">PESAN TERKIRIM!</div>
            <div className="success-msg">
              Email client kamu sudah terbuka.<br />
              Terima kasih sudah menghubungi Rio!
            </div>
            <button className="btn-primary" onClick={handleReset} style={{ marginTop: 16, pointerEvents: 'all' }}>
              ← KIRIM LAGI
            </button>
          </div>
        ) : (
          <div className="contact-form">
            <div className="form-group">
              <input
                type="text"
                name="nama"
                placeholder="Nama kamu..."
                value={form.nama}
                onChange={handleChange}
                className={errors.nama ? 'input-error' : ''}
              />
              {errors.nama && <span className="field-error">{errors.nama}</span>}
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email kamu..."
                value={form.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <textarea
                name="pesan"
                placeholder="Pesan kamu..."
                value={form.pesan}
                onChange={handleChange}
                className={errors.pesan ? 'input-error' : ''}
              />
              {errors.pesan && <span className="field-error">{errors.pesan}</span>}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === 'sending'}
              className="btn-send"
            >
              {status === 'sending' ? '⏳ MENGIRIM...' : '✉ KIRIM PESAN'}
            </button>
          </div>
        )}

        <div className="thank-you">� THANKS FOR VISITING! GAME CLEAR! �</div>
      </div>
    </div>
  );
}

// ============ SLIDE BACKGROUNDS ============
const slideClasses = [
  'slide-beranda',
  'slide-tentang',
  'slide-portfolio',
  'slide-pendidikan',
  'slide-pengalaman',
  'slide-kontak',
];

// Pakai komponen — bukan JSX static — agar state per-slide bekerja
const SlideComponents = [
  SlideBerandaContent,
  SlideTentangContent,
  SlidePortfolioContent,
  SlidePendidikanContent,
  SlidePengalamanContent,
  SlideKontakContent,
];

// ============ HUD ============
function HUD({ slide, score, coins }) {
  return (
    <div className="hud">
      <div className="hud-section">
        <span className="hud-label">MARIO</span>
        <span className="hud-value">{String(score).padStart(6, '0')}</span>
      </div>
      <div className="hud-section" style={{ alignItems: 'center' }}>
        <div className="hud-coins">
          <span className="hud-coin-icon" />
          <span className="hud-value">x{String(coins).padStart(2, '0')}</span>
        </div>
      </div>
      <div className="hud-section" style={{ alignItems: 'center' }}>
        <span className="hud-label">{SLIDES[slide].flag}</span>
      </div>
      <div className="hud-section">
        <span className="hud-label">TIME</span>
        <span className="hud-value" style={{ color: '#ff6666' }}>∞</span>
      </div>
    </div>
  );
}

// ============ NAV DOTS ============
function NavDots({ current, onGoto }) {
  return (
    <div className="nav-dots">
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className={`nav-dot ${i === current ? 'active' : ''}`}
          onClick={() => onGoto(i)}
          title={s.label}
        />
      ))}
    </div>
  );
}

// ============ CONTROLS HINT ============
function ControlsHint() {
  return (
    <div className="controls-hint">
      <div className="key-row"><div className="key">↑</div></div>
      <div className="key-row">
        <div className="key">←</div>
        <div className="key">↓</div>
        <div className="key">→</div>
      </div>
      <div className="controls-label">MOVE</div>
    </div>
  );
}

// ============ MOBILE CONTROLS ============
function MobileControls({ onStart, onEnd }) {
  const makeHandlers = (key) => ({
    onPointerDown: (e) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      onStart(key);
    },
    onPointerUp: (e) => {
      onEnd(key);
    },
    onPointerCancel: (e) => {
      onEnd(key);
    },
  });

  return (
    <div className="mobile-controls">
      <div className="mobile-controls-left">
        <button type="button" className="mobile-key" {...makeHandlers('ArrowLeft')}>←</button>
        <button type="button" className="mobile-key" {...makeHandlers('ArrowRight')}>→</button>
      </div>
      <div className="mobile-controls-right">
        <button type="button" className="mobile-key jump-btn" {...makeHandlers('ArrowUp')}>↑</button>
      </div>
    </div>
  );
}

// ============ SCORE POP ============
let scorePopId = 0;
function ScorePop({ items }) {
  return (
    <>
      {items.map(item => (
        <div key={item.id} className="score-pop" style={{ left: item.x, top: item.y }}>
          +{item.value}
        </div>
      ))}
    </>
  );
}

// ============ MAIN APP ============
export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [scorePops, setScorePops] = useState([]);
  const [transitioning, setTransitioning] = useState(false);
  const [decorations, setDecorations] = useState(DECORATIONS_INITIAL);
  const decorationsRef = useRef(DECORATIONS_INITIAL);
  const [flagY, setFlagY] = useState(0);
  const [fadeActive, setFadeActive] = useState(false);

  // Use refs for all fast-changing values to avoid re-renders
  const marioXRef = useRef(80);
  const marioBottomRef = useRef(90);
  const isJumpingRef = useRef(false);
  const facingLeftRef = useRef(false);
  const isWalkingRef = useRef(false);
  const marioElRef = useRef(null);
  const transitionStartTimeRef = useRef(0);
  const transitionDirectionRef = useRef('right');
  const transitionStartXRef = useRef(0);
  const marioVYRef = useRef(0);
  const isSlidingPoleRef = useRef(false);
  const poleSlideStartTimeRef = useRef(0);
  const poleSlideStartHeightRef = useRef(90);

  // Sprite state: only update React state when the animation state actually changes
  const [spriteState, setSpriteState] = useState('idle'); // idle | walk | jump
  const [spriteFacing, setSpriteFacing] = useState(false);
  const prevSpriteState = useRef('idle');
  const prevSpriteFacing = useRef(false);

  // slideWidth state and listener for responsive mobile synchronization
  const [slideWidth, setSlideWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const slideWidthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setSlideWidth(w);
      slideWidthRef.current = w;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const keysRef = useRef({});
  const animRef = useRef(null);
  const transitioningRef = useRef(false);
  const currentSlideRef = useRef(0);

  const addScorePop = useCallback((value, x, y) => {
    const id = ++scorePopId;
    setScorePops(prev => [...prev, { id, value, x: x - 20, y: y - 20 }]);
    setTimeout(() => setScorePops(prev => prev.filter(p => p.id !== id)), 1000);
  }, []);

  // Keep refs in sync
  useEffect(() => { transitioningRef.current = transitioning; }, [transitioning]);
  useEffect(() => { currentSlideRef.current = currentSlide; }, [currentSlide]);

  // Direct DOM update — fast, no React re-render
  const updateMarioDOM = useCallback(() => {
    const el = marioElRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${marioXRef.current}px, 0, 0)`;
    el.style.bottom = marioBottomRef.current + 'px';
  }, []);

  // Update sprite React state only when it actually changes (idle/walk/jump, facing)
  const syncSpriteState = useCallback(() => {
    const jumping = isJumpingRef.current;
    const walking = isWalkingRef.current;
    const facing = facingLeftRef.current;
    const newState = jumping ? 'jump' : walking ? 'walk' : 'idle';

    if (newState !== prevSpriteState.current) {
      prevSpriteState.current = newState;
      setSpriteState(newState);
    }
    if (facing !== prevSpriteFacing.current) {
      prevSpriteFacing.current = facing;
      setSpriteFacing(facing);
    }
  }, []);

  // Movement + jump all in one stable loop (no dependency on doJump)
  useEffect(() => {
    const loop = (timestamp) => {
      const slideWidth = slideWidthRef.current;
      const currentSlide = currentSlideRef.current;
      const currentMarioSize = slideWidth < 768 ? 54 : 76;
      const currentDecos = decorationsRef.current[currentSlide] || [];
      const mLeft = marioXRef.current;
      const mRight = marioXRef.current + currentMarioSize;
      const mBottom = marioBottomRef.current;
      const mTop = marioBottomRef.current + currentMarioSize * 1.3;

      if (isSlidingPoleRef.current) {
        // ── Pole sliding animation ──
        const now = performance.now();
        const elapsed = now - poleSlideStartTimeRef.current;
        const duration = 1200; // 1.2s slide down
        const progress = Math.min(elapsed / duration, 1);

        marioBottomRef.current = poleSlideStartHeightRef.current - progress * (poleSlideStartHeightRef.current - 90);
        
        isJumpingRef.current = true;
        facingLeftRef.current = false;
        isWalkingRef.current = false;
        
        setFlagY(progress * 254);

        if (progress >= 1) {
          isSlidingPoleRef.current = false;
          setFadeActive(true);
          setTimeout(() => {
            setCurrentSlide(0);
            marioXRef.current = 80;
            marioBottomRef.current = 90;
            isJumpingRef.current = false;
            marioVYRef.current = 0;
            setFlagY(0);

            // Reset all decorations
            const resetDecos = DECORATIONS_INITIAL.map(slideDecos =>
              slideDecos.map(d => ({ ...d, hit: false, isHitting: false, collected: false }))
            );
            decorationsRef.current = resetDecos;
            setDecorations(resetDecos);

            updateMarioDOM();

            setTimeout(() => {
              setFadeActive(false);
            }, 300);
          }, 800);
        }
      } else if (transitioningRef.current) {
        // ── Slide transition ──
        const now = timestamp || performance.now();
        const elapsed = now - transitionStartTimeRef.current;
        const progress = Math.min(elapsed / 800, 1);

        if (transitionDirectionRef.current === 'right') {
          marioXRef.current = transitionStartXRef.current - progress * (slideWidth * 0.9);
        } else {
          marioXRef.current = transitionStartXRef.current + progress * (slideWidth * 0.9);
        }

        isWalkingRef.current = false;

        if (progress >= 1) {
          transitioningRef.current = false;
          setTransitioning(false);
        }
      } else {
        // ── Normal physics & controls ──
        const keys = keysRef.current;
        let moved = false;

        // 1. Vertical physics & landing check
        let isGrounded = false;
        let groundY = 90;

        for (const deco of currentDecos) {
          if (deco.collected) continue;
          const isSolid = deco.type === 'pipe' || deco.type.startsWith('block');
          if (!isSolid) continue;

          const oLeft = (parseFloat(deco.x) / 100) * slideWidth;
          const oRight = oLeft + (deco.type === 'pipe' ? 60 : 50);
          const oBottom = deco.type === 'pipe' ? 90 : deco.y;
          const oTop = deco.type === 'pipe' ? 190 : (deco.y + 50);

          const horizOverlap = mLeft < oRight - 4 && mRight > oLeft + 4;

          if (horizOverlap && marioVYRef.current <= 0) {
            // Landing on top of an obstacle
            if (mBottom >= oTop - 8 && mBottom + marioVYRef.current <= oTop + 2) {
              isGrounded = true;
              groundY = oTop;
              break;
            }
          }
        }

        if (!isGrounded && mBottom <= 90 && marioVYRef.current <= 0) {
          isGrounded = true;
          groundY = 90;
        }

        if (isGrounded) {
          marioBottomRef.current = groundY;
          marioVYRef.current = 0;
          isJumpingRef.current = false;

          if (keys['ArrowUp'] || keys[' '] || keys['w'] || keys['W']) {
            marioVYRef.current = 14;
            isJumpingRef.current = true;
            playJumpSound();
            setScore(s => s + 100);
            addScorePop(100, marioXRef.current + 32, window.innerHeight - marioBottomRef.current - 64);
          }
        } else {
          marioVYRef.current -= 0.6;
          marioBottomRef.current += marioVYRef.current;

          if (marioBottomRef.current < 90) {
            marioBottomRef.current = 90;
            marioVYRef.current = 0;
            isJumpingRef.current = false;
          }
        }

        // 2. Horizontal movement
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
          facingLeftRef.current = false;
          moved = true;
          const newX = marioXRef.current + MARIO_SPEED;

          let canMoveRight = true;
          let stopRightX = null;

          for (const deco of currentDecos) {
            if (deco.collected) continue;
            const isSolid = deco.type === 'pipe' || deco.type.startsWith('block');
            if (!isSolid) continue;

            const oLeft = (parseFloat(deco.x) / 100) * slideWidth;
            const oRight = oLeft + (deco.type === 'pipe' ? 60 : 50);
            const oBottom = deco.type === 'pipe' ? 90 : deco.y;
            const oTop = deco.type === 'pipe' ? 190 : (deco.y + 50);

            const proposedLeft = newX;
            const proposedRight = newX + currentMarioSize;
            const horizontalOverlap = proposedLeft < oRight && proposedRight > oLeft;
            const verticalOverlap = marioBottomRef.current < oTop && (marioBottomRef.current + currentMarioSize * 1.3) > oBottom;

            if (horizontalOverlap && verticalOverlap) {
              canMoveRight = false;
              stopRightX = oLeft - currentMarioSize;
              break;
            }
          }

          if (canMoveRight) {
            if (newX > slideWidth * SLIDE_THRESHOLD) {
              if (currentSlideRef.current === SLIDES.length - 1) {
                marioXRef.current = slideWidth * SLIDE_THRESHOLD;
              } else {
                transitioningRef.current = true;
                setTransitioning(true);
                transitionStartTimeRef.current = timestamp || performance.now();
                transitionDirectionRef.current = 'right';
                transitionStartXRef.current = marioXRef.current;

                setCurrentSlide(s => {
                  const next = Math.min(s + 1, SLIDES.length - 1);
                  if (next !== s) {
                    setScore(sc => sc + 500);
                    playSlideSound();
                  }
                  return next;
                });
              }
            } else {
              marioXRef.current = newX;
            }
          } else if (stopRightX !== null) {
            marioXRef.current = stopRightX;
          }
        }

        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
          facingLeftRef.current = true;
          moved = true;
          const newX = marioXRef.current - MARIO_SPEED;

          let canMoveLeft = true;
          let stopLeftX = null;

          for (const deco of currentDecos) {
            if (deco.collected) continue;
            const isSolid = deco.type === 'pipe' || deco.type.startsWith('block');
            if (!isSolid) continue;

            const oLeft = (parseFloat(deco.x) / 100) * slideWidth;
            const oRight = oLeft + (deco.type === 'pipe' ? 60 : 50);
            const oBottom = deco.type === 'pipe' ? 90 : deco.y;
            const oTop = deco.type === 'pipe' ? 190 : (deco.y + 50);

            const proposedLeft = newX;
            const proposedRight = newX + currentMarioSize;
            const horizontalOverlap = proposedLeft < oRight && proposedRight > oLeft;
            const verticalOverlap = marioBottomRef.current < oTop && (marioBottomRef.current + currentMarioSize * 1.3) > oBottom;

            if (horizontalOverlap && verticalOverlap) {
              canMoveLeft = false;
              stopLeftX = oRight;
              break;
            }
          }

          if (canMoveLeft) {
            if (newX < 0) {
              if (currentSlideRef.current === 0) {
                marioXRef.current = 0;
              } else {
                transitioningRef.current = true;
                setTransitioning(true);
                transitionStartTimeRef.current = timestamp || performance.now();
                transitionDirectionRef.current = 'left';
                transitionStartXRef.current = marioXRef.current;

                setCurrentSlide(s => Math.max(s - 1, 0));
              }
            } else {
              marioXRef.current = newX;
            }
          } else if (stopLeftX !== null) {
            marioXRef.current = stopLeftX;
          }
        }

        isWalkingRef.current = moved;

        // 3. Collision detection & Headbutt triggers
        const mLeftNew = marioXRef.current;
        const mRightNew = marioXRef.current + currentMarioSize;
        const mBottomNew = marioBottomRef.current;
        const mTopNew = marioBottomRef.current + currentMarioSize * 1.3;

        let stateChanged = false;
        const nextDecos = decorationsRef.current.map((slideDecos, sIdx) => {
          if (sIdx !== currentSlide) return slideDecos;

          return slideDecos.map(deco => {
            // Coin collection
            if (deco.type === 'coin' && !deco.collected) {
              const cLeft = (parseFloat(deco.x) / 100) * slideWidth;
              const cRight = cLeft + 24;
              const cBottom = deco.y;
              const cTop = deco.y + 24;

              if (mLeftNew < cRight && mRightNew > cLeft && mBottomNew < cTop && mTopNew > cBottom) {
                playCoinSound();
                setCoins(c => (c + 1) % 100);
                setScore(s => s + 200);
                addScorePop(200, mLeftNew + currentMarioSize / 2, window.innerHeight - mBottomNew - 60);
                stateChanged = true;
                return { ...deco, collected: true };
              }
            }

            // Block headbutt
            if (deco.type.startsWith('block') && !deco.hit) {
              const bLeft = (parseFloat(deco.x) / 100) * slideWidth;
              const bRight = bLeft + 50;
              const bBottom = deco.y;

              const horizOverlap = mLeftNew < bRight - 8 && mRightNew > bLeft + 8;
              const verticalHit = mTopNew >= bBottom && mBottomNew < bBottom;

              if (horizOverlap && verticalHit && marioVYRef.current > 0) {
                playCoinSound();
                setCoins(c => (c + 1) % 100);
                setScore(s => s + 200);
                addScorePop(200, mLeftNew + currentMarioSize / 2, window.innerHeight - mBottomNew - 60);

                marioVYRef.current = 0; // stop jump velocity
                marioBottomRef.current = bBottom - currentMarioSize * 1.3; // snap head to bottom of block

                stateChanged = true;
                const blockId = deco.id;

                setTimeout(() => {
                  const clearedDecos = decorationsRef.current.map(sDecos =>
                    sDecos.map(d => (d.id === blockId ? { ...d, isHitting: false } : d))
                  );
                  decorationsRef.current = clearedDecos;
                  setDecorations(clearedDecos);
                }, 500);

                return { ...deco, hit: true, isHitting: true };
              }
            }

            return deco;
          });
        });

        if (stateChanged) {
          decorationsRef.current = nextDecos;
          setDecorations(nextDecos);
        }

        // 4. Check Flagpole slide trigger on slide 5
        if (currentSlide === 5) {
          const poleX = slideWidth - 88;
          if (mLeftNew + currentMarioSize / 2 >= poleX) {
            isSlidingPoleRef.current = true;
            poleSlideStartTimeRef.current = performance.now();
            poleSlideStartHeightRef.current = marioBottomRef.current;
            playSlideSound();
          }
        }
      }

      // ── Apply to DOM directly ──
      updateMarioDOM();
      syncSpriteState();

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [updateMarioDOM, syncSpriteState, addScorePop]);

  // Key listeners
  useEffect(() => {
    const down = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key] = true;
    };
    const up = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);



  // Handlers for mobile touch controls
  const handleControlStart = useCallback((key) => {
    keysRef.current[key] = true;
  }, []);

  const handleControlEnd = useCallback((key) => {
    keysRef.current[key] = false;
  }, []);

  const isMobile = slideWidth < 768;
  const marioSize = isMobile ? 54 : 76;
  const progressPct = ((currentSlide) / (SLIDES.length - 1)) * 100;

  return (
    <div className="app-container">
      {/* Progress bar */}
      <div className="progress-bar" style={{ width: `${progressPct}%` }} />

      {/* HUD */}
      <HUD slide={currentSlide} score={score} coins={coins} />

      {/* Clouds */}
      <Clouds />

      {/* Score pops */}
      <ScorePop items={scorePops} />

      {/* World Scroller */}
      <div
        className="world-scroller"
        style={{ transform: `translateX(-${currentSlide * 100}vw)` }}
      >
      {SLIDES.map((slide, i) => {
          const SlideComp = SlideComponents[i];
          return (
            <div key={slide.id} className={`slide ${slideClasses[i]}`}>
              {i >= 2 && <NightStars count={25} />}
              <Hills config={[
                { x: '5%', w: 180, h: 80 },
                { x: '40%', w: 140, h: 60 },
                { x: '70%', w: 200, h: 90 },
              ]} />
              <GroundDecos items={decorations[i]} isMobile={isMobile} flagY={flagY} />
              <SlideComp />
              <div className="ground" />
            </div>
          );
        })}
      </div>

      {/* Mario Character — positioned via ref, no React re-render */}
      <div
        ref={marioElRef}
        className="mario-character"
        style={{ left: 0, bottom: 90, transform: `translate3d(80px, 0, 0)` }}
      >
        <MarioSprite
          state={spriteState}
          facingLeft={spriteFacing}
          size={marioSize}
        />
      </div>

      {/* Nav dots */}
      <NavDots current={currentSlide} onGoto={(i) => {
        setCurrentSlide(i);
        marioXRef.current = 80;
        updateMarioDOM();
      }} />

      {/* Controls Hint or Mobile Interactive Controls */}
      {isMobile ? (
        <MobileControls onStart={handleControlStart} onEnd={handleControlEnd} />
      ) : (
        <ControlsHint />
      )}

      {/* Fade out transition overlay */}
      <div className={`fade-overlay ${fadeActive ? 'active' : ''}`} />
    </div>
  );
}
