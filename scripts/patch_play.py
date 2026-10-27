with open('src/pages/Play.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace unused imports
old_imports = '''import lotusImage from '../assets/images/lotus-source.png';
import heroImage from '../assets/images/brand/makhana-hero.png';
import macroImage from '../assets/images/brand/makhana-macro.png';
import roastedMakhanaImage from '../assets/images/hero-makhana.png';'''

new_imports = '''// High-resolution contextual images from /images catalog'''

content = content.replace(old_imports, new_imports)

# Replace story images
content = content.replace("    image: macroImage,\n    headline: 'High plant protein", "    image: '/images/why-makhana/superfood-roasted-bowl.webp',\n    headline: 'High plant protein")
content = content.replace("    image: lotusImage,\n    headline: 'Hand-harvested by generational", "    image: '/images/process/01-harvest-pond.webp',\n    headline: 'Hand-harvested by generational")
content = content.replace("    image: roastedMakhanaImage,\n    headline: 'Popped with high heat", "    image: '/images/process/02-hand-sorting.webp',\n    headline: 'Popped with high heat")
content = content.replace("    image: heroImage,\n    headline: 'How we sort by diameter", "    image: '/images/quality/premium-jumbo-makhana.webp',\n    headline: 'How we sort by diameter")
content = content.replace("    image: macroImage,\n    headline: 'Transform plain makhana", "    image: '/images/bulk/wholesale-roasted-spiced.webp',\n    headline: 'Transform plain makhana")
content = content.replace("    image: lotusImage,\n    headline: 'Ditch ultra-processed chips", "    image: '/images/lifestyle/work-break-snack.webp',\n    headline: 'Ditch ultra-processed chips")

# Replace header decoration
old_dec = '''          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 hidden md:block">
            <img src={lotusImage} alt="" className="w-56 h-56 object-contain" />
          </div>'''
new_dec = '''          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-25 hidden md:block">
            <img src="/images/quality/premium-jumbo-makhana.webp" alt="Purity popped makhana" className="w-52 h-52 object-cover rounded-full border-2 border-[#C6A15B]/40" />
          </div>'''

content = content.replace(old_dec, new_dec)

with open('src/pages/Play.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("Play.tsx successfully patched with 6 dedicated visual stories!")
