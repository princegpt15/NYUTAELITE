with open('src/pages/Categories.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Top Banner
old_banner = '''        <div className="bg-[#123B2A] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl border border-[#C6A15B]/30">'''
new_banner = '''        <div className="bg-[#123B2A] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl border border-[#C6A15B]/30">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "url('/images/quality/premium-jumbo-makhana.webp')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />'''
if old_banner in content:
    content = content.replace(old_banner, new_banner, 1)
    print("Banner replaced")

# 2. Update Card 1 (Premium)
old_c1 = '''              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                    selectedQuality === 'Premium'
                      ? 'bg-[#C6A15B] text-[#092218]'
                      : 'bg-[#123B2A] text-white'
                  }`}
                >
                  TOP TIER
                </span>
                <span className="text-xs font-bold opacity-80">3 Pouch Sizes</span>
              </div>
              <h2 className="font-serif text-2xl font-bold">Premium Jumbo Makhana</h2>'''

new_c1 = '''              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                        selectedQuality === 'Premium'
                          ? 'bg-[#C6A15B] text-[#092218]'
                          : 'bg-[#123B2A] text-white'
                      }`}
                    >
                      TOP TIER
                    </span>
                    <span className="text-xs font-bold opacity-80">3 Pouch Sizes</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold">Premium Jumbo Makhana</h2>
                </div>

                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#FAF7EF] p-1.5 border border-[#E8DECB]/60 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                  <img
                    src="/images/products/premium-makhana-250g.png"
                    alt="NYUTA ELITE Premium Makhana pouch packaging"
                    className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
                    width={96}
                    height={96}
                  />
                </div>
              </div>'''
if old_c1 in content:
    content = content.replace(old_c1, new_c1, 1)
    print("Card 1 replaced")

# 3. Update Card 2 (Normal)
old_c2 = '''              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                    selectedQuality === 'Normal'
                      ? 'bg-[#C6A15B] text-[#092218]'
                      : 'bg-[#E8DECB] text-[#123B2A]'
                  }`}
                >
                  DAILY PANTRY
                </span>
                <span className="text-xs font-bold opacity-80">3 Pouch Sizes</span>
              </div>
              <h2 className="font-serif text-2xl font-bold">Normal Everyday Makhana</h2>'''

new_c2 = '''              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                        selectedQuality === 'Normal'
                          ? 'bg-[#C6A15B] text-[#092218]'
                          : 'bg-[#E8DECB] text-[#123B2A]'
                      }`}
                    >
                      DAILY PANTRY
                    </span>
                    <span className="text-xs font-bold opacity-80">3 Pouch Sizes</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold">Normal Everyday Makhana</h2>
                </div>

                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#FAF7EF] p-1.5 border border-[#E8DECB]/60 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                  <img
                    src="/images/products/normal-makhana-250g.png"
                    alt="Regular Makhana silver pouch packaging"
                    className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
                    width={96}
                    height={96}
                  />
                </div>
              </div>'''
if old_c2 in content:
    content = content.replace(old_c2, new_c2, 1)
    print("Card 2 replaced")

with open('src/pages/Categories.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("Saved Categories.tsx successfully!")
