#!/bin/bash
cd "L:/PROJECTS/arcana-site" || cd "/c/Projects/arcana-site" || cd "$HOME/Projects/arcana-site"

echo "=== Current directory ==="
pwd

echo "=== Git status ==="
git status --short

echo "=== Staging all changes ==="
git add -A

echo "=== Committing ==="
git commit -m "docs: comprehensive documentation overhaul

- Add 7 new standalone documentation pages: memory, themes, troubleshooting, proxy, cli, mcp, plugins
- Clean up index.html: replace orphaned inline CLI and Proxy API sections with summaries linking to standalone pages
- Update all sidebars with consistent navigation: Gateway, Cron, Skills, Memory, Themes, MCP & Tools, Plugins, Configuration, Proxy API, CLI Commands, Troubleshooting
- Update homepage stats bar to show 11 documentation pages
- Add .docs-cta-link CSS class for CTA buttons with hover/focus states
- Fix duplicate Proxy API link in themes.html sidebar
- Add CLI Reference link to all sidebar footers"

echo "=== Pushing to origin ==="
git push origin master

echo "=== Done ==="
git log --oneline -3
