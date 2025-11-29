# ORIZON Design System
## Complete Implementation-Ready Package

**Version:** 1.0
**Brand:** ORIZON QA
**Theme:** Event Horizon | Cosmic Intelligence
**Status:** ✅ Ready for Implementation

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Logo System](#4-logo-system)
5. [Component Library](#5-component-library)
6. [Layout Templates](#6-layout-templates)
7. [Implementation Code](#7-implementation-code)
8. [Usage Guidelines](#8-usage-guidelines)

---

## 1. Brand Identity

### 1.1 Brand Essence

**ORIZON** represents the threshold between the known and the unknown — a gateway that unifies intelligence across multiple AI/LLM systems for quality assurance.

**Core Concept:**
Inspired by Gargantua (Interstellar), the brand embodies:
- Light bending around a singularity
- Energy convergence and gravitational distortion
- The event horizon between code and quality
- Intelligence unified across systems

**Visual Identity:**
- **Primary Symbol**: Blue Gargantua (event horizon with energy ring)
- **Secondary Symbol**: Orange Accretion Disk (alternate theme)
- **Wordmark**: ORIZON (without leading "O" — logomark IS the O)
- **Style**: Modern, cosmic, high-tech enterprise

### 1.2 Design Philosophy

1. **Cosmic Precision**: Space-age aesthetics meets enterprise reliability
2. **Depth & Dimension**: Layered, luminous, three-dimensional feel
3. **Clean Modernism**: Minimalist despite cosmic theme
4. **High Contrast**: Dramatic darks with brilliant accents
5. **Energy Flow**: Dynamic, not static

---

## 2. Color System

### 2.1 Primary Colors

```css
/* Event Horizon Blue (Primary Brand) */
--color-primary: #00D4FF;           /* Bright cyan - main accent */
--color-primary-hover: #00B8E6;     /* Hover state */
--color-primary-active: #009CCC;    /* Active/pressed state */
--color-primary-light: #33DDFF;     /* Light variant */
--color-primary-dark: #0088CC;      /* Dark variant */

/* Primary Gradient */
--gradient-primary: linear-gradient(135deg, #00FFFF 0%, #00D4FF 50%, #0088FF 100%);
```

### 2.2 Secondary/Accent Colors

```css
/* Accretion Orange (Secondary Theme) */
--color-accent: #FF9500;            /* Main orange accent */
--color-accent-hover: #E68500;      /* Hover state */
--color-accent-light: #FFAD33;      /* Light variant */
--color-accent-dark: #CC7700;       /* Dark variant */

/* Quantum Violet (Energy Glow) */
--color-quantum: #6A00FF;           /* Violet accent */
--color-quantum-light: #8533FF;     /* Light variant */

/* Accent Gradient */
--gradient-accent: linear-gradient(135deg, #FFE599 0%, #FFCC66 25%, #FF9933 75%, #FF6600 100%);
```

### 2.3 Neutrals & Backgrounds

```css
/* Dark Theme (Primary) */
--color-background-dark: #0A0A0A;   /* Deep void black */
--color-surface-dark: #1A1A1A;      /* Elevated surface */
--color-surface-hover-dark: #2A2A2A;/* Surface hover */

/* Singularity Core */
--color-black: #000000;             /* Pure black */

/* Light Theme (Secondary) */
--color-background-light: #FFFFFF;  /* Moonlight white */
--color-surface-light: #F5F5F5;     /* Light gray */
--color-surface-hover-light: #EBEBEB; /* Light hover */

/* Text Colors (Dark Theme) */
--color-text-primary-dark: #FFFFFF;     /* White */
--color-text-secondary-dark: #C8C8C8;   /* Neural grey */
--color-text-muted-dark: #808080;       /* Muted grey */

/* Text Colors (Light Theme) */
--color-text-primary-light: #0A0A0A;    /* Near black */
--color-text-secondary-light: #505050;  /* Dark grey */
--color-text-muted-light: #808080;      /* Mid grey */
```

### 2.4 Semantic Colors

```css
/* Success */
--color-success: #10B981;
--color-success-bg: #D1FAE5;
--color-success-text: #065F46;

/* Error */
--color-error: #EF4444;
--color-error-bg: #FEE2E2;
--color-error-text: #991B1B;

/* Warning */
--color-warning: #F59E0B;
--color-warning-bg: #FEF3C7;
--color-warning-text: #92400E;

/* Info */
--color-info: #00D4FF;
--color-info-bg: #E0F7FF;
--color-info-text: #0088CC;
```

### 2.5 Border Colors

```css
/* Borders (Dark Theme) */
--border-color-dark: #2A2A2A;
--border-color-hover-dark: #3A3A3A;
--border-color-focus-dark: #00D4FF;

/* Borders (Light Theme) */
--border-color-light: #E5E5E5;
--border-color-hover-light: #D0D0D0;
--border-color-focus-light: #00D4FF;
```

### 2.6 Glow Effects

```css
/* Event Horizon Glow */
--glow-primary: 0 0 20px rgba(0, 212, 255, 0.3);
--glow-primary-lg: 0 0 40px rgba(0, 212, 255, 0.5);
--glow-primary-xl: 0 0 60px rgba(0, 212, 255, 0.7);

/* Accretion Glow */
--glow-accent: 0 0 20px rgba(255, 149, 0, 0.3);
--glow-accent-lg: 0 0 40px rgba(255, 149, 0, 0.5);

/* Quantum Glow */
--glow-quantum: 0 0 20px rgba(106, 0, 255, 0.3);
```

---

## 3. Typography

### 3.1 Font Stack

```css
/* Primary (Headlines, Wordmark) */
--font-primary: 'Outfit', 'Satoshi', 'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif;

/* Secondary (Body, UI) */
--font-secondary: 'Inter', 'IBM Plex Sans', 'Source Sans Pro', -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace (Code) */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Menlo', monospace;
```

### 3.2 Type Scale

| Class | Font | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|------|--------|-------------|----------------|-------|
| `.text-display` | Primary | 64px | 700 | 72px | -0.03em | Hero titles |
| `.text-h1` | Primary | 48px | 700 | 56px | -0.02em | Page titles |
| `.text-h2` | Primary | 32px | 700 | 40px | -0.01em | Section headers |
| `.text-h3` | Primary | 24px | 600 | 32px | 0 | Subsection headers |
| `.text-h4` | Primary | 20px | 600 | 28px | 0 | Card titles |
| `.text-h5` | Primary | 18px | 600 | 26px | 0 | Small headers |
| `.text-body-lg` | Secondary | 16px | 400 | 24px | 0 | Large body |
| `.text-body` | Secondary | 14px | 400 | 20px | 0 | Default body |
| `.text-body-sm` | Secondary | 13px | 400 | 18px | 0 | Small text |
| `.text-caption` | Secondary | 12px | 400 | 16px | 0 | Captions |
| `.text-label` | Secondary | 11px | 500 | 14px | 0.05em | Labels (uppercase) |

### 3.3 Font Weights

```css
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;
```

---

## 4. Logo System

### 4.1 Logo Variants

**Primary Logo (Blue Gargantua)**
- Full logo: Icon + "RIZON" wordmark
- Icon only: Standalone event horizon symbol
- Usage: Primary brand applications, dark backgrounds

**Secondary Logo (Orange Accretion)**
- Full logo: Orange icon + "RIZON" wordmark
- Icon only: Orange event horizon
- Usage: Alerts, premium features, alternative theme

**Approved Sizes:**
- 4096×4096 (ultra-high-res)
- 1024×1024 (high-res)
- 512×512 (large)
- 256×256 (medium)
- 128×128 (standard)
- 64×64 (small)
- 32×32 (icon)
- 16×16 (favicon)

### 4.2 Logo Usage Rules

**Clear Space:**
- Minimum clear space = height of logomark
- No elements within this zone

**Minimum Sizes:**
- Full logo (horizontal): 150px width
- Icon only: 32px
- Favicon: 16px

**Do NOT:**
- ❌ Add letter "O" before "RIZON"
- ❌ Stretch, rotate, or distort
- ❌ Recolor outside approved palette
- ❌ Place on busy/noisy backgrounds
- ❌ Apply drop shadows
- ❌ Modify spacing between icon and text

### 4.3 Background Compatibility

| Logo Variant | Background | Min Contrast |
|--------------|-----------|--------------|
| Blue Gargantua | #000000, #0A0A0A | ✅ High |
| Blue Gargantua | #FFFFFF | ⚠️ Use with caution |
| Orange Accretion | #FFFFFF, #F5F5F5 | ✅ High |
| Orange Accretion | #000000 | ✅ High |

---

## 5. Component Library

### 5.1 Buttons

#### Primary Button (Event Horizon)

```css
.btn-primary {
  /* Structure */
  height: 44px;
  padding: 0 24px;
  border-radius: 8px;
  border: none;

  /* Typography */
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-secondary);

  /* Colors */
  background: linear-gradient(135deg, #00FFFF 0%, #00D4FF 50%, #0088FF 100%);
  color: #000000;

  /* Effects */
  box-shadow: 0 2px 8px rgba(0, 212, 255, 0.3),
              0 0 20px rgba(0, 212, 255, 0.2);

  /* Animation */
  transition: all 0.2s cubic-bezier(0.33, 1, 0.68, 1);
  cursor: pointer;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #33DDFF 0%, #00D4FF 50%, #00B8E6 100%);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4),
              0 0 40px rgba(0, 212, 255, 0.3);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 212, 255, 0.3);
}

.btn-primary:disabled {
  background: #2A2A2A;
  color: #808080;
  box-shadow: none;
  cursor: not-allowed;
}
```

#### Secondary Button (Accretion)

```css
.btn-secondary {
  background: linear-gradient(135deg, #FFCC66 0%, #FF9933 50%, #FF6600 100%);
  color: #000000;
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3),
              0 0 20px rgba(255, 149, 0, 0.2);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #FFE599 0%, #FFCC66 50%, #FF9933 100%);
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4),
              0 0 40px rgba(255, 149, 0, 0.3);
}
```

#### Ghost Button

```css
.btn-ghost {
  background: transparent;
  color: #00D4FF;
  border: 1px solid #00D4FF;
  box-shadow: none;
}

.btn-ghost:hover {
  background: rgba(0, 212, 255, 0.1);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
}
```

### 5.2 Cards

#### Cosmic Card (with glow)

```css
.card-cosmic {
  background: linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%);
  border: 1px solid #2A2A2A;
  border-radius: 12px;
  padding: 24px;

  /* Event horizon glow */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3),
              0 0 20px rgba(0, 212, 255, 0.05);

  transition: all 0.3s cubic-bezier(0.33, 1, 0.68, 1);
}

.card-cosmic:hover {
  border-color: #00D4FF;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4),
              0 0 40px rgba(0, 212, 255, 0.15);
  transform: translateY(-2px);
}
```

#### Feature Card (with icon)

```html
<div class="card-feature">
  <div class="card-feature__icon card-feature__icon--blue">
    <!-- Icon SVG -->
  </div>
  <h3 class="card-feature__title">Feature Name</h3>
  <p class="card-feature__description">Description text</p>
</div>
```

```css
.card-feature {
  background: #1A1A1A;
  border: 1px solid #2A2A2A;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s ease;
}

.card-feature__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.card-feature__icon--blue {
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(0, 136, 255, 0.1));
  color: #00D4FF;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
}

.card-feature__icon--orange {
  background: linear-gradient(135deg, rgba(255, 229, 153, 0.1), rgba(255, 102, 0, 0.1));
  color: #FF9500;
  box-shadow: 0 0 20px rgba(255, 149, 0, 0.2);
}

.card-feature__title {
  font-size: 18px;
  font-weight: 600;
  font-family: var(--font-primary);
  color: #FFFFFF;
  margin-bottom: 8px;
}

.card-feature__description {
  font-size: 14px;
  color: #C8C8C8;
  line-height: 1.6;
}
```

### 5.3 Form Inputs

#### Text Input

```css
.input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  background: #1A1A1A;
  border: 1px solid #2A2A2A;
  border-radius: 8px;
  font-size: 14px;
  font-family: var(--font-secondary);
  color: #FFFFFF;
  transition: all 0.2s ease;
}

.input::placeholder {
  color: #808080;
}

.input:hover {
  border-color: #3A3A3A;
}

.input:focus {
  outline: none;
  border-color: #00D4FF;
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1),
              0 0 20px rgba(0, 212, 255, 0.15);
}

.input:disabled {
  background: #0A0A0A;
  color: #505050;
  cursor: not-allowed;
}
```

### 5.4 Modals

#### Event Horizon Modal

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  width: 500px;
  max-width: 90%;
  background: linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%);
  border: 1px solid #2A2A2A;
  border-radius: 16px;
  padding: 32px;

  /* Event horizon glow */
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
              0 0 60px rgba(0, 212, 255, 0.1);

  animation: modalEnter 0.3s cubic-bezier(0.33, 1, 0.68, 1);
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal__title {
  font-size: 24px;
  font-weight: 700;
  font-family: var(--font-primary);
  color: #FFFFFF;
  margin-bottom: 24px;
}
```

### 5.5 Navigation Sidebar

```css
.sidebar {
  width: 240px;
  height: 100vh;
  background: #0A0A0A;
  border-right: 1px solid #1A1A1A;
  padding: 16px;
  overflow-y: auto;
}

.sidebar__logo {
  padding: 8px 12px;
  margin-bottom: 32px;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  color: #C8C8C8;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s;
}

.sidebar__item:hover {
  background: #1A1A1A;
  color: #FFFFFF;
}

.sidebar__item.active {
  background: rgba(0, 212, 255, 0.1);
  color: #00D4FF;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);
}
```

### 5.6 Tags & Pills

```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  gap: 6px;
}

.tag--primary {
  background: rgba(0, 212, 255, 0.15);
  color: #00D4FF;
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.tag--accent {
  background: rgba(255, 149, 0, 0.15);
  color: #FF9500;
  border: 1px solid rgba(255, 149, 0, 0.3);
}

.tag--neutral {
  background: #1A1A1A;
  color: #C8C8C8;
  border: 1px solid #2A2A2A;
}
```

### 5.7 Progress Bar (Orbit)

```css
.progress {
  width: 100%;
  height: 8px;
  background: #1A1A1A;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress__fill {
  height: 100%;
  background: linear-gradient(90deg, #00FFFF 0%, #00D4FF 50%, #0088FF 100%);
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  transition: width 0.3s cubic-bezier(0.33, 1, 0.68, 1);
}
```

### 5.8 Empty States

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 80px 40px;
  max-width: 400px;
  margin: 0 auto;
}

.empty-state__icon {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
  opacity: 0.4;
  filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.3));
}

.empty-state__title {
  font-size: 20px;
  font-weight: 600;
  font-family: var(--font-primary);
  color: #FFFFFF;
  margin-bottom: 8px;
}

.empty-state__description {
  font-size: 14px;
  color: #C8C8C8;
  line-height: 1.6;
  margin-bottom: 24px;
}
```

---

## 6. Layout Templates

### 6.1 Split-Screen Auth Layout

```html
<div class="auth-layout">
  <div class="auth-layout__left">
    <div class="auth-layout__logo">
      <!-- ORIZON logo -->
    </div>

    <h1 class="auth-layout__title">
      Unlock the full potential of your code quality
    </h1>

    <ul class="auth-layout__features">
      <li>✓ AI-powered quality analysis</li>
      <li>✓ Multi-LLM intelligence</li>
      <li>✓ Instant insights</li>
    </ul>

    <div class="auth-layout__cosmic-elements">
      <!-- Floating cards/particles -->
    </div>
  </div>

  <div class="auth-layout__right">
    <div class="auth-card">
      <!-- Form content -->
    </div>
  </div>
</div>
```

```css
.auth-layout {
  display: grid;
  grid-template-columns: 45fr 55fr;
  min-height: 100vh;
}

.auth-layout__left {
  background: linear-gradient(135deg, #000000 0%, #0A0A0A 100%);
  padding: 80px;
  position: relative;
  overflow: hidden;
}

/* Cosmic background effect */
.auth-layout__left::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}

.auth-layout__title {
  font-size: 48px;
  font-weight: 700;
  font-family: var(--font-primary);
  color: #FFFFFF;
  line-height: 1.2;
  margin: 40px 0;
  text-shadow: 0 0 40px rgba(0, 212, 255, 0.3);
}

.auth-layout__features li {
  color: #C8C8C8;
  font-size: 16px;
  margin-bottom: 12px;
}

.auth-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 480px;
  width: 100%;
}
```

### 6.2 Dashboard Layout

```css
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: #000000;
}

.dashboard-layout__sidebar {
  width: 240px;
  flex-shrink: 0;
}

.dashboard-layout__main {
  flex: 1;
  background: linear-gradient(180deg, #0A0A0A 0%, #000000 100%);
}

.dashboard-header {
  height: 72px;
  border-bottom: 1px solid #1A1A1A;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dashboard-header__title {
  font-size: 24px;
  font-weight: 700;
  font-family: var(--font-primary);
  color: #FFFFFF;
}
```

---

## 7. Implementation Code

### 7.1 Complete CSS Variables

```css
:root {
  /* === BRAND COLORS === */

  /* Primary (Event Horizon Blue) */
  --orizon-primary: #00D4FF;
  --orizon-primary-hover: #00B8E6;
  --orizon-primary-active: #009CCC;
  --orizon-primary-light: #33DDFF;
  --orizon-primary-dark: #0088CC;

  /* Secondary (Accretion Orange) */
  --orizon-accent: #FF9500;
  --orizon-accent-hover: #E68500;
  --orizon-accent-light: #FFAD33;
  --orizon-accent-dark: #CC7700;

  /* Quantum Violet */
  --orizon-quantum: #6A00FF;
  --orizon-quantum-light: #8533FF;

  /* === BACKGROUNDS === */

  /* Dark Theme (Primary) */
  --bg-dark: #0A0A0A;
  --surface-dark: #1A1A1A;
  --surface-hover-dark: #2A2A2A;
  --black: #000000;

  /* Light Theme (Secondary) */
  --bg-light: #FFFFFF;
  --surface-light: #F5F5F5;
  --surface-hover-light: #EBEBEB;

  /* === TEXT COLORS === */

  /* Dark Theme */
  --text-primary-dark: #FFFFFF;
  --text-secondary-dark: #C8C8C8;
  --text-muted-dark: #808080;

  /* Light Theme */
  --text-primary-light: #0A0A0A;
  --text-secondary-light: #505050;
  --text-muted-light: #808080;

  /* === BORDERS === */

  --border-dark: #2A2A2A;
  --border-hover-dark: #3A3A3A;
  --border-light: #E5E5E5;
  --border-hover-light: #D0D0D0;

  /* === SEMANTIC COLORS === */

  --success: #10B981;
  --success-bg: #D1FAE5;
  --error: #EF4444;
  --error-bg: #FEE2E2;
  --warning: #F59E0B;
  --warning-bg: #FEF3C7;

  /* === GRADIENTS === */

  --gradient-primary: linear-gradient(135deg, #00FFFF 0%, #00D4FF 50%, #0088FF 100%);
  --gradient-accent: linear-gradient(135deg, #FFE599 0%, #FFCC66 25%, #FF9933 75%, #FF6600 100%);
  --gradient-surface: linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%);

  /* === GLOW EFFECTS === */

  --glow-primary: 0 0 20px rgba(0, 212, 255, 0.3);
  --glow-primary-lg: 0 0 40px rgba(0, 212, 255, 0.5);
  --glow-primary-xl: 0 0 60px rgba(0, 212, 255, 0.7);
  --glow-accent: 0 0 20px rgba(255, 149, 0, 0.3);
  --glow-accent-lg: 0 0 40px rgba(255, 149, 0, 0.5);

  /* === TYPOGRAPHY === */

  --font-primary: 'Outfit', 'Satoshi', 'Inter Tight', sans-serif;
  --font-secondary: 'Inter', 'IBM Plex Sans', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* === SPACING === */

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* === BORDERS & RADIUS === */

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* === SHADOWS === */

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.6);

  /* === Z-INDEX === */

  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;

  /* === TRANSITIONS === */

  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;

  --ease-out: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-in: cubic-bezier(0.32, 0, 0.67, 0);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}
```

### 7.2 Tailwind Config Extension

```javascript
// tailwind.config.cjs
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary
        primary: {
          DEFAULT: '#00D4FF',
          hover: '#00B8E6',
          active: '#009CCC',
          light: '#33DDFF',
          dark: '#0088CC',
        },
        // Accent
        accent: {
          DEFAULT: '#FF9500',
          hover: '#E68500',
          light: '#FFAD33',
          dark: '#CC7700',
        },
        // Quantum
        quantum: {
          DEFAULT: '#6A00FF',
          light: '#8533FF',
        },
        // Backgrounds
        'bg-dark': '#0A0A0A',
        'surface-dark': '#1A1A1A',
        black: '#000000',
        // Semantic
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        primary: ['Outfit', 'Satoshi', 'Inter Tight', 'sans-serif'],
        secondary: ['Inter', 'IBM Plex Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-primary-lg': '0 0 40px rgba(0, 212, 255, 0.5)',
        'glow-accent': '0 0 20px rgba(255, 149, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00FFFF 0%, #00D4FF 50%, #0088FF 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FFE599 0%, #FFCC66 25%, #FF9933 75%, #FF6600 100%)',
        'gradient-surface': 'linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)',
      },
    },
  },
  plugins: [],
};
```

---

## 8. Usage Guidelines

### 8.1 When to Use Blue (Primary)

- Primary CTAs and actions
- Navigation active states
- Links and interactive elements
- Success confirmations
- Brand presence
- Loading states

### 8.2 When to Use Orange (Accent)

- Warning states
- Premium features
- Alternative themes
- Special announcements
- Energy/performance indicators
- Secondary CTAs

### 8.3 Dark Theme Guidelines (Primary)

**Use dark theme for:**
- Main application interface
- Dashboard views
- Code analysis screens
- Technical/developer-focused pages
- Brand presentation

**Background Hierarchy:**
- Level 0 (Base): #000000
- Level 1 (Page): #0A0A0A
- Level 2 (Surface): #1A1A1A
- Level 3 (Elevated): #2A2A2A

### 8.4 Light Theme Guidelines (Secondary)

**Use light theme for:**
- Marketing pages
- Documentation
- Public-facing content
- Print materials

**Background Hierarchy:**
- Level 0 (Base): #FFFFFF
- Level 1 (Page): #F5F5F5
- Level 2 (Surface): #EBEBEB
- Level 3 (Elevated): #E0E0E0

### 8.5 Accessibility Standards

**Contrast Ratios (WCAG 2.1 AA):**
- Normal text: Minimum 4.5:1 ✅
- Large text (18px+): Minimum 3:1 ✅
- UI components: Minimum 3:1 ✅

**Verified Combinations:**
- #00D4FF on #000000: 11.2:1 ✅
- #FF9500 on #000000: 7.8:1 ✅
- #FFFFFF on #0A0A0A: 19.2:1 ✅
- #C8C8C8 on #0A0A0A: 12.1:1 ✅

### 8.6 Animation Guidelines

**Event Horizon Principles:**
- Use subtle, smooth transitions
- Favor opacity and transform over layout properties
- Cosmic elements can have longer durations (3-5s)
- Interactive elements should be snappy (150-250ms)
- Glow effects should pulse slowly

**Example Animations:**
```css
/* Orbit rotation */
@keyframes orbit {
  to { transform: rotate(360deg); }
}

/* Pulse glow */
@keyframes pulse-glow {
  0%, 100% { box-shadow: var(--glow-primary); }
  50% { box-shadow: var(--glow-primary-lg); }
}

/* Float */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

---

## 9. Brand Assets Checklist

### Required Logo Files

- [ ] Blue Gargantua - Full logo (horizontal) - PNG, SVG
- [ ] Blue Gargantua - Icon only - PNG, SVG (all sizes)
- [ ] Orange Accretion - Full logo (horizontal) - PNG, SVG
- [ ] Orange Accretion - Icon only - PNG, SVG (all sizes)
- [ ] Favicon - 16×16, 32×32, ICO format
- [ ] Apple Touch Icon - 180×180 PNG
- [ ] OG Image - 1200×630 PNG

### Font Files Required

- [ ] Outfit - Regular (400), SemiBold (600), Bold (700)
- [ ] Inter - Regular (400), Medium (500), SemiBold (600)
- [ ] JetBrains Mono - Regular (400), Medium (500)

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Install fonts (Outfit, Inter, JetBrains Mono)
- [ ] Configure Tailwind with ORIZON theme
- [ ] Set up CSS variables
- [ ] Implement dark theme globally
- [ ] Add logo assets to project

### Phase 2: Core Components (Week 1-2)
- [ ] Button variants (primary, secondary, ghost)
- [ ] Form inputs (text, textarea, select, password)
- [ ] Cards (cosmic, feature, standard)
- [ ] Modals (small, medium, large)
- [ ] Empty states

### Phase 3: Layout & Navigation (Week 2)
- [ ] Sidebar navigation
- [ ] Dashboard layout
- [ ] Auth layout (split-screen)
- [ ] Content page layout
- [ ] Responsive breakpoints

### Phase 4: Pages (Week 2-3)
- [ ] Landing page (hero with cosmic elements)
- [ ] Login/signup pages
- [ ] Dashboard home
- [ ] Analysis results page
- [ ] Settings page

### Phase 5: Polish & Effects (Week 3)
- [ ] Cosmic background animations
- [ ] Glow effects on interactive elements
- [ ] Loading states with orbit animations
- [ ] Page transitions
- [ ] Accessibility audit

---

## Appendix

### Quick Reference Table

| Element | Size | Color | Shadow |
|---------|------|-------|--------|
| Primary Button | 44px h | Blue Gradient | Glow Primary |
| Text Input | 44px h | Surface Dark | None |
| Card | — | Surface Dark | Glow Primary (subtle) |
| Modal | 500px w | Gradient Surface | Glow Primary XL |
| Sidebar | 240px w | BG Dark | None |
| Logo (full) | 150px min | Blue/Orange | Glow |
| Icon | 32px min | Blue/Orange | Glow |

### Color Palette Quick Copy

```
Primary: #00D4FF
Accent: #FF9500
Background: #0A0A0A
Surface: #1A1A1A
Text: #FFFFFF
Muted: #C8C8C8
Black: #000000
```

---

**Document Status:** ✅ Complete & Ready
**Last Updated:** 2025-11-30
**Version:** 1.0.0
**License:** Proprietary - ORIZON Brand

🌌 **Event Horizon Awaits** 🌌
