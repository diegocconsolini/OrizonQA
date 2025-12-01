# ORIZON QA - Visual Design Guide & Redesign Showcase

## 🎨 Design System Overview

### Color Palette

#### Primary - Event Horizon Blue
```
#00D4FF - Bright cyan (main accent)
#00B8E6 - Hover state
#009CCC - Active state
#33DDFF - Light variant
#0088CC - Dark variant
```

#### Accent - Accretion Orange
```
#FF9500 - Main orange accent
#E68500 - Hover state
#FFAD33 - Light variant
#CC7700 - Dark variant
```

#### Quantum Violet
```
#6A00FF - Quantum purple
#8533FF - Light variant
```

#### Backgrounds
```
#0A0A0A - Deep void black (primary background)
#1A1A1A - Elevated surfaces
#2A2A2A - Hover states
#000000 - Pure black
```

#### Text
```
#FFFFFF - Primary text
#C8C8C8 - Secondary text
#808080 - Muted text
```

#### Semantic
```
#10B981 - Success (green)
#EF4444 - Error (red)
#F59E0B - Warning (orange)
```

---

## 📦 Component Library (25 Components)

### Forms & Input
✅ Input - Text input with validation
✅ Textarea - Multi-line input
✅ Select - Dropdown selector
✅ Checkbox - Single/group checkboxes
✅ Radio - Radio button groups
✅ ToggleSwitch - On/off toggle
✅ FileUpload - Drag & drop file upload

### Actions
✅ Button - 4 variants (primary, secondary, ghost, icon), 3 sizes
✅ Dropdown - Menu with keyboard navigation

### Layout
✅ Card - Base card with header, content, footer
✅ Modal - Dialog with backdrop, 3 sizes
✅ Tabs - Tab system with panels, 3 variants
✅ Sidebar - Navigation sidebar
✅ Accordion - Expandable sections

### Navigation
✅ NavItem - Navigation item
✅ Breadcrumbs - Breadcrumb navigation
✅ Pagination - Advanced pagination

### Feedback
✅ Toast - Notification toasts with hook
✅ Alert - Inline alerts (error/success)
✅ EmptyState - Empty state with CTA, 3 variants
✅ Progress - Progress bar, circular, spinner
✅ Tooltip - Hover tooltips

### Display
✅ Logo - Brand logo (full/icon, blue/purple)
✅ Avatar - User avatar with initials, 6 sizes
✅ Tag - Badge/tag with icon and close

---

## 🎯 Page Redesign Examples

### Dashboard (Priority #1)

**Before**: Basic layout, no history
**After**: Enhanced workspace with sidebar

```
┌─────────────────────────────────────────────────────────┐
│  ORIZON QA                    [Avatar] [Settings] [Logout] │
├──────────────┬──────────────────────────────────────────┤
│              │  ╔════════════════════════════════════╗  │
│  Recent (5)  │  ║  ANALYZE CODE                      ║  │
│              │  ╚════════════════════════════════════╝  │
│ ┌──────────┐ │                                          │
│ │ Analysis │ │  ┌─────┬──────────┬───────┬─────────┐  │
│ │ #147     │ │  │Input│Configure │Analyze│ Results │  │
│ │ 2m ago   │ │  └─────┴──────────┴───────┴─────────┘  │
│ │ ⚡ Claude│ │                                          │
│ └──────────┘ │  ╔════════════════════════════════════╗ │
│              │  ║ Paste code or upload files...      ║ │
│ ┌──────────┐ │  ║                                    ║ │
│ │ Analysis │ │  ║                                    ║ │
│ │ #146     │ │  ╚════════════════════════════════════╝ │
│ │ 1h ago   │ │                                          │
│ │ 🤖 LM    │ │  [📎 Upload] [🔗 GitHub] [⚡ Analyze]  │
│ └──────────┘ │                                          │
│              │                                          │
│ [View All]   │  Stats: 147 analyses • 2.4M tokens     │
└──────────────┴──────────────────────────────────────────┘
```

**Key Improvements**:
- ✅ Recent analyses sidebar (loads from DB)
- ✅ Tabbed workflow for clarity
- ✅ Stats display (token usage)
- ✅ Quick access to history
- ✅ Empty state for new users

---

### Landing Page (Priority #2)

**Before**: Basic hero with video
**After**: Modern hero with features

```
┌─────────────────────────────────────────────────────────┐
│  ORIZON                     [Login] [Start Free Trial]   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│         ⚫ GARGANTUA LOGO                                 │
│                                                           │
│    Transform Code into Comprehensive QA Artifacts        │
│           AI-Powered • Instant • Enterprise-Grade        │
│                                                           │
│      [🚀 Start Analyzing Now]  [📺 Watch Demo]          │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │ 📝 USER │  │ ✅ TEST │  │ 📋 ACC  │  │ ⚡ AUTO │   │
│  │ STORIES │  │  CASES  │  │CRITERIA │  │  MATED  │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  💬 "Saved us 20 hours per week" - Tech Lead @ Startup  │
│  ⭐⭐⭐⭐⭐ "Best QA tool we've used" - QA Manager       │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  📊 INTERACTIVE DEMO                                     │
│  [Live code analysis preview with animation]             │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Key Improvements**:
- ✅ Stronger value proposition
- ✅ Feature cards with icons
- ✅ Social proof section
- ✅ Interactive demo
- ✅ Clear CTAs with cosmic glow

---

### Settings (Priority #5)

**Before**: Simple form
**After**: Tabbed interface

```
┌─────────────────────────────────────────────────────────┐
│  Settings                                   [User Avatar] │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  [Account] [API Keys] [Preferences] [Usage] [Security]   │
│  ════════                                                 │
│                                                           │
│  Profile Information                                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Email:      diego@example.com    [Change Email]   │  │
│  │ Full Name:  Diego Consolini      [Edit]           │  │
│  │ Member Since: Nov 2024                             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  Password & Security                                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Last changed: 2 weeks ago                          │  │
│  │ [Change Password]                                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  Danger Zone                                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Delete Account                                     │  │
│  │ This action cannot be undone.                      │  │
│  │ [Delete My Account]                                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Key Improvements**:
- ✅ Tabbed organization
- ✅ Clear sections with cards
- ✅ Avatar upload capability
- ✅ Usage statistics tab
- ✅ API key management

---

### History Page (NEW - Priority #9)

**Design**: New page for viewing past analyses

```
┌─────────────────────────────────────────────────────────┐
│  Analysis History                        [Export All]     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  🔍 Search...     [Provider ▼] [Model ▼] [Date ▼]       │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Analysis #147                    2 minutes ago     │  │
│  │ ⚡ Claude Sonnet 4 • 14,523 tokens                │  │
│  │ Input: GitHub Repository (next.js/examples)        │  │
│  │ [View] [Download] [Delete]                         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Analysis #146                    1 hour ago        │  │
│  │ 🤖 LM Studio • 8,234 tokens                       │  │
│  │ Input: File Upload (3 files)                       │  │
│  │ [View] [Download] [Delete]                         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Analysis #145                    2 days ago        │  │
│  │ ⚡ Claude Opus • 23,891 tokens                    │  │
│  │ Input: Code Paste                                  │  │
│  │ [View] [Download] [Delete]                         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  [◄ Previous]  Page 1 of 15  [Next ►]                   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Features**:
- ✅ Paginated list with cards
- ✅ Filter by provider, model, date
- ✅ Search functionality
- ✅ Quick actions (view, download, delete)
- ✅ Token usage display
- ✅ Empty state for new users

---

## 🎨 Typography Hierarchy

### Headlines (Outfit font)
```
Hero Title:     text-6xl font-bold font-primary (60px)
Page Title:     text-4xl font-bold font-primary (36px)
Section Title:  text-2xl font-semibold font-primary (24px)
Card Title:     text-xl font-semibold font-primary (20px)
```

### Body (Inter font)
```
Large:    text-lg font-secondary (18px)
Regular:  text-base font-secondary (16px)
Small:    text-sm font-secondary (14px)
Tiny:     text-xs font-secondary (12px)
```

### Code (JetBrains Mono)
```
Inline:   font-mono text-sm (14px)
Block:    font-mono text-xs (12px)
```

---

## ✨ Cosmic Effects

### Glow Effects
```css
Primary Glow:     shadow-glow-primary (cyan)
Primary Large:    shadow-glow-primary-lg
Primary XL:       shadow-glow-primary-xl
Accent Glow:      shadow-glow-accent (orange)
Accent Large:     shadow-glow-accent-lg
```

### Button Styles
```javascript
// Primary - Glowing cyan
<Button variant="primary">
  className="bg-primary hover:bg-primary-hover
             text-black shadow-glow-primary
             hover:shadow-glow-primary-lg"
</Button>

// Secondary - Transparent with border
<Button variant="secondary">
  className="bg-white/10 hover:bg-white/20
             text-white border border-white/20"
</Button>

// Ghost - No background
<Button variant="ghost">
  className="text-primary hover:bg-primary/10"
</Button>
```

### Card Styles
```javascript
<Card className="bg-surface-dark border border-white/10
                 shadow-lg hover:shadow-glow-primary/20">
  <CardHeader>
    <CardTitle>Analysis #147</CardTitle>
  </CardHeader>
  <CardContent>
    ...
  </CardContent>
</Card>
```

---

## 📱 Responsive Design

### Breakpoints
```javascript
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large
```

### Mobile-First Patterns
```javascript
// Stack on mobile, side-by-side on desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// Hide sidebar on mobile, show on desktop
<aside className="hidden lg:block">

// Full width on mobile, fixed width on desktop
<main className="w-full lg:max-w-4xl lg:mx-auto">
```

---

## ⌨️ Keyboard Shortcuts

### Global
```
Cmd+K / Ctrl+K: Open command palette
Cmd+/ / Ctrl+/: Toggle help
Esc: Close modals/dropdowns
```

### Dashboard
```
Cmd+Enter / Ctrl+Enter: Run analysis
Cmd+S / Ctrl+S: Save (if editing)
Tab: Navigate between inputs
```

### Navigation
```
Cmd+1-9: Switch tabs
Arrow Keys: Navigate lists/dropdowns
Space: Select/toggle
```

---

## 🔧 Implementation Code Examples

### Page Layout Template
```javascript
export default function PageName() {
  return (
    <div className="min-h-screen bg-bg-dark">
      {/* Header */}
      <header className="border-b border-white/10 bg-surface-dark">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Logo variant="full" color="blue" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold font-primary text-white mb-8">
          Page Title
        </h1>

        {/* Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <CardTitle>Section Title</CardTitle>
            <CardContent>Content here</CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
```

### Form Section Template
```javascript
<Card className="bg-surface-dark border border-white/10">
  <CardHeader>
    <CardTitle>Form Title</CardTitle>
    <CardDescription>Form description text</CardDescription>
  </CardHeader>

  <CardContent className="space-y-6">
    <Input
      label="Email"
      type="email"
      placeholder="you@example.com"
      helperText="We'll never share your email"
    />

    <Textarea
      label="Description"
      rows={4}
      placeholder="Enter description..."
    />

    <div className="flex justify-end gap-4">
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Save Changes</Button>
    </div>
  </CardContent>
</Card>
```

### Stats Dashboard Template
```javascript
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Stat Card 1 */}
  <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/20
                      flex items-center justify-center">
        <Zap className="w-6 h-6 text-primary" />
      </div>
      <div>
        <p className="text-3xl font-bold text-white">147</p>
        <p className="text-sm text-text-secondary-dark">
          Total Analyses
        </p>
      </div>
    </div>
  </Card>

  {/* Stat Card 2 */}
  <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-accent/20
                      flex items-center justify-center">
        <Activity className="w-6 h-6 text-accent" />
      </div>
      <div>
        <p className="text-3xl font-bold text-white">2.4M</p>
        <p className="text-sm text-text-secondary-dark">
          Tokens Used
        </p>
      </div>
    </div>
  </Card>

  {/* Stat Card 3 */}
  <Card className="p-6 bg-gradient-to-br from-quantum/10 to-quantum/5">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-quantum/20
                      flex items-center justify-center">
        <Clock className="w-6 h-6 text-quantum" />
      </div>
      <div>
        <p className="text-3xl font-bold text-white">89h</p>
        <p className="text-sm text-text-secondary-dark">
          Time Saved
        </p>
      </div>
    </div>
  </Card>
</div>
```

---

## 🎯 Design Checklist

### Every Page Must Have
- [ ] Consistent header with logo and navigation
- [ ] Clear page title (text-4xl font-primary)
- [ ] Proper spacing (24px grid)
- [ ] Loading states for async operations
- [ ] Error states with helpful messages
- [ ] Empty states with clear CTAs
- [ ] Mobile-responsive layout
- [ ] Keyboard navigation support
- [ ] Focus indicators on interactive elements
- [ ] Cosmic glow effects on primary actions

### Every Form Must Have
- [ ] Clear labels on all inputs
- [ ] Helper text where needed
- [ ] Inline validation feedback
- [ ] Disabled state during submission
- [ ] Loading spinner on submit button
- [ ] Success/error toast notifications
- [ ] Keyboard shortcuts (Enter to submit)
- [ ] Focus management
- [ ] Clear error messages
- [ ] Confirmation for destructive actions

### Every Card Must Have
- [ ] bg-surface-dark background
- [ ] border border-white/10
- [ ] Consistent padding (p-6)
- [ ] Clear title/header
- [ ] Hover effects if interactive
- [ ] Loading skeleton if async
- [ ] Empty state if no data
- [ ] Actions clearly visible

---

**End of Visual Guide**
