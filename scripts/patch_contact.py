with open('src/pages/Contact.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace helpline
text = text.replace('+91 98765 43210 (Mon – Sat, 9 AM – 6 PM)', '+91 62014 26357 (Mon – Sat, 9 AM – 7 PM IST)')

target = '''              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Response Time</h4>
                  <p className="text-xs text-[#D5DED6] mt-0.5">Within 24 hours on business days</p>
                </div>
              </div>
            </div>
          </div>'''

replacement = '''              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Response Time</h4>
                  <p className="text-xs text-[#D5DED6] mt-0.5">Within 24 hours on business days</p>
                </div>
              </div>
            </div>

            <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-[#C6A15B]/30 bg-[#092218] mt-4 shadow-sm">
              <img
                src="/images/process/04-express-delivery.webp"
                alt="NYUTA ELITE door-step parcel dispatch"
                className="w-full h-full object-cover"
                loading="lazy"
                width={400}
                height={250}
              />
              <div className="absolute bottom-2 left-2 right-2 bg-[#092218]/85 backdrop-blur-xs px-2.5 py-1 rounded-lg text-white text-[10px] font-semibold text-center">
                Express Pan-India Logistics &amp; Customer Support
              </div>
            </div>
          </div>'''

if target in text:
    text = text.replace(target, replacement, 1)
    print("Contact image and helpline updated")
else:
    print("Target not found in Contact.tsx")

with open('src/pages/Contact.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)
