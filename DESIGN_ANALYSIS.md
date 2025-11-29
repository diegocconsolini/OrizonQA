# OrizonQA Design Analysis

**Based on:** Lettria Platform Design References
**Date:** 2025-11-30
**Status:** Ready for customization with OrizonQA branding

---

## Overview

This document analyzes the design patterns from the reference mockups to inform OrizonQA's visual design and UX implementation. The Lettria platform demonstrates modern SaaS best practices that align perfectly with our design goals.

---

## Color Scheme Analysis

### Primary Colors (From Reference)

```css
/* Primary Purple/Violet */
--ref-primary: #6B4EFF           /* Primary actions, links, brand */
--ref-primary-dark: #5940CC      /* Hover states */
--ref-primary-light: #8366FF     /* Light accents */

/* Accent Yellow/Gold */
--ref-accent: #FDB022            /* CTA buttons, highlights */
--ref-accent-dark: #E89E1C       /* Hover states */

/* Background Colors */
--ref-bg-dark: #0F172A           /* Dark navy background */
--ref-bg-light: #FFFFFF          /* White backgrounds */
--ref-bg-subtle: #F8F9FB         /* Light gray backgrounds */

/* Gradients */
--ref-gradient-purple: linear-gradient(135deg, rgba(107, 78, 255, 0.1), rgba(255, 105, 180, 0.05));
--ref-gradient-pink: linear-gradient(135deg, #FFE5F1, #F0E5FF);
```

### Semantic Colors

```css
/* Success */
--ref-success: #10B981
--ref-success-bg: #D1FAE5

/* Text Colors */
--ref-text-primary: #1E293B      /* Headings on light bg */
--ref-text-secondary: #64748B    /* Body text on light bg */
--ref-text-muted: #94A3B8        /* Metadata, captions */
--ref-text-on-dark: #FFFFFF      /* Text on dark backgrounds */
```

### Icon Background Colors (Rotating)

```css
--ref-icon-purple: #EDE9FF
--ref-icon-pink: #FFE9F5
--ref-icon-yellow: #FFF4E0
--ref-icon-green: #E0F7F4
--ref-icon-blue: #E0F0FF
--ref-icon-orange: #FFE9E0
```

---

## Layout Patterns

### 1. Split-Screen Layout (Landing Pages)

**Pattern:** Left side features/value prop, right side form/CTA

```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│  Features/Value     │   Form/CTA Card     │
│  • Bullet points    │   - Input fields    │
│  • Icon cards       │   - CTA button      │
│  • Social proof     │   - Trust signals   │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

**Use Cases:**
- Sign up / Login pages
- Contact forms
- Verification pages
- Landing page hero sections

**Key Elements:**
- Left: 40-50% width, dark or gradient background
- Right: 50-60% width, white card elevated with shadow
- Responsive: Stack vertically on mobile
- Floating icon cards on left side (subtle animation)

### 2. Sidebar + Content Layout (Dashboard)

```
┌──────────┬───────────────────────────────┐
│          │                               │
│ Sidebar  │   Main Content Area          │
│ (240px)  │   - Page header              │
│          │   - Content sections         │
│          │   - Cards & modules          │
│          │                               │
└──────────┴───────────────────────────────┘
```

**Sidebar Properties:**
- Fixed width: 240px
- Background: Light gray (#F8F9FB) or dark
- Sticky/fixed positioning
- Logo at top
- Navigation sections with labels
- User info at bottom

### 3. Centered Content Layout (Modals, Forms)

**Pattern:** Centered overlay with backdrop

```
        ┌─────────────────┐
        │   Modal Title   │
        │─────────────────│
        │   Form fields   │
        │   Input 1       │
        │   Input 2       │
        │─────────────────│
        │ Cancel │  Save  │
        └─────────────────┘
```

---

## Component Patterns

### 1. Navigation Sidebar

**Structure:**
```
┌─────────────────┐
│  [Logo]         │
├─────────────────┤
│ PROJECT         │ ← Section label
│ > Untitled  ▼   │ ← Dropdown
├─────────────────┤
│ ENVIRONMENT     │
│ </> Development │
├─────────────────┤
│ AM    1         │ ← Avatar + name
├─────────────────┤
│ • Overview      │ ← Nav items
│ ○ Demo          │
│ ⚙ Settings      │
├─────────────────┤
│ RESOURCES       │
│ 📦 Datasets  1  │ ← With count badge
│ 📚 Dictionaries │
│ 🔗 Ontologies   │
│ 📋 Patterns     │
├─────────────────┤
│ 🔔 Notifications│ ← Bottom items
│ ❓ Help center  │
│─────────────────│
│ AM Antoine ▼    │ ← User dropdown
└─────────────────┘
```

**Styling:**
- Section labels: Uppercase, 11px, gray, letter-spacing
- Nav items: 14px, padding 10px 12px, rounded 8px
- Active state: Purple background (#EDE9FF), purple text
- Hover: Light gray background
- Icons: 20px, aligned left
- Badges: Small pill on right side

### 2. Modals

**Types Observed:**

#### A. Form Modal (New Dictionary, Enter Word)
```css
.modal {
  width: 600px;
  max-width: 90vw;
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
}

.modal-close {
  position: absolute;
  top: 24px;
  right: 24px;
  color: #64748B;
}
```

**Form Modal Pattern:**
- Title at top (24px bold)
- Close button (X) in top-right
- Form fields stacked vertically (16px gap)
- Labels above inputs (12px, gray)
- Actions at bottom (Cancel left, Primary right)
- Optional: Description text below title

#### B. Large Modal (Welcome Modal with Video)
```css
.modal-large {
  width: 900px;
  max-width: 95vw;
  height: 600px;
  max-height: 90vh;
}

.modal-video {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 8px;
  margin: 24px 0;
}
```

**Large Modal Pattern:**
- Wider layout (900px+)
- May include media (video, images)
- Scrollable content area
- Clear visual hierarchy
- Bottom CTA button (full width or centered)

#### C. Simple Modal (Enter New Word)
```css
.modal-simple {
  width: 500px;
  padding: 24px;
}

.modal-simple .input {
  width: 100%;
  margin: 16px 0;
}

.modal-simple .actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
```

**Modal Backdrop:**
```css
.modal-backdrop {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
}
```

### 3. Buttons

**Primary Button (Purple)**
```css
.btn-primary {
  background: linear-gradient(135deg, #6B4EFF, #5940CC);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  box-shadow: 0 2px 8px rgba(107, 78, 255, 0.25);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(107, 78, 255, 0.35);
}
```

**Accent Button (Yellow/Gold)**
```css
.btn-accent {
  background: linear-gradient(135deg, #FDB022, #E89E1C);
  color: #1E293B;
  /* Same padding/styles as primary */
}
```

**Secondary Button**
```css
.btn-secondary {
  background: white;
  color: #475569;
  border: 1px solid #CBD5E1;
  /* Same padding/styles */
}
```

**Button with Icon**
```css
.btn-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-icon svg {
  width: 16px;
  height: 16px;
}
```

**Examples:**
- `+ Create project`
- `+ New dictionary`
- `+ Create labels`

### 4. Forms

**Input Fields**
```css
.input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  color: #1E293B;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #6B4EFF;
  box-shadow: 0 0 0 3px rgba(107, 78, 255, 0.1);
}

.input::placeholder {
  color: #94A3B8;
}
```

**Label**
```css
.label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 8px;
}

.label-required::after {
  content: '*';
  color: #EF4444;
  margin-left: 4px;
}
```

**Form Row (Side-by-side)**
```html
<div class="form-row">
  <div class="form-field">
    <label>First name*</label>
    <input type="text" placeholder="E.g. John">
  </div>
  <div class="form-field">
    <label>Last name*</label>
    <input type="text" placeholder="E.g. Doe">
  </div>
</div>
```

```css
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
```

**Verification Code Input**
```css
.verification-code {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.verification-code input {
  width: 56px;
  height: 56px;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
}

.verification-code input:focus {
  border-color: #6B4EFF;
}
```

**Password Input with Toggle**
```html
<div class="password-input">
  <input type="password" placeholder="Password">
  <button class="password-toggle">👁</button>
</div>
```

### 5. Cards

**Feature Card (Icon + Text)**
```css
.feature-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.feature-card:hover {
  border-color: #6B4EFF;
  box-shadow: 0 4px 12px rgba(107, 78, 255, 0.15);
  transform: translateY(-2px);
}

.feature-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.feature-card__title {
  font-size: 18px;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 8px;
}

.feature-card__description {
  font-size: 14px;
  color: #64748B;
  line-height: 1.6;
}
```

**Floating Icon Cards (Landing Page)**
```css
.floating-card {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: inline-flex;
  align-items: center;
  gap: 12px;
  position: absolute;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

**Module Card (Dashboard)**
```css
.module-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
}

.module-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.module-card__title {
  font-size: 16px;
  font-weight: 600;
}

.module-card__tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
```

### 6. Empty States

**Pattern:**
```css
.empty-state {
  padding: 80px 40px;
  text-align: center;
}

.empty-state__illustration {
  width: 200px;
  height: 200px;
  margin: 0 auto 24px;
  opacity: 0.8;
}

.empty-state__title {
  font-size: 20px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
}

.empty-state__description {
  font-size: 14px;
  color: #64748B;
  margin-bottom: 24px;
}

.empty-state__action {
  /* Primary button */
}
```

**Examples from mockups:**
- Dictionary empty state (illustration + "New dictionary" button)
- "No data" state with hexagon illustration
- "Select a label" with character illustration

### 7. Progress & Status

**Progress Bar**
```css
.progress {
  width: 100%;
  height: 8px;
  background: #E2E8F0;
  border-radius: 4px;
  overflow: hidden;
}

.progress__fill {
  height: 100%;
  background: linear-gradient(90deg, #6B4EFF, #8366FF);
  border-radius: 4px;
  transition: width 0.3s ease;
}
```

**Task Checklist**
```css
.checklist-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.checklist-item:hover {
  background: #F8F9FB;
}

.checklist-item__check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #10B981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.checklist-item__check.pending {
  background: white;
  border: 2px solid #CBD5E1;
}

.checklist-item__text {
  flex: 1;
  font-size: 14px;
  color: #334155;
}

.checklist-item__arrow {
  color: #94A3B8;
  margin-left: auto;
}
```

**Task Progress Header**
```html
<div class="task-progress">
  <span class="task-progress__emoji">👉</span>
  <span class="task-progress__text">Getting started</span>
  <span class="task-progress__stats">100 % Tasks</span>
  <div class="task-progress__bar"></div>
</div>
```

### 8. Tags & Pills

**Small Tags (in cards)**
```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: #F1F5F9;
  color: #475569;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  white-space: nowrap;
}

.tag.purple {
  background: #EDE9FF;
  color: #6B4EFF;
}

.tag.red {
  background: #FEE2E2;
  color: #EF4444;
}

.tag.removable {
  padding-right: 4px;
}

.tag.removable .remove {
  margin-left: 6px;
  cursor: pointer;
  opacity: 0.6;
}
```

### 9. Dropdowns & Menus

**Dropdown Button**
```css
.dropdown-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-toggle:hover {
  background: #F1F5F9;
}

.dropdown-toggle__text {
  font-size: 14px;
  font-weight: 500;
}

.dropdown-toggle__icon {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.dropdown-toggle.open .dropdown-toggle__icon {
  transform: rotate(180deg);
}
```

**Dropdown Menu**
```css
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #E2E8F0;
  min-width: 180px;
  z-index: 50;
}

.dropdown-menu__item {
  padding: 10px 16px;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
  transition: background 0.15s;
}

.dropdown-menu__item:hover {
  background: #F8F9FB;
}

.dropdown-menu__item:first-child {
  border-radius: 8px 8px 0 0;
}

.dropdown-menu__item:last-child {
  border-radius: 0 0 8px 8px;
}

.dropdown-menu__item__icon {
  margin-right: 8px;
  width: 16px;
  height: 16px;
}
```

### 10. Toggle Switch

```css
.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  background: #CBD5E1;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle.on {
  background: #6B4EFF;
}

.toggle__handle {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle.on .toggle__handle {
  transform: translateX(20px);
}
```

---

## Page Layouts

### 1. Landing Page Hero

**Pattern: Split-screen with floating elements**

```html
<section class="hero">
  <div class="hero__left">
    <div class="hero__logo">
      <!-- Logo -->
    </div>

    <h1 class="hero__title">
      Unlock the full potential of your data
    </h1>

    <ul class="hero__features">
      <li>✓ No credit card required</li>
      <li>✓ Access to all our features</li>
      <li>✓ 3000 free credits to use our API</li>
    </ul>

    <!-- Floating icon cards -->
    <div class="floating-cards">
      <div class="floating-card">📊 Data collection</div>
      <div class="floating-card">💬 Text Cleaning</div>
      <div class="floating-card">📝 Data annotation</div>
      <div class="floating-card">🎓 NLP training</div>
      <div class="floating-card">⚡ Production</div>
    </div>

    <div class="hero__trust">
      <p>Join leading academic and business organizations trusting Lettria</p>
      <!-- Partner logos -->
    </div>
  </div>

  <div class="hero__right">
    <div class="card">
      <!-- Sign up form or CTA -->
    </div>
  </div>
</section>
```

**Styling:**
```css
.hero {
  display: grid;
  grid-template-columns: 45% 55%;
  min-height: 100vh;
  background: linear-gradient(135deg, #0F172A, #1E1B4B);
}

.hero__left {
  padding: 80px;
  position: relative;
}

.hero__title {
  font-size: 48px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
  margin: 40px 0;
}

.hero__features li {
  color: white;
  font-size: 16px;
  margin-bottom: 12px;
}
```

### 2. Contact Page

**Pattern: Split-screen contact form**

Similar to hero but with:
- Left: Contact information, description
- Right: Multi-field contact form card

### 3. Verification Page

**Pattern: Split-screen verification**

- Left: Features/benefits
- Right: Verification code input (6 boxes)
- Timer countdown
- Resend link

### 4. Dashboard

**Pattern: Sidebar + main content**

```html
<div class="dashboard">
  <aside class="sidebar">
    <!-- Navigation -->
  </aside>

  <main class="dashboard__content">
    <header class="page-header">
      <h1>Dashboard</h1>
    </header>

    <section class="section">
      <div class="section__header">
        <span class="section__emoji">👉</span>
        <h2>Get started with Lettria</h2>
      </div>

      <div class="section__content">
        <h3>Create your first project</h3>
        <p>Description...</p>
        <button class="btn-primary">+ Create project</button>
      </div>
    </section>
  </main>
</div>
```

---

## Micro-interactions & Animations

### 1. Button Hover
```css
.btn:hover {
  transform: translateY(-1px);
  box-shadow: /* Enhanced shadow */;
}

.btn:active {
  transform: translateY(0);
}
```

### 2. Card Hover
```css
.card:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
  box-shadow: /* Enhanced shadow */;
}
```

### 3. Floating Elements
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.floating {
  animation: float 3s ease-in-out infinite;
}
```

### 4. Modal Entrance
```css
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal {
  animation: modalFadeIn 0.2s ease-out;
}
```

### 5. Input Focus
```css
.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(107, 78, 255, 0.1);
  transition: all 0.2s ease;
}
```

---

## Responsive Patterns

### Breakpoints (Recommended)

```css
/* Mobile */
@media (max-width: 640px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    transform: translateX(-100%);
  }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .sidebar {
    width: 200px;
  }
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full layouts */
}
```

---

## Implementation Priority

### Phase 1: Core Components (Week 1)
1. ✅ Tailwind config with design tokens
2. Global styles and animations
3. Button components (primary, secondary, accent)
4. Input components (text, password, select)
5. Card components

### Phase 2: Layout & Navigation (Week 1-2)
6. Modal component (reusable)
7. Sidebar navigation
8. Page layouts (split-screen, sidebar+content)
9. Empty states

### Phase 3: Forms & Interactions (Week 2)
10. Form validation
11. Verification code input
12. Toggle switches
13. Dropdowns
14. Tags & pills

### Phase 4: Pages (Week 2-3)
15. Landing page
16. Sign up / Login pages
17. Dashboard layout
18. Contact page

---

## Key Takeaways for OrizonQA

### ✅ What to Adopt

1. **Purple Primary Color** - Aligns with our chosen palette
2. **Split-Screen Layouts** - Perfect for landing/auth pages
3. **Clean Card Design** - Modern, accessible
4. **Sidebar Navigation** - Standard SaaS pattern
5. **Modal Patterns** - Reusable for various actions
6. **Empty States with Illustrations** - Engaging UX
7. **Micro-animations** - Subtle, professional
8. **Form Patterns** - Well-structured, accessible

### 🎨 What to Customize

1. **Accent Color** - Replace yellow/gold with your brand accent
2. **Logo & Branding** - Replace Lettria branding
3. **Illustrations** - Custom or different illustration style
4. **Icon Set** - Consistent with OrizonQA brand
5. **Copy/Messaging** - QA-focused content

### 📝 Design Principles Observed

1. **Consistency** - Same patterns throughout
2. **Hierarchy** - Clear visual hierarchy
3. **Whitespace** - Generous spacing, not cramped
4. **Accessibility** - Good contrast, clear focus states
5. **Responsiveness** - Mobile-first approach
6. **Performance** - Smooth, performant animations
7. **Simplicity** - Clean, not over-designed

---

## Next Steps

1. ✅ Review this analysis
2. 🔄 Customize colors for OrizonQA brand
3. 🔄 Add OrizonQA logo and assets
4. 🔄 Implement core component library
5. 🔄 Build landing page
6. 🔄 Build authentication pages
7. 🔄 Build dashboard layout
8. 🔄 Test and refine

---

**Note:** This analysis is based on the Lettria platform mockups and serves as a reference for implementing OrizonQA's design system. All patterns should be adapted to fit OrizonQA's specific brand and requirements.
