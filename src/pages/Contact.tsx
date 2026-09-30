import React, { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { FormInput } from '../components/FormInput';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    business: '',
    email: '',
    phone: '',
    volume: '50-100 KG',
    city: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-12 lg:py-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold tracking-widest text-[#C89B3C] uppercase">
            COMMERCIAL INQUIRIES
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1C2520] tracking-tight mt-1 mb-2">
            Contact Our Wholesale Team
          </h1>
          <p className="text-sm text-[#5E6C65]">
            Looking for multi-ton contracts, export containers, or custom vacuum packaging? Get in touch with our sales specialists.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
          {/* LEFT: Contact Information */}
          <div className="lg:col-span-5 bg-[#173F35] text-white p-8 rounded-3xl space-y-6 shadow-md">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Wholesale Head Office</h3>
              <p className="text-xs text-[#A5BDB5] leading-relaxed">
                Connect directly with our procurement and commercial supply operations team.
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#00C950] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">Processing & Dispatch Hub</h4>
                  <p className="text-xs text-[#A5BDB5] mt-0.5">
                    Industrial Growth Centre, Darbhanga Road, Mithila Region, Bihar 846004, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#00C950] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">Commercial Sales Hotline</h4>
                  <p className="text-xs text-[#A5BDB5] mt-0.5">+91 98765 43210 / +91 98765 43211</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#00C950] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">Wholesale Email</h4>
                  <p className="text-xs text-[#A5BDB5] mt-0.5">wholesale@nyutaelitefoods.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#00C950] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">Operations Hours</h4>
                  <p className="text-xs text-[#A5BDB5] mt-0.5">Mon – Sat: 9:00 AM – 7:00 PM IST</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#235044] text-xs text-[#8BA49C]">
              Quick turnaround: Wholesale quote sent within 2 business hours.
            </div>
          </div>

          {/* RIGHT: Inquiries Form */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-[#E6DFD3] shadow-md">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#00C950]/15 text-[#00C950] mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-[#1C2520]">Inquiry Submitted!</h3>
                <p className="text-sm text-[#5E6C65] max-w-sm mx-auto">
                  Thank you, {formData.name}. Our commercial sales manager will review your requirement and reach out with bulk pricing details shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-[#1C2520] mb-2">Request a Custom Bulk Quote</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Full Name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <FormInput
                    label="Business Name"
                    placeholder="Company / Brand"
                    value={formData.business}
                    onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Email Address"
                    type="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  <FormInput
                    label="Phone Number"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#1C2520] mb-1.5">
                      Estimated Volume
                    </label>
                    <select
                      value={formData.volume}
                      onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E6DFD3] text-sm text-[#1C2520] bg-white focus:outline-none focus:border-[#00C950]"
                    >
                      <option value="10-25 KG">10 – 25 KG (Trial Batch)</option>
                      <option value="25-50 KG">25 – 50 KG (Store Supply)</option>
                      <option value="50-100 KG">50 – 100 KG (Wholesale)</option>
                      <option value="100-500 KG">100 – 500 KG (Distributor)</option>
                      <option value="1-5 Tons">1 – 5 Tons (Industrial)</option>
                      <option value="Container Export">Full Container (Export)</option>
                    </select>
                  </div>

                  <FormInput
                    label="Delivery City / State"
                    placeholder="e.g. Mumbai, Maharashtra"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#1C2520] mb-1.5">
                    Requirement Notes / Custom Specs
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Specify sizing, packaging preference, or recurring delivery requirements..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E6DFD3] text-sm text-[#1C2520] bg-white focus:outline-none focus:border-[#00C950]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#00C950] hover:bg-[#00b347] text-white font-bold text-sm sm:text-base shadow-sm transition-all cursor-pointer"
                >
                  Submit Quote Request
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
