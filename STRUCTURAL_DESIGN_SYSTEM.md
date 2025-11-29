# OrizonQA Structural Design System
## Complete Implementation Blueprint

**Version:** 1.0
**Status:** Brand-Agnostic Structure
**Purpose:** Complete structural specifications ready for branding overlay

---

## Table of Contents

1. [Foundation](#foundation)
2. [Layout System](#layout-system)
3. [Component Specifications](#component-specifications)
4. [Page Templates](#page-templates)
5. [Interaction Patterns](#interaction-patterns)
6. [Implementation Guide](#implementation-guide)

---

## 1. Foundation

### 1.1 Grid System

**Base Unit:** 8px
**Column Grid:** 12-column flexible grid
**Gutter:** 24px (desktop), 16px (tablet), 12px (mobile)

```css
/* Grid Container */
.container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 32px;
}

/* Grid Row */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}

/* Responsive Adjustments */
@media (max-width: 1024px) {
  .container { padding: 0 24px; }
  .grid { gap: 20px; }
}

@media (max-width: 640px) {
  .container { padding: 0 16px; }
  .grid { gap: 16px; }
}
```

### 1.2 Spacing Scale (8px base)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing, icon gaps |
| `--space-2` | 8px | Base unit, minimal spacing |
| `--space-3` | 12px | Compact elements |
| `--space-4` | 16px | Default element spacing |
| `--space-5` | 20px | Medium spacing |
| `--space-6` | 24px | Comfortable spacing, card padding |
| `--space-8` | 32px | Section spacing |
| `--space-10` | 40px | Large section gaps |
| `--space-12` | 48px | Major section dividers |
| `--space-16` | 64px | Page margins |
| `--space-20` | 80px | Hero/landing spacing |

### 1.3 Typography Scale

**Font Stack:**
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

**Type Scale:**

| Class | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `.text-xs` | 11px | 500 | 14px | 0.05em | Labels, uppercase |
| `.text-sm` | 12px | 400 | 16px | 0 | Metadata, captions |
| `.text-base` | 14px | 400 | 20px | 0 | Body text |
| `.text-md` | 16px | 500 | 24px | 0 | Emphasized text |
| `.text-lg` | 18px | 600 | 26px | 0 | Subsection headings |
| `.text-xl` | 20px | 600 | 28px | 0 | Card titles |
| `.text-2xl` | 24px | 700 | 32px | -0.01em | Section headings |
| `.text-3xl` | 32px | 700 | 40px | -0.02em | Page titles |
| `.text-4xl` | 48px | 700 | 56px | -0.02em | Hero titles |

### 1.4 Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Tags, small elements |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards, containers |
| `--radius-xl` | 16px | Large cards, modals |
| `--radius-2xl` | 24px | Hero sections |
| `--radius-full` | 9999px | Pills, avatars |

### 1.5 Shadow System

```css
/* Elevation Levels */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.3);

/* Interactive Shadows (to be colored with brand) */
--shadow-primary: 0 2px 8px var(--primary-shadow-color);
--shadow-primary-lg: 0 4px 16px var(--primary-shadow-color);
```

### 1.6 Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 10;
--z-sticky: 20;
--z-fixed: 30;
--z-modal-backdrop: 40;
--z-modal: 50;
--z-popover: 60;
--z-tooltip: 70;
```

---

## 2. Layout System

### 2.1 Page Layout Types

#### A. Split-Screen Layout

**Ratio:** 45% / 55% (left/right)
**Height:** 100vh minimum
**Breakpoint:** Stacks at 1024px

```html
<div class="layout-split">
  <div class="layout-split__left">
    <!-- Content, features, value prop -->
  </div>
  <div class="layout-split__right">
    <!-- Form card, CTA, interaction -->
  </div>
</div>
```

```css
.layout-split {
  display: grid;
  grid-template-columns: 45fr 55fr;
  min-height: 100vh;
}

.layout-split__left {
  padding: 80px;
  position: relative;
  overflow: hidden;
}

.layout-split__right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

/* Responsive */
@media (max-width: 1024px) {
  .layout-split {
    grid-template-columns: 1fr;
  }

  .layout-split__left {
    min-height: 50vh;
    padding: 40px 24px;
  }
}
```

#### B. Sidebar + Content Layout

**Sidebar:** 240px fixed
**Content:** Flexible remaining space
**Sidebar Behavior:** Fixed on desktop, overlay on mobile

```html
<div class="layout-sidebar">
  <aside class="layout-sidebar__sidebar">
    <!-- Navigation -->
  </aside>
  <main class="layout-sidebar__content">
    <!-- Page content -->
  </main>
</div>
```

```css
.layout-sidebar {
  display: flex;
  min-height: 100vh;
}

.layout-sidebar__sidebar {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
}

.layout-sidebar__content {
  flex: 1;
  overflow-y: auto;
}

/* Mobile: Sidebar becomes overlay */
@media (max-width: 768px) {
  .layout-sidebar__sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: var(--z-fixed);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .layout-sidebar__sidebar.open {
    transform: translateX(0);
  }
}
```

#### C. Centered Content Layout

**Max Width:** 600px (small), 900px (large)
**Alignment:** Center
**Padding:** 40px vertical, 24px horizontal

```css
.layout-centered {
  max-width: 600px;
  margin: 40px auto;
  padding: 0 24px;
}

.layout-centered-lg {
  max-width: 900px;
  margin: 40px auto;
  padding: 0 24px;
}
```

### 2.2 Section Spacing

```css
/* Standard Section */
.section {
  padding: 64px 0;
}

.section-sm {
  padding: 40px 0;
}

.section-lg {
  padding: 96px 0;
}

/* Section with Background */
.section-bg {
  padding: 64px 0;
  margin: 0 -32px; /* Bleed to container edges */
}
```

---

## 3. Component Specifications

### 3.1 Buttons

#### Primary Button

**Dimensions:**
- Height: 44px (default), 36px (small), 52px (large)
- Padding: 12px 24px (horizontal)
- Border Radius: 8px
- Font: 14px, weight 600

```css
.btn {
  height: 44px;
  padding: 0 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.33, 1, 0.68, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  box-shadow: var(--shadow-primary);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-primary-lg);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-primary);
}

.btn-primary:disabled {
  background: var(--color-disabled);
  color: var(--color-on-disabled);
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

/* Sizes */
.btn-sm {
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
}

.btn-lg {
  height: 52px;
  padding: 0 32px;
  font-size: 16px;
}

/* With Icon */
.btn svg {
  width: 16px;
  height: 16px;
}
```

#### Secondary Button

```css
.btn-secondary {
  background: var(--color-surface);
  color: var(--color-on-surface);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.btn-secondary:hover {
  background: var(--color-surface-hover);
  border-color: var(--border-color-hover);
}
```

#### Tertiary/Ghost Button

```css
.btn-ghost {
  background: transparent;
  color: var(--color-text-primary);
  box-shadow: none;
}

.btn-ghost:hover {
  background: var(--color-surface-hover);
}
```

#### Icon Button

**Dimensions:** 40px × 40px square

```css
.btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.btn-icon svg {
  width: 20px;
  height: 20px;
}
```

### 3.2 Form Inputs

#### Text Input

**Dimensions:**
- Height: 44px
- Padding: 0 16px
- Border: 1px solid
- Border Radius: 8px
- Font: 14px

```css
.input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  font-family: var(--font-primary);
  color: var(--color-text-primary);
  background: var(--color-surface);
  transition: all 0.2s ease;
}

.input::placeholder {
  color: var(--color-text-muted);
}

.input:hover {
  border-color: var(--border-color-hover);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-focus-ring);
}

.input:disabled {
  background: var(--color-surface-disabled);
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

/* Error State */
.input.error {
  border-color: var(--color-error);
}

.input.error:focus {
  box-shadow: 0 0 0 3px var(--color-error-focus-ring);
}

/* Success State */
.input.success {
  border-color: var(--color-success);
}
```

#### Textarea

```css
.textarea {
  min-height: 120px;
  padding: 12px 16px;
  resize: vertical;
}
```

#### Select Dropdown

```css
.select {
  appearance: none;
  background-image: url("data:image/svg+xml...");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
  cursor: pointer;
}
```

#### Password Input

**Structure:** Input with toggle button

```html
<div class="input-password">
  <input type="password" class="input" />
  <button type="button" class="input-password__toggle">
    <!-- Eye icon -->
  </button>
</div>
```

```css
.input-password {
  position: relative;
}

.input-password__toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--color-text-muted);
}

.input-password__toggle:hover {
  color: var(--color-text-primary);
}
```

#### Label

```css
.label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.label-required::after {
  content: '*';
  color: var(--color-error);
  margin-left: 4px;
}
```

#### Form Group

```css
.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
```

#### Verification Code Input

**Structure:** 6 individual inputs

```html
<div class="verification-code">
  <input type="text" maxlength="1" />
  <input type="text" maxlength="1" />
  <input type="text" maxlength="1" />
  <input type="text" maxlength="1" />
  <input type="text" maxlength="1" />
  <input type="text" maxlength="1" />
</div>
```

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
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 0;
}

.verification-code input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-focus-ring);
}
```

### 3.3 Cards

#### Standard Card

**Padding:** 24px
**Border:** 1px solid
**Border Radius:** 12px
**Shadow:** soft

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-color-hover);
}
```

#### Feature Card (with icon)

**Icon Container:** 48px × 48px, 12px radius

```html
<div class="card-feature">
  <div class="card-feature__icon">
    <!-- Icon -->
  </div>
  <h3 class="card-feature__title">Title</h3>
  <p class="card-feature__description">Description</p>
</div>
```

```css
.card-feature {
  background: var(--color-surface);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card-feature:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.card-feature__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--icon-bg-color);
  color: var(--icon-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.card-feature__icon svg {
  width: 24px;
  height: 24px;
}

.card-feature__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.card-feature__description {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}
```

#### Floating Card (animated)

```css
.card-floating {
  background: var(--color-surface);
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  display: inline-flex;
  align-items: center;
  gap: 12px;
  position: absolute;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
```

### 3.4 Modals

#### Modal Overlay Structure

```html
<div class="modal-overlay">
  <div class="modal">
    <button class="modal__close">×</button>
    <div class="modal__header">
      <h2 class="modal__title">Title</h2>
    </div>
    <div class="modal__body">
      <!-- Content -->
    </div>
    <div class="modal__footer">
      <!-- Actions -->
    </div>
  </div>
</div>
```

#### Small Modal (Form)

**Width:** 500px
**Padding:** 32px
**Border Radius:** 16px

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: 20px;
}

.modal {
  width: 500px;
  max-width: 100%;
  max-height: 90vh;
  background: var(--color-surface);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  position: relative;
  animation: modalEnter 0.2s cubic-bezier(0.33, 1, 0.68, 1);
  overflow-y: auto;
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

.modal__close {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--color-text-muted);
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.15s;
}

.modal__close:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.modal__header {
  margin-bottom: 24px;
}

.modal__title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.modal__body {
  margin-bottom: 24px;
}

.modal__footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
```

#### Large Modal (with media)

**Width:** 900px

```css
.modal-lg {
  width: 900px;
  padding: 40px;
}
```

#### Simple Modal (single input)

**Width:** 450px
**Padding:** 24px

```css
.modal-sm {
  width: 450px;
  padding: 24px;
}
```

### 3.5 Navigation Sidebar

**Width:** 240px
**Padding:** 16px
**Item Height:** 40px

```html
<aside class="sidebar">
  <div class="sidebar__logo">
    <!-- Logo -->
  </div>

  <nav class="sidebar__nav">
    <div class="sidebar__section">
      <div class="sidebar__section-label">SECTION</div>
      <a href="#" class="sidebar__item">
        <span class="sidebar__item-icon">icon</span>
        <span class="sidebar__item-text">Item</span>
        <span class="sidebar__item-badge">3</span>
      </a>
    </div>
  </nav>

  <div class="sidebar__footer">
    <!-- User info -->
  </div>
</aside>
```

```css
.sidebar {
  width: 240px;
  height: 100vh;
  background: var(--color-sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
}

.sidebar__logo {
  padding: 8px 12px;
  margin-bottom: 24px;
}

.sidebar__nav {
  flex: 1;
}

.sidebar__section {
  margin-bottom: 24px;
}

.sidebar__section-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  padding: 0 12px;
  margin-bottom: 8px;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s;
  cursor: pointer;
}

.sidebar__item:hover {
  background: var(--color-sidebar-hover);
  color: var(--color-text-primary);
}

.sidebar__item.active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.sidebar__item-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar__item-text {
  flex: 1;
}

.sidebar__item-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-badge-bg);
  color: var(--color-badge-text);
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
}

.sidebar__footer {
  padding: 12px;
  border-top: 1px solid var(--border-color);
  margin-top: 16px;
}
```

### 3.6 Tags & Pills

```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: var(--tag-bg);
  color: var(--tag-color);
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  white-space: nowrap;
  gap: 6px;
}

.tag-removable {
  padding-right: 4px;
}

.tag-removable .remove {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.6;
  border-radius: 3px;
}

.tag-removable .remove:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}
```

### 3.7 Toggle Switch

**Width:** 44px
**Height:** 24px
**Handle:** 20px circle

```css
.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-toggle-off);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle.on {
  background: var(--color-primary);
}

.toggle__handle {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.toggle.on .toggle__handle {
  transform: translateX(20px);
}
```

### 3.8 Dropdown Menu

```html
<div class="dropdown">
  <button class="dropdown__trigger">
    <span>Select</span>
    <span class="dropdown__arrow">▼</span>
  </button>
  <div class="dropdown__menu">
    <a href="#" class="dropdown__item">Item 1</a>
    <a href="#" class="dropdown__item">Item 2</a>
    <div class="dropdown__divider"></div>
    <a href="#" class="dropdown__item">Item 3</a>
  </div>
</div>
```

```css
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown__trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--color-surface);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.dropdown__arrow {
  font-size: 10px;
  transition: transform 0.2s;
}

.dropdown.open .dropdown__arrow {
  transform: rotate(180deg);
}

.dropdown__menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 180px;
  background: var(--color-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  z-index: var(--z-dropdown);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.2s;
}

.dropdown.open .dropdown__menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  color: var(--color-text-primary);
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;
}

.dropdown__item:hover {
  background: var(--color-surface-hover);
}

.dropdown__item:first-child {
  border-radius: 8px 8px 0 0;
}

.dropdown__item:last-child {
  border-radius: 0 0 8px 8px;
}

.dropdown__divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}
```

### 3.9 Progress Bar

**Height:** 8px
**Border Radius:** 4px

```css
.progress {
  width: 100%;
  height: 8px;
  background: var(--color-progress-bg);
  border-radius: 4px;
  overflow: hidden;
}

.progress__fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
  transition: width 0.3s cubic-bezier(0.33, 1, 0.68, 1);
}
```

### 3.10 Empty States

**Padding:** 80px 40px
**Max Width:** 400px centered

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

.empty-state__illustration {
  width: 200px;
  height: 200px;
  margin-bottom: 24px;
  opacity: 0.8;
}

.empty-state__title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.empty-state__description {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 24px;
  line-height: 1.6;
}
```

---

## 4. Page Templates

### 4.1 Authentication Pages (Split-Screen)

**Structure:**
```html
<div class="auth-layout">
  <div class="auth-layout__left">
    <div class="auth-layout__logo">Logo</div>
    <h1 class="auth-layout__title">Title</h1>
    <ul class="auth-layout__features">
      <li>Feature 1</li>
      <li>Feature 2</li>
      <li>Feature 3</li>
    </ul>
    <div class="auth-layout__floating-cards">
      <!-- Floating cards -->
    </div>
    <div class="auth-layout__trust">
      <!-- Trust indicators -->
    </div>
  </div>

  <div class="auth-layout__right">
    <div class="auth-card">
      <!-- Form content -->
    </div>
  </div>
</div>
```

**Auth Card Dimensions:**
- Width: 480px max
- Padding: 40px
- Border Radius: 16px

### 4.2 Dashboard Layout

**Structure:**
```html
<div class="dashboard-layout">
  <aside class="dashboard-layout__sidebar">
    <!-- Sidebar content -->
  </aside>

  <main class="dashboard-layout__main">
    <header class="dashboard-header">
      <h1 class="dashboard-header__title">Page Title</h1>
      <div class="dashboard-header__actions">
        <!-- Action buttons -->
      </div>
    </header>

    <div class="dashboard-content">
      <!-- Page content -->
    </div>
  </main>
</div>
```

**Dashboard Header:**
- Height: 72px
- Padding: 0 32px
- Border Bottom: 1px solid

### 4.3 Content Page

**Max Width:** 1200px
**Padding:** 32px

```css
.content-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
}

.content-page__header {
  margin-bottom: 40px;
}

.content-page__title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.content-page__subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
}
```

---

## 5. Interaction Patterns

### 5.1 Hover States

**Buttons:**
```css
transform: translateY(-1px);
box-shadow: enhanced;
```

**Cards:**
```css
transform: translateY(-2px);
border-color: accent;
box-shadow: enhanced;
```

**Links:**
```css
color: primary;
text-decoration: underline;
```

### 5.2 Focus States

**All Interactive Elements:**
```css
outline: none;
box-shadow: 0 0 0 3px var(--color-focus-ring);
```

### 5.3 Loading States

**Button Loading:**
```html
<button class="btn btn-primary" disabled>
  <span class="spinner"></span>
  <span>Loading...</span>
</button>
```

```css
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 5.4 Animation Timings

```css
/* Micro-interactions */
--duration-instant: 100ms;
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
--duration-slower: 500ms;

/* Timing Functions */
--ease-out: cubic-bezier(0.33, 1, 0.68, 1);
--ease-in: cubic-bezier(0.32, 0, 0.67, 0);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

---

## 6. Implementation Guide

### 6.1 CSS Variable Structure

```css
:root {
  /* === SPACING === */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  /* === TYPOGRAPHY === */
  --font-primary: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* === BORDERS === */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* === SHADOWS === */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.3);

  /* === Z-INDEX === */
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;

  /* === TRANSITIONS === */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --ease-out: cubic-bezier(0.33, 1, 0.68, 1);

  /* === COLORS (PLACEHOLDERS - TO BE REPLACED WITH BRAND) === */
  --color-primary: #BRAND_PRIMARY;
  --color-primary-hover: #BRAND_PRIMARY_HOVER;
  --color-primary-bg: #BRAND_PRIMARY_BG;
  --color-primary-focus-ring: #BRAND_PRIMARY_FOCUS;

  --color-accent: #BRAND_ACCENT;

  --color-surface: #SURFACE;
  --color-surface-hover: #SURFACE_HOVER;

  --color-text-primary: #TEXT_PRIMARY;
  --color-text-secondary: #TEXT_SECONDARY;
  --color-text-muted: #TEXT_MUTED;

  --border-color: #BORDER;
  --border-color-hover: #BORDER_HOVER;

  --color-error: #ERROR;
  --color-success: #SUCCESS;
  --color-warning: #WARNING;
}
```

### 6.2 Component Class Naming Convention

**BEM Methodology:**
```
.block
.block__element
.block__element--modifier
.block--modifier
```

**Examples:**
```css
.card
.card__header
.card__title
.card--elevated
.card--interactive

.btn
.btn--primary
.btn--secondary
.btn--sm
.btn--lg
```

### 6.3 Responsive Breakpoint Usage

```css
/* Mobile First Approach */

/* Base styles: Mobile (320px+) */
.component { }

/* Tablet (768px+) */
@media (min-width: 768px) {
  .component { }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .component { }
}

/* Large Desktop (1280px+) */
@media (min-width: 1280px) {
  .component { }
}
```

### 6.4 Accessibility Requirements

**Keyboard Navigation:**
- All interactive elements must be focusable
- Tab order must be logical
- Escape key closes modals/dropdowns

**Focus Indicators:**
- Visible 3px ring on all interactive elements
- Never remove outline without replacement

**Color Contrast:**
- Text: Minimum 4.5:1
- Large text (18px+): Minimum 3:1
- UI components: Minimum 3:1

**ARIA Labels:**
```html
<!-- Icon-only buttons -->
<button aria-label="Close">×</button>

<!-- Status messages -->
<div role="alert" aria-live="polite">Success!</div>

<!-- Modal -->
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Modal Title</h2>
</div>
```

### 6.5 Performance Guidelines

**CSS:**
- Use `transform` and `opacity` for animations
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly

**Images:**
- Use WebP format when possible
- Provide fallbacks for older browsers
- Implement lazy loading for below-fold images

**Fonts:**
- Preload critical fonts
- Use `font-display: swap`
- Subset fonts when possible

---

## 7. Component Checklist

### Implementation Checklist

#### ✅ Foundation
- [ ] CSS variables defined
- [ ] Typography scale implemented
- [ ] Spacing scale defined
- [ ] Color system placeholders ready
- [ ] Shadow system configured
- [ ] Border radius scale set

#### 🔲 Components - Forms
- [ ] Text input
- [ ] Textarea
- [ ] Select dropdown
- [ ] Password input with toggle
- [ ] Verification code input
- [ ] Form labels
- [ ] Form validation states
- [ ] Form groups/rows

#### 🔲 Components - Buttons
- [ ] Primary button
- [ ] Secondary button
- [ ] Ghost button
- [ ] Icon button
- [ ] Button sizes (sm, md, lg)
- [ ] Button states (hover, active, disabled, loading)
- [ ] Button with icon

#### 🔲 Components - Cards
- [ ] Standard card
- [ ] Feature card with icon
- [ ] Floating card
- [ ] Interactive card
- [ ] Module card

#### 🔲 Components - Navigation
- [ ] Sidebar navigation
- [ ] Sidebar sections
- [ ] Sidebar items (normal, active, hover)
- [ ] Sidebar badges
- [ ] Sidebar footer

#### 🔲 Components - Modals
- [ ] Modal overlay/backdrop
- [ ] Small modal (500px)
- [ ] Medium modal (600px)
- [ ] Large modal (900px)
- [ ] Modal header
- [ ] Modal body
- [ ] Modal footer
- [ ] Modal close button
- [ ] Modal animations

#### 🔲 Components - Misc
- [ ] Tags/pills
- [ ] Toggle switch
- [ ] Dropdown menu
- [ ] Progress bar
- [ ] Empty states
- [ ] Loading states
- [ ] Badges

#### 🔲 Layouts
- [ ] Split-screen layout
- [ ] Sidebar + content layout
- [ ] Centered content layout
- [ ] Container system
- [ ] Grid system
- [ ] Section spacing

#### 🔲 Pages
- [ ] Authentication layout template
- [ ] Dashboard layout template
- [ ] Content page template

---

## 8. Next Steps

### Phase 1: Brand Application (WAITING)
1. Receive logo files
2. Receive color palette
3. Receive brand guidelines
4. Update CSS variables with brand colors
5. Replace logo placeholders
6. Adjust color relationships

### Phase 2: Component Implementation
1. Create base CSS/Tailwind utilities
2. Build component library
3. Create Storybook/documentation
4. Test responsive behaviors
5. Accessibility audit

### Phase 3: Page Construction
1. Build landing page
2. Build authentication pages
3. Build dashboard
4. Build content pages
5. Integration testing

---

## Appendix: Quick Reference

### Common Measurements

| Element | Size |
|---------|------|
| Button height | 44px (36px sm, 52px lg) |
| Input height | 44px |
| Sidebar width | 240px |
| Modal small | 500px |
| Modal medium | 600px |
| Modal large | 900px |
| Card padding | 24px |
| Modal padding | 32px |
| Section padding | 64px vertical |
| Container max-width | 1440px |

### Common Gaps

| Context | Gap |
|---------|-----|
| Button icon gap | 8px |
| Form field gap | 20px |
| Form row gap | 16px |
| Card grid gap | 24px |
| Section gap | 64px |
| Inline elements | 8px-12px |

---

**Document Status:** ✅ Complete - Ready for Brand Overlay
**Last Updated:** 2025-11-30
**Version:** 1.0
**Purpose:** Complete structural specification for OrizonQA design implementation
