# Layout Fix Plan: Settings & Analyze Pages

## Reference Standard (Projects Page Pattern)

The Projects page represents the visual standard that Settings and Analyze should follow:

### Structure Pattern
```jsx
<AppLayout>
  <div className="min-h-screen bg-bg-dark">
    {/* Sticky Header */}
    <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
      <div className="px-6 py-6">
        {/* Header content */}
      </div>
    </div>

    {/* Content Area */}
    <div className="px-6 py-8">
      {/* Page content */}
    </div>
  </div>
</AppLayout>
```

### Key Design Tokens
- **Page background**: `bg-bg-dark`
- **Header background**: `bg-surface-dark/50 backdrop-blur-sm`
- **Header border**: `border-b border-white/10`
- **Content padding**: `px-6 py-8`
- **Input background**: `bg-surface-dark` (NOT bg-bg-dark)
- **Input border**: `border border-white/10` (NOT border-2)
- **Card/Panel background**: `bg-surface-dark` (from Card component)

---

## SETTINGS PAGE FIXES

### Current Issues
1. Uses `<main className="p-4 md:p-6 lg:p-8">` instead of sticky header + content pattern
2. Input uses `bg-bg-dark border-2` instead of `bg-surface-dark border`
3. No sticky header with backdrop blur
4. Loading state doesn't use AppLayout

### Fix Steps

#### Step 1: Update main container structure
**File**: `app/settings/SettingsPageClient.jsx`
**Lines**: ~440-457

Replace:
```jsx
<AppLayout>
  <div className="w-full">
    <main className="p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
```

With:
```jsx
<AppLayout>
  <div className="min-h-screen bg-bg-dark">
    {/* Sticky Header */}
    <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-cyan-500 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-sm text-text-secondary-dark">
                Manage your account preferences and API configurations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Content Area */}
    <div className="px-6 py-8">
```

#### Step 2: Fix closing tags
**Lines**: ~1343-1350

Replace:
```jsx
        </main>
      </div>
    </AppLayout>
```

With:
```jsx
    </div>
  </div>
</AppLayout>
```

#### Step 3: Fix input styling (ALL inputs)
Search and replace across the file:
- `bg-bg-dark border-2 border-white/10` → `bg-surface-dark border border-white/10`

Affected lines (approximately):
- Line ~604: Claude API key input
- Line ~735: LM Studio URL input
- Line ~942: Name edit input
- Line ~1122, 1131, 1145: Password modal inputs
- Line ~1205, 1218: Set password modal inputs
- Line ~1284: Delete account password input

#### Step 4: Fix loading state
**Lines**: ~429-437

Replace:
```jsx
if (loading) {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center">
```

With:
```jsx
if (loading) {
  return (
    <AppLayout>
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-secondary-dark">Loading settings...</p>
        </div>
      </div>
    </AppLayout>
  );
}
```

---

## ANALYZE PAGE FIXES

### Current Issues
1. Uses `<main className="p-4 md:p-6 lg:p-8">` instead of sticky header + content pattern
2. Header has custom badge styling that doesn't match
3. Some inputs may use wrong background color

### Fix Steps

#### Step 1: Update main container structure
**File**: `app/analyze/page.js`
**Lines**: ~618-652

Replace the header section with sticky header pattern similar to Projects page.

#### Step 2: Fix closing structure
Find the closing tags and update to match new structure.

#### Step 3: Verify input styling
Ensure all inputs use `bg-surface-dark border border-white/10`

---

## VERIFICATION CHECKLIST

After making changes:
- [ ] Build passes (`npm run build`)
- [ ] Settings page header matches Projects page header style
- [ ] Settings tabs work correctly
- [ ] All Settings forms work (API key, password change, etc.)
- [ ] Analyze page header matches Projects page header style
- [ ] All Analyze tabs work correctly
- [ ] File upload works
- [ ] GitHub connection works
- [ ] Analysis execution works
- [ ] No console errors
- [ ] Responsive design works on mobile

---

## ELEMENTS TO PRESERVE (DO NOT MODIFY)

### Settings Page
- Tab functionality (LLM Config, GitHub, Usage Stats, Account)
- Form state management
- API key validation logic
- Password change/set modals
- Delete account modal
- GitHub connection section
- All handler functions

### Analyze Page
- Tab functionality (Input, Configure, Output)
- All input modes (Paste, GitHub, Upload)
- Repository selector
- Branch/file picker
- Analysis configuration
- Token counter
- Cache status bar
- Progress indicators
- Output rendering
