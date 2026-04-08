#!/usr/bin/env bash
set -euo pipefail

# Bump the version for a plugin across package.json, src/plugin.ts, and readme.txt.
# Usage: ./scripts/bump-version.sh <plugin-name> <patch|minor|major>
# Outputs the new version to stdout.

PLUGIN="${1:?Usage: bump-version.sh <plugin-name> <patch|minor|major>}"
BUMP="${2:?Usage: bump-version.sh <plugin-name> <patch|minor|major>}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG_DIR="$REPO_ROOT/packages/$PLUGIN"

if [ ! -d "$PKG_DIR" ]; then
  echo "Error: package directory not found: $PKG_DIR" >&2
  exit 1
fi

# Read current version from package.json
CURRENT=$(node -e "console.log(require('$PKG_DIR/package.json').version)")

# Compute new version
NEW=$(node -e "
  const [major, minor, patch] = '$CURRENT'.split('.').map(Number);
  const bump = '$BUMP';
  if (bump === 'major') console.log(\`\${major+1}.0.0\`);
  else if (bump === 'minor') console.log(\`\${major}.\${minor+1}.0\`);
  else if (bump === 'patch') console.log(\`\${major}.\${minor}.\${patch+1}\`);
  else { console.error('Invalid bump type: ' + bump); process.exit(1); }
")

# Escape dots for sed regex
ESCAPED_CURRENT=$(printf '%s' "$CURRENT" | sed 's/\./\\./g')

# Portable in-place sed (macOS and Linux compatible)
sed_inplace() {
  local expr="$1" file="$2" tmp
  tmp=$(mktemp)
  sed "$expr" "$file" > "$tmp" && mv "$tmp" "$file"
}

# Update package.json
sed_inplace "s/\"version\": \"$ESCAPED_CURRENT\"/\"version\": \"$NEW\"/" "$PKG_DIR/package.json"

# Update src/plugin.ts
sed_inplace "s/version: '$ESCAPED_CURRENT'/version: '$NEW'/" "$PKG_DIR/src/plugin.ts"

# Update readme.txt
sed_inplace "s/Stable tag: $ESCAPED_CURRENT/Stable tag: $NEW/" "$PKG_DIR/readme.txt"

# Verify all three files were updated
grep -q "\"version\": \"$NEW\"" "$PKG_DIR/package.json" \
  || { echo "Error: failed to update version in package.json" >&2; exit 1; }
grep -q "version: '$NEW'" "$PKG_DIR/src/plugin.ts" \
  || { echo "Error: failed to update version in src/plugin.ts" >&2; exit 1; }
grep -q "Stable tag: $NEW" "$PKG_DIR/readme.txt" \
  || { echo "Error: failed to update version in readme.txt" >&2; exit 1; }

echo "$NEW"
