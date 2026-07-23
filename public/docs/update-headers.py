import os
import glob

# Theme toggle button HTML to insert
TOGGLE_HTML = '''      <div class="docs-header-right">
        <button class="docs-theme-toggle" id="docs-theme-toggle" type="button" aria-label="Switch to dark mode">
          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>
        <div class="docs-header-links">'''

CLOSE_HEADER_RIGHT = '      </div>'

# Pattern to match: the opening <div class="docs-header-links"> line
# We need to replace it with the toggle + wrapped div
OLD_PATTERN_1 = '<div class="docs-header-links">'
NEW_PATTERN_1 = TOGGLE_HTML

# Also need to close the docs-header-right div before docs-header-inner's closing div
# Find: </div>\n    </div>\n  </header>
# The issue: after adding docs-header-right, we need to close it
# The header structure becomes:
#   <div class="docs-header-inner">
#     <a class="docs-brand">...
#     <div class="docs-search">...
#     <div class="docs-header-right">   <-- NEW
#       <button>...</button>
#       <div class="docs-header-links">...</div>
#     </div>                            <-- NEW CLOSING
#   </div>
#   </header>

# For minified files, the pattern is different
# Let's handle both formats

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip if already updated
    if 'docs-theme-toggle' in content:
        print(f'Skipped {os.path.basename(filepath)} (already updated)')
        return False
    
    # Replace the docs-header-links opening div
    if OLD_PATTERN_1 in content:
        content = content.replace(OLD_PATTERN_1, NEW_PATTERN_1, 1)
        
        # Now we need to close the docs-header-right div
        # For formatted files, the closing is:
        #       </div>
        #     </div>
        #   </header>
        # We need to find the closing of docs-header-links and add a closing div after it
        
        # Find the last </div> before </header> that closes docs-header-links
        # Actually, let's find the pattern where docs-header-inner closes
        # and insert a closing </div> before it
        
        # For formatted files:
        #       </div>  (closes docs-header-links)
        #     </div>    (closes docs-header-inner)
        #   </header>
        # We need:
        #       </div>  (closes docs-header-links)
        #     </div>    (closes docs-header-right)  <-- ADD THIS
        #     </div>    (closes docs-header-inner)
        #   </header>
        
        # For minified files:
        # </div></div></header>
        # We need:
        # </div></div></div></header>
        
        # Let's find the right pattern to insert the closing div
        # After docs-header-links closes, the next div closes docs-header-inner
        # We need to add our closing div between them
        
        if '\n      </div>\n    </div>\n  </header>' in content:
            # Formatted file
            content = content.replace(
                '\n      </div>\n    </div>\n  </header>',
                '\n      </div>\n      </div>\n    </div>\n  </header>',
                1
            )
        elif '</div></div></header>' in content:
            # Minified file - need to find the right spot
            # The pattern is: ...docs-header-links>...</div></div></header>
            # After replacement, docs-header-links is inside docs-header-right
            # So: ...docs-header-links>...</div></div></div></header>
            content = content.replace(
                '</div></div></header>',
                '</div></div></div></header>',
                1
            )
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {os.path.basename(filepath)}')
        return True
    else:
        print(f'Skipped {os.path.basename(filepath)} (pattern not found)')
        return False

# Process all docs HTML files
docs_dir = os.path.dirname(os.path.abspath(__file__))
html_files = glob.glob(os.path.join(docs_dir, '*.html'))

# Skip index.html since it's already updated
html_files = [f for f in html_files if os.path.basename(f) != 'index.html']
html_files.sort()

updated = 0
for filepath in html_files:
    if update_file(filepath):
        updated += 1

print(f'\nDone! Updated {updated} files.')
