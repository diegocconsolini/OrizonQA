#!/bin/bash

# Design System Migration Script
# Automatically replaces legacy Slate colors with ORIZON design system colors
# Usage: ./scripts/migrate-slate-colors.sh <file_path>

if [ -z "$1" ]; then
  echo "Usage: $0 <file_path>"
  exit 1
fi

FILE="$1"

if [ ! -f "$FILE" ]; then
  echo "Error: File not found: $FILE"
  exit 1
fi

echo "Migrating: $FILE"

# Backup original file
cp "$FILE" "${FILE}.backup"

# Page backgrounds
sed -i 's/bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900/bg-bg-dark/g' "$FILE"

# Surface backgrounds
sed -i 's/bg-slate-800/bg-surface-dark/g' "$FILE"
sed -i 's/bg-slate-700/bg-surface-hover-dark/g' "$FILE"

# Borders
sed -i 's/border-slate-700/border-white\/10/g' "$FILE"
sed -i 's/border-slate-600/border-white\/20/g' "$FILE"

# Text colors
sed -i 's/text-slate-300/text-white/g' "$FILE"
sed -i 's/text-slate-400/text-text-secondary-dark/g' "$FILE"
sed -i 's/text-slate-500/text-text-muted-dark/g' "$FILE"
sed -i 's/text-slate-600/text-text-muted-dark/g' "$FILE"

# Placeholders
sed -i 's/placeholder-slate-400/placeholder-text-muted-dark/g' "$FILE"

# Focus states
sed -i 's/focus:border-cyan-500/focus:border-primary/g' "$FILE"

# Hover backgrounds
sed -i 's/hover:bg-slate-600/hover:bg-surface-hover-dark/g' "$FILE"
sed -i 's/hover:bg-slate-700/hover:bg-white\/10/g' "$FILE"

# Spinner borders
sed -i 's/border-cyan-500/border-primary/g' "$FILE"

echo "Migration complete: $FILE"
echo "Backup saved: ${FILE}.backup"
echo ""
echo "Please review the changes and remove the backup if satisfied:"
echo "  rm ${FILE}.backup"
