import os
import glob

# The inline script to add before </head>
FOUC_SCRIPT = '''  <script>
  (function(){var t=localStorage.getItem('arcana-docs-theme');if(t==='light'){document.documentElement.classList.add('docs-light')}else if(!t&&window.matchMedia('(prefers-color-scheme:light)').matches){document.documentElement.classList.add('docs-light')}})();
  </script>
</head>'''

def add_fouc_script(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip if already has the FOUC script
    if 'arcana-docs-theme' in content and 'localStorage.getItem' in content:
        print(f'Skipped {os.path.basename(filepath)} (already has FOUC script)')
        return False
    
    # Find </head> and insert script before it
    if '</head>' in content:
        content = content.replace('</head>', FOUC_SCRIPT, 1)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {os.path.basename(filepath)}')
        return True
    else:
        print(f'Skipped {os.path.basename(filepath)} (no </head> found)')
        return False

# Process all docs HTML files
docs_dir = os.path.dirname(os.path.abspath(__file__))
html_files = glob.glob(os.path.join(docs_dir, '*.html'))
html_files.sort()

updated = 0
for filepath in html_files:
    if add_fouc_script(filepath):
        updated += 1

print(f'\nDone! Updated {updated} files.')
