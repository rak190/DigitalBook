import re

with open('public/css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Update colors
css = css.replace('--primary: #0284c7;', '--primary: #002147;')
css = css.replace('--primary-hover: #0369a1;', '--primary-hover: #003066;')
css = css.replace('--primary-light: #e0f2fe;', '--primary-light: #e6eff7;')
css = css.replace('--primary-dark: #075985;', '--primary-dark: #00122a;')
css = css.replace('--accent: #f59e0b;', '--accent: #327f7f;')
css = css.replace('--bg-main: #f1f5f9;', '--bg-main: #f5f7fa;')
css = css.replace('--bg-surface: #f8fafc;', '--bg-surface: #ffffff;')

# Add responsive padding, font weight
css = css.replace('font-weight: 500;', 'font-weight: 400;')
css = css.replace('font-weight: 700;', 'font-weight: 600;')

# Replace header styles
css = re.sub(r'\.app-header \{.*?\}', '.app-header {\n  height: var(--header-height);\n  background: #002147;\n  border-bottom: 1px solid var(--border-color);\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0 16px;\n  z-index: 50;\n  box-shadow: var(--shadow-sm);\n  color: white;\n}', css, flags=re.DOTALL)
css = css.replace('color: var(--primary);', 'color: var(--accent);')
css = css.replace('background: #0284c7;', 'background: #327f7f;')

# Card styles for exercises
exercise_css = """
.exercise-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-md);
}

.exercise-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 12px;
  border-bottom: 2px solid var(--accent);
  padding-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.exercise-blank-input {
  position: absolute;
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-bottom: 2px solid var(--accent);
  border-radius: 0;
  color: var(--primary);
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  padding: 2px 4px;
  outline: none;
  box-shadow: none;
  transition: all 0.2s ease;
  user-select: text;
}
.exercise-blank-input:focus {
  background: #ffffff;
  border-bottom: 2px solid var(--primary);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transform: scale(1.02);
  z-index: 25;
}
"""

css = re.sub(r'\.exercise-card \{.*?\}', '', css, flags=re.DOTALL)
css = re.sub(r'\.exercise-title \{.*?\}', '', css, flags=re.DOTALL)
css = re.sub(r'\.exercise-blank-input \{.*?\}', '', css, flags=re.DOTALL)
css += "\n" + exercise_css

# responsive grid
responsive_css = """
@media (max-width: 1024px) {
  .sidebar-panel { width: 300px; }
}
@media (max-width: 768px) {
  .app-header { flex-wrap: wrap; height: auto; padding: 10px; }
  .sidebar-panel { width: 100%; }
}
@media (max-width: 424px) {
  .app-toolbar { flex-wrap: wrap; height: auto; }
}
"""
css += "\n" + responsive_css

with open('public/css/style.css', 'w', encoding='utf-8') as f:
    f.write(css)

with open('public/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Make buttons icon-only
replacements = [
    ('💻 Class Mode', '💻'),
    ('👁️ Hide Answers', '👁️'),
    ('🔲 Focus', '🔲'),
    ('🎧 Player', '🎧'),
    ('📑 Contents', '📑'),
    ('🗂 Pages', '🗂'),
    ('✍️ Exercises', '✍️'),
    ('🔤 Vocabulary', '🔤'),
    ('🎧 Audio', '🎧'),
    ('📝 Notes', '📝'),
    ('✋ Read / Pan', '✋'),
    ('✏️ Pen', '✏️'),
    ('🖍 Highlight', '🖍'),
    ('🧹 Eraser', '🧹'),
    ('💬 Type Answer', '💬'),
    ('📌 Sticky Note', '📌'),
    ('➕ Add Blank', '➕')
]

for old, new in replacements:
    html = html.replace(old, new)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Refactored css and html")
