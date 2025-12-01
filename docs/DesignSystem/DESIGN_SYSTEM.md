# OrizonQA Design System

**Version:** 1.0
**Last Updated:** 2025-11-30
**Reference:** Based on UI/UX patterns from `/mocks` folder

---

## Overview

This design system defines the visual language, components, and interaction patterns for OrizonQA. It ensures consistency, accessibility, and a polished user experience across all features.

**Design Principles:**
1. **Clean & Minimal** - Reduce cognitive load with clear hierarchy
2. **Delightful** - Smooth interactions and thoughtful micro-animations
3. **Accessible** - WCAG 2.1 AA compliance for all users
4. **Consistent** - Predictable patterns across all features
5. **Professional** - Enterprise-ready with modern SaaS aesthetics

---

## Color Palette

### Primary Colors

```css
--primary-500: #6B4EFF        /* Primary purple - CTAs, links, active states */
--primary-600: #5940CC        /* Primary dark - hover states */
--primary-700: #4732A3        /* Primary darker - pressed states */
--primary-400: #8366FF        /* Primary light - backgrounds */
--primary-100: #EDE9FF        /* Primary lightest - subtle backgrounds */
```

### Secondary Colors (Icon Backgrounds)

```css
--purple-bg: #EDE9FF          /* Purple icon background */
--red-bg: #FFE9E9             /* Red icon background */
--yellow-bg: #FFF4E0          /* Yellow icon background */
--green-bg: #E0F7F4           /* Green icon background */
--blue-bg: #E0F0FF            /* Blue icon background */
```

### Neutrals (Dark Mode Optimized)

```css
--slate-50: #F8FAFC           /* Lightest background */
--slate-100: #F1F5F9          /* Light background */
--slate-200: #E2E8F0          /* Borders, dividers */
--slate-300: #CBD5E1          /* Disabled borders */
--slate-400: #94A3B8          /* Placeholder text */
--slate-500: #64748B          /* Secondary text */
--slate-600: #475569          /* Body text */
--slate-700: #334155          /* Headings */
--slate-800: #1E293B          /* Dark backgrounds */
--slate-900: #0F172A          /* Darkest backgrounds */
```

### Semantic Colors

```css
--success-500: #10B981        /* Success green */
--success-100: #D1FAE5        /* Success background */
--error-500: #EF4444          /* Error red */
--error-100: #FEE2E2          /* Error background */
--warning-500: #F59E0B        /* Warning orange */
--warning-100: #FEF3C7        /* Warning background */
--info-500: #3B82F6           /* Info blue */
--info-100: #DBEAFE           /* Info background */
```

### Usage Guidelines

- **Primary Purple:** Use for primary CTAs, links, and brand accents
- **Icon Backgrounds:** Rotate through secondary colors for visual categorization
- **Neutrals:** Use slate scale for all text, backgrounds, and borders
- **Semantic Colors:** Reserve for status indicators, alerts, and feedback

---

## Typography

### Font Family

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Menlo', monospace;
```

**Installation:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Type Scale

| Size | Weight | Line Height | Use Case |
|------|--------|-------------|----------|
| 32px | 700 | 40px | Page titles |
| 24px | 700 | 32px | Section headings |
| 20px | 600 | 28px | Card titles |
| 18px | 600 | 26px | Subsection headings |
| 16px | 500 | 24px | Body text (medium) |
| 14px | 400 | 20px | Body text (regular) |
| 12px | 400 | 16px | Metadata, captions |
| 11px | 500 | 14px | Labels (uppercase) |

### Text Styles

```css
/* Headings */
.heading-1 {
  font-size: 32px;
  font-weight: 700;
  line-height: 40px;
  color: var(--slate-900);
  letter-spacing: -0.02em;
}

.heading-2 {
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  color: var(--slate-800);
  letter-spacing: -0.01em;
}

.heading-3 {
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  color: var(--slate-800);
}

/* Body */
.body-large {
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--slate-700);
}

.body-regular {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--slate-600);
}

.body-small {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: var(--slate-500);
}

/* Labels */
.label {
  font-size: 11px;
  font-weight: 500;
  line-height: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--slate-500);
}
```

---

## Spacing System

**8px base unit** - All spacing follows multiples of 8px for consistency.

```css
--space-1: 4px      /* 0.5 unit - tight spacing */
--space-2: 8px      /* 1 unit - base unit */
--space-3: 12px     /* 1.5 units - compact */
--space-4: 16px     /* 2 units - default gap */
--space-5: 20px     /* 2.5 units */
--space-6: 24px     /* 3 units - comfortable */
--space-8: 32px     /* 4 units - section spacing */
--space-10: 40px    /* 5 units */
--space-12: 48px    /* 6 units - large sections */
--space-16: 64px    /* 8 units - page margins */
--space-20: 80px    /* 10 units - hero spacing */
```

### Application

- **Component padding:** 16px (space-4)
- **Card padding:** 24px (space-6)
- **Section gaps:** 32px (space-8)
- **Page margins:** 64px (space-16) desktop, 16px mobile
- **Form field gaps:** 16px (space-4)
- **Button padding:** 12px horizontal, 16px vertical

---

## Layout Grid

### Sidebar + Content Layout

```
┌─────────────┬──────────────────────────────────────┐
│             │                                      │
│  Sidebar    │         Main Content                 │
│  (240px)    │         (flexible)                   │
│             │                                      │
│             │                                      │
└─────────────┴──────────────────────────────────────┘
```

**Sidebar:**
- Fixed width: 240px
- Background: `--slate-50` or `--slate-800` (dark mode)
- Padding: 16px
- Border: 1px solid `--slate-200`

**Main Content:**
- Max width: none (full-width as per CLAUDE.md)
- Padding: 32px on desktop, 16px on mobile
- Background: white or `--slate-900` (dark mode)

### Content Container

```css
.container {
  width: 100%;
  padding: 0 32px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
}
```

---

## Component Library

### 1. Buttons

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, #6B4EFF 0%, #5940CC 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  box-shadow: 0 2px 8px rgba(107, 78, 255, 0.25);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5940CC 0%, #4732A3 100%);
  box-shadow: 0 4px 12px rgba(107, 78, 255, 0.35);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(107, 78, 255, 0.3);
}

.btn-primary:disabled {
  background: var(--slate-300);
  color: var(--slate-500);
  box-shadow: none;
  cursor: not-allowed;
}
```

#### Secondary Button
```css
.btn-secondary {
  background: white;
  color: var(--slate-700);
  font-size: 14px;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid var(--slate-300);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--slate-50);
  border-color: var(--slate-400);
}
```

#### Icon Button
```css
.btn-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--slate-600);
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: var(--slate-100);
  color: var(--slate-900);
}
```

### 2. Cards

#### Standard Card
```css
.card {
  background: white;
  border: 1px solid var(--slate-200);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--slate-300);
}
```

#### Interactive Card (Clickable)
```css
.card-interactive {
  background: white;
  border: 2px solid var(--slate-200);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-interactive:hover {
  border-color: var(--primary-500);
  box-shadow: 0 4px 16px rgba(107, 78, 255, 0.15);
  transform: translateY(-2px);
}

.card-interactive.selected {
  border-color: var(--primary-500);
  background: var(--primary-100);
}
```

#### Icon Card
```css
.card-icon {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.card-icon__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Icon background colors rotate through secondary palette */
.card-icon__icon.purple { background: var(--purple-bg); color: #6B4EFF; }
.card-icon__icon.red { background: var(--red-bg); color: #EF4444; }
.card-icon__icon.yellow { background: var(--yellow-bg); color: #F59E0B; }
.card-icon__icon.green { background: var(--green-bg); color: #10B981; }
.card-icon__icon.blue { background: var(--blue-bg); color: #3B82F6; }
```

### 3. Form Inputs

#### Text Input
```css
.input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  background: white;
  border: 1px solid var(--slate-300);
  border-radius: 8px;
  font-size: 14px;
  color: var(--slate-700);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(107, 78, 255, 0.1);
}

.input::placeholder {
  color: var(--slate-400);
}

.input:disabled {
  background: var(--slate-100);
  color: var(--slate-500);
  cursor: not-allowed;
}
```

#### Textarea
```css
.textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px 16px;
  background: white;
  border: 1px solid var(--slate-300);
  border-radius: 8px;
  font-size: 14px;
  font-family: var(--font-sans);
  color: var(--slate-700);
  resize: vertical;
  transition: all 0.2s ease;
}

.textarea:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(107, 78, 255, 0.1);
}
```

#### Select Dropdown
```css
.select {
  width: 100%;
  height: 44px;
  padding: 0 40px 0 16px;
  background: white url('data:image/svg+xml,...') no-repeat right 12px center;
  background-size: 16px;
  border: 1px solid var(--slate-300);
  border-radius: 8px;
  font-size: 14px;
  color: var(--slate-700);
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(107, 78, 255, 0.1);
}
```

### 4. Tabs

```css
.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--slate-200);
  margin-bottom: 24px;
}

.tab {
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--slate-600);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  bottom: -1px;
}

.tab:hover {
  color: var(--slate-900);
  background: var(--slate-50);
}

.tab.active {
  color: var(--primary-500);
  border-bottom-color: var(--primary-500);
}
```

### 5. Tags/Pills

```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: var(--slate-100);
  color: var(--slate-700);
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  white-space: nowrap;
}

.tag.primary {
  background: var(--primary-100);
  color: var(--primary-600);
}

.tag.success {
  background: var(--success-100);
  color: var(--success-700);
}

.tag.error {
  background: var(--error-100);
  color: var(--error-700);
}
```

### 6. Step Indicator (Wizard)

```css
.steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.step__number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--slate-200);
  color: var(--slate-600);
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.step.active {
  background: var(--primary-100);
  border: 1px solid var(--primary-500);
}

.step.active .step__number {
  background: var(--primary-500);
  color: white;
}

.step.completed .step__number {
  background: var(--success-500);
  color: white;
}
```

### 7. Progress Bar

```css
.progress {
  height: 8px;
  background: var(--slate-200);
  border-radius: 4px;
  overflow: hidden;
}

.progress__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-400));
  border-radius: 4px;
  transition: width 0.3s ease;
}
```

### 8. Alert/Notification

```css
.alert {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid;
}

.alert.success {
  background: var(--success-100);
  border-color: var(--success-500);
  color: var(--success-700);
}

.alert.error {
  background: var(--error-100);
  border-color: var(--error-500);
  color: var(--error-700);
}

.alert.warning {
  background: var(--warning-100);
  border-color: var(--warning-500);
  color: var(--warning-700);
}

.alert.info {
  background: var(--info-100);
  border-color: var(--info-500);
  color: var(--info-700);
}
```

### 9. Empty States

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;
}

.empty-state__icon {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-state__title {
  font-size: 20px;
  font-weight: 600;
  color: var(--slate-700);
  margin-bottom: 8px;
}

.empty-state__description {
  font-size: 14px;
  color: var(--slate-500);
  max-width: 400px;
}
```

### 10. Loading States

```css
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--slate-200);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 11. Sidebar Navigation

```css
.sidebar {
  width: 240px;
  height: 100vh;
  background: var(--slate-50);
  border-right: 1px solid var(--slate-200);
  padding: 16px;
  overflow-y: auto;
}

.sidebar__section {
  margin-bottom: 24px;
}

.sidebar__label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--slate-500);
  margin-bottom: 8px;
  padding: 0 12px;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--slate-600);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar__item:hover {
  background: var(--slate-100);
  color: var(--slate-900);
}

.sidebar__item.active {
  background: var(--primary-100);
  color: var(--primary-600);
}

.sidebar__item__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar__item__badge {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--slate-200);
  color: var(--slate-700);
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
}
```

### 12. File Upload Zone

```css
.upload-zone {
  border: 2px dashed var(--slate-300);
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  background: var(--slate-50);
  transition: all 0.2s ease;
  cursor: pointer;
}

.upload-zone:hover {
  border-color: var(--primary-500);
  background: var(--primary-100);
}

.upload-zone.dragover {
  border-color: var(--primary-500);
  background: var(--primary-100);
  border-style: solid;
}

.upload-zone__icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: var(--slate-400);
}
```

---

## Interaction Patterns

### Hover States
- **Buttons:** Darken by 10%, lift by 1-2px, increase shadow
- **Cards:** Lift by 2px, increase shadow, brighten border
- **Links:** Change color to primary-600, add underline
- **Icons:** Brighten background, darken icon color

### Focus States
- **All interactive elements:** 3px primary-500 ring with 10% opacity
- **Keyboard navigation:** Visible focus outline required

### Active/Pressed States
- **Buttons:** Remove lift, reduce shadow
- **Cards:** Reduce lift, subtle scale (0.98)

### Loading States
- **Buttons:** Show spinner, disable interaction, reduce opacity to 0.7
- **Sections:** Skeleton screens or centered spinner
- **Inline:** Small spinner next to text

### Disabled States
- **Opacity:** 0.5 for all disabled elements
- **Cursor:** `cursor: not-allowed`
- **Color:** Convert to neutral grays

---

## Animation Guidelines

### Timing Functions

```css
--ease-out: cubic-bezier(0.33, 1, 0.68, 1);
--ease-in: cubic-bezier(0.32, 0, 0.67, 0);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

### Duration

- **Micro-interactions:** 150ms (hover, focus)
- **Standard:** 250ms (modals, dropdowns)
- **Complex:** 350ms (page transitions)
- **Slow:** 500ms (special effects)

### Animations to Use

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale in */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## Iconography

### Icon Library
**Primary:** Lucide React (already in use)

### Icon Sizes
- **Small:** 16px (inline with text)
- **Medium:** 20px (buttons, navigation)
- **Large:** 24px (feature icons)
- **Extra Large:** 48px (empty states, hero)

### Icon Colors
- **Default:** `--slate-600`
- **Active:** `--primary-500`
- **Muted:** `--slate-400`
- **On colored background:** Inherit from background color scheme

### Icon Backgrounds
Use secondary color palette for icon containers (48px × 48px, rounded 12px)

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast Ratios
- **Normal text:** Minimum 4.5:1
- **Large text (18px+):** Minimum 3:1
- **UI components:** Minimum 3:1

#### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Visible focus indicators required (3px ring)
- Logical tab order

#### Screen Readers
- Semantic HTML elements
- ARIA labels for icon-only buttons
- Alt text for all images
- Live regions for dynamic content

#### Motion
- Respect `prefers-reduced-motion` media query
- Provide option to disable animations

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsive Breakpoints

```css
/* Mobile first approach */
--breakpoint-sm: 640px    /* Small devices */
--breakpoint-md: 768px    /* Tablets */
--breakpoint-lg: 1024px   /* Laptops */
--breakpoint-xl: 1280px   /* Desktops */
--breakpoint-2xl: 1536px  /* Large screens */
```

### Layout Adaptations

#### Mobile (< 768px)
- Single column layout
- Sidebar becomes drawer/overlay
- Stack cards vertically
- Reduce padding (16px)
- Full-width buttons

#### Tablet (768px - 1024px)
- Two-column layouts where appropriate
- Persistent sidebar or collapsible
- Moderate padding (24px)

#### Desktop (> 1024px)
- Full layout with persistent sidebar
- Multi-column grids
- Generous padding (32px)
- Hover states enabled

---

## Implementation Checklist

### Phase 1: Foundation ✅
- [x] Color palette defined
- [x] Typography system established
- [x] Spacing scale created
- [x] Tailwind CSS configured

### Phase 2: Core Components
- [ ] Button variants
- [ ] Form inputs (text, select, textarea)
- [ ] Card components
- [ ] Tab navigation
- [ ] Alert/notification system

### Phase 3: Layout
- [ ] Sidebar navigation
- [ ] Responsive grid
- [ ] Page containers
- [ ] Section dividers

### Phase 4: Advanced Components
- [ ] Step wizard
- [ ] Progress indicators
- [ ] Empty states
- [ ] Loading states
- [ ] File upload zone
- [ ] Tag/pill system

### Phase 5: Polish
- [ ] Hover/focus states
- [ ] Animations
- [ ] Accessibility audit
- [ ] Dark mode support
- [ ] Responsive testing

---

## Design Tokens (Tailwind Extension)

Add to `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#EDE9FF',
          400: '#8366FF',
          500: '#6B4EFF',
          600: '#5940CC',
          700: '#4732A3',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '12px',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'primary': '0 2px 8px rgba(107, 78, 255, 0.25)',
      },
    },
  },
};
```

---

## Resources

### Figma Design File
_(To be created)_

### Component Storybook
_(To be created)_

### Icons
- [Lucide Icons](https://lucide.dev/) - Primary icon set

### Inspiration
- Reference mockups in `/mocks` folder
- Modern SaaS design patterns (Linear, Notion, Vercel)

---

## Changelog

### Version 1.0 (2025-11-30)
- Initial design system documented
- Based on UI/UX patterns from mockups
- Defined color palette, typography, components
- Established spacing and layout grid
- Created accessibility guidelines
