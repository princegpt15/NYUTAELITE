import React, { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle2, Clock } from 'lucide-react';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    topic: 'Order Status & Tracking',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-[#FCFAF5] min-h-screen py-12 lg:py-20">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C6A15B]">
            CUSTOMER CARE
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#092218] mt-1 mb-2">
            Get in Touch with NYUTA ELITE
          </h1>
          <p className="text-xs sm:text-sm text-[#68756E]">
            Have a question about your makhana order, shipping, or feedback? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
          {/* LEFT: Contact Info */}
          <div className="lg:col-span-5 bg-[#123B2A] text-white p-8 rounded-2xl space-y-6 shadow-md border border-[#092218]">
            <div>
              <h3 className="font-serif text-2xl font-bold text-white mb-2">Customer Support</h3>
              <p className="text-xs text-[#D5DED6] leading-relaxed">
                Connect directly with our customer experience and pantry team.
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Operations &amp; Dispatch Hub</h4>
                  <p className="text-xs text-[#D5DED6] mt-0.5">
                    Mithila Region, Darbhanga, Bihar 846004, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Helpline</h4>
                  <p className="text-xs text-[#D5DED6] mt-0.5">+91 98765 43210 (Mon – Sat, 9 AM – 6 PM)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Email Support</h4>
                  <p className="text-xs text-[#D5DED6] mt-0.5">support@nyutaelite.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#C6A15B] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Response Time</h4>
                  <p className="text-xs text-[#D5DED6] mt-0.5">Within 24 hours on business days</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Inquiry Form */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-[#E8DECB] shadow-sm">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#123B2A] text-[#C6A15B] mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#092218]">Message Received!</h3>
                <p className="text-xs sm:text-sm text-[#68756E] max-w-sm mx-auto">
                  Thank you, {formData.name}. Our customer care team will get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-[#092218] mb-2">Send Us a Message</h3>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                    Your Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full min-h-11 px-3.5 rounded-lg border border-[#E8DECB] text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="you@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full min-h-11 px-3.5 rounded-lg border border-[#E8DECB] text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full min-h-11 px-3.5 rounded-lg border border-[#E8DECB] text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                    Topic
                  </label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full min-h-11 px-3.5 rounded-lg border border-[#E8DECB] text-xs text-[#1C1C1C] bg-white focus:outline-none focus:border-[#123B2A]"
                  >
                    <option value="Order Status & Tracking">Order Status &amp; Tracking</option>
                    <option value="Product Quality Question">Product Quality Question</option>
                    <option value="Return or Damage Claim">Return or Damage Claim</option>
                    <option value="General Feedback">General Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="How can we assist you with your makhana purchase?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DECB] text-xs text-[#1C1C1C] focus:outline-none focus:border-[#123B2A]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full min-h-12 rounded-lg bg-[#123B2A] hover:bg-[#092218] text-white text-xs font-extrabold uppercase tracking-widest transition-colors cursor-pointer shadow-md"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
