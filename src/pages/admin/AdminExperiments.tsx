// src/pages/admin/AdminExperiments.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  BarChart2,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { growthApi } from '../../services/growth';

const PRIMARY_METRICS = [
  { key: 'purchase_conversion', label: 'Purchase Conversion (Captured Orders)' },
  { key: 'add_to_cart_conversion', label: 'Add to Cart Conversion' },
  { key: 'checkout_completion', label: 'Checkout Completion' },
  { key: 'wishlist_to_cart', label: 'Wishlist to Cart' },
  { key: 'campaign_click', label: 'Campaign Click' },
  { key: 'reorder_conversion', label: 'Reorder Conversion' },
];

export const AdminExperiments: React.FC = () => {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResults, setSelectedResults] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [primaryMetric, setPrimaryMetric] = useState('purchase_conversion');
  const [trafficPercentage, setTrafficPercentage] = useState(100);
  const [minSampleSize, setMinSampleSize] = useState(100);
  const [controlAlloc, setControlAlloc] = useState(50);
  const [variantAAlloc, setVariantAAlloc] = useState(50);
  const [variantAName, setVariantAName] = useState('Variant A');
  const [variantACtaText, setVariantACtaText] = useState('Order Handpicked Makhana');

  const loadExperiments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await growthApi.listExperiments();
      setExperiments(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load experiments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExperiments();
  }, [loadExperiments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await growthApi.createExperiment({
        key: key.trim().toLowerCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        primaryMetric,
        trafficPercentage: Number(trafficPercentage),
        minSampleSize: Number(minSampleSize),
        variants: [
          {
            key: 'control',
            name: 'Control',
            allocationPercentage: Number(controlAlloc),
            isControl: true,
            config: { ctaText: 'Shop Now' },
          },
          {
            key: 'variant_a',
            name: variantAName.trim() || 'Variant A',
            allocationPercentage: Number(variantAAlloc),
            isControl: false,
            config: { ctaText: variantACtaText },
          },
        ],
      });
      setShowCreateModal(false);
      setKey('');
      setName('');
      setDescription('');
      await loadExperiments();
    } catch (err: any) {
      setError(err?.message || 'Failed to create experiment');
    }
  };

  const handleTransition = async (
    id: string,
    status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  ) => {
    try {
      setError(null);
      await growthApi.transitionExperimentStatus(id, status);
      await loadExperiments();
      if (selectedResults?.experiment?.id === id) {
        const updatedRes = await growthApi.getExperimentResults(id);
        setSelectedResults(updatedRes);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update experiment status');
    }
  };

  const handleViewResults = async (id: string) => {
    try {
      setError(null);
      const res = await growthApi.getExperimentResults(id);
      setSelectedResults(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load experiment results');
    }
  };

  return (
    <div className="space-y-6 text-stone-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#092218] p-6 rounded-2xl border border-[#123B2A]">
        <div>
          <div className="flex items-center gap-2 text-[#C6A15B] text-xs font-extrabold uppercase tracking-widest">
            <FlaskConical className="w-4 h-4" />
            <span>PHASE 19 • CONTROLLED A/B EXPERIMENTATION</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mt-1">
            Experiments & Variant Evaluation
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Deterministic SHA-256 subject assignment, strict non-financial guardrails, and minimum-sample statistical protection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadExperiments()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#123B2A] text-[#C6A15B] text-xs font-bold uppercase tracking-wider border border-[#C6A15B]/30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C6A15B] text-[#061912] text-xs font-extrabold uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>New Experiment</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Experiments List */}
      <div className="bg-[#092218] p-6 rounded-2xl border border-[#123B2A] space-y-4">
        <h2 className="text-base font-bold text-white">Configured Experiments</h2>
        {loading ? (
          <div className="py-8 text-center text-stone-400 text-xs">Loading experiments...</div>
        ) : experiments.length === 0 ? (
          <div className="py-8 text-center text-stone-400 text-xs">
            No experiments created yet. Click &ldquo;New Experiment&rdquo; to configure a controlled A/B test.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#123B2A] text-stone-400 uppercase">
                  <th className="py-2.5 pr-4">Experiment</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Primary Metric</th>
                  <th className="py-2.5 px-3">Allocation</th>
                  <th className="py-2.5 px-3">Assigned Users</th>
                  <th className="py-2.5 px-3">Sample Status</th>
                  <th className="py-2.5 pl-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#123B2A]/60">
                {experiments.map((exp) => (
                  <tr key={exp.id}>
                    <td className="py-3 pr-4">
                      <div className="font-bold text-white">{exp.name}</div>
                      <div className="text-[11px] text-stone-400 font-mono">{exp.key}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          exp.status === 'RUNNING'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : exp.status === 'COMPLETED'
                            ? 'bg-blue-950 text-blue-300 border border-blue-700'
                            : 'bg-stone-800 text-stone-300'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-300">{exp.primaryMetric}</td>
                    <td className="py-3 px-3">
                      {(exp.variants || [])
                        .map((v: any) => `${v.key}:${v.allocationPercentage}%`)
                        .join(' / ')}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {exp._count?.assignments ?? 0} (min {exp.minSampleSize}/var)
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          exp.sampleStatus === 'SUFFICIENT_SAMPLE'
                            ? 'bg-emerald-950/60 text-emerald-300'
                            : 'bg-amber-950/60 text-amber-300'
                        }`}
                      >
                        {exp.sampleStatus === 'SUFFICIENT_SAMPLE'
                          ? 'SUFFICIENT SAMPLE'
                          : 'INSUFFICIENT SAMPLE'}
                      </span>
                    </td>
                    <td className="py-3 pl-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleViewResults(exp.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#123B2A] text-[#C6A15B] font-bold hover:bg-[#194d38] flex items-center gap-1"
                        >
                          <BarChart2 className="w-3 h-3" />
                          <span>Results</span>
                        </button>
                        {(exp.status === 'DRAFT' || exp.status === 'PAUSED') && (
                          <button
                            type="button"
                            onClick={() => void handleTransition(exp.id, 'RUNNING')}
                            title="Start Experiment"
                            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {exp.status === 'RUNNING' && (
                          <button
                            type="button"
                            onClick={() => void handleTransition(exp.id, 'PAUSED')}
                            title="Pause Experiment"
                            className="p-1.5 rounded-lg bg-amber-950 text-amber-300 hover:bg-amber-900"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(exp.status === 'RUNNING' || exp.status === 'PAUSED') && (
                          <button
                            type="button"
                            onClick={() => void handleTransition(exp.id, 'COMPLETED')}
                            title="Complete Experiment"
                            className="p-1.5 rounded-lg bg-blue-950 text-blue-300 hover:bg-blue-900"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {exp.status !== 'COMPLETED' && exp.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => void handleTransition(exp.id, 'CANCELLED')}
                            title="Cancel Experiment"
                            className="p-1.5 rounded-lg bg-red-950 text-red-300 hover:bg-red-900"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Experiment Results Panel (Step 33) */}
      {selectedResults && (
        <div className="bg-[#092218] p-6 rounded-2xl border border-[#C6A15B]/40 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C6A15B]">
                EXPERIMENT EVALUATION REPORT
              </span>
              <h3 className="text-lg font-bold text-white">
                {selectedResults.experiment.name} ({selectedResults.experiment.key})
              </h3>
              <p className="text-xs text-stone-400">
                Status: {selectedResults.experiment.status} • Duration:{' '}
                {selectedResults.experiment.durationDays} days • Primary Metric:{' '}
                {selectedResults.experiment.primaryMetric}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedResults(null)}
              className="text-xs text-stone-400 hover:text-white"
            >
              Close Report
            </button>
          </div>

          <div
            className={`p-4 rounded-xl border text-xs ${
              selectedResults.sampleStatus === 'INSUFFICIENT_SAMPLE'
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
            }`}
          >
            <div className="font-bold uppercase tracking-wider">
              Sample Status: {selectedResults.sampleStatus.replace('_', ' ')}
            </div>
            <div className="mt-1">{selectedResults.statisticalConclusion}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(selectedResults.variants || []).map((v: any) => (
              <div
                key={v.variantId}
                className="p-4 rounded-xl bg-[#061912] border border-[#123B2A] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">
                    {v.name} ({v.key})
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#123B2A] text-[#C6A15B] font-bold">
                    {v.allocationPercentage}% Traffic
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 text-stone-300">
                  <div>
                    Users: <strong className="text-white">{v.assignedUsers}</strong>
                  </div>
                  <div>
                    Conversions: <strong className="text-emerald-400">{v.conversions}</strong>
                  </div>
                  <div>
                    Rate: <strong className="text-[#C6A15B]">{v.conversionRatePercent}%</strong>
                  </div>
                  <div>
                    Revenue: <strong className="text-white">₹{v.revenue}</strong>
                  </div>
                </div>
                {!v.isControl && (
                  <div className="pt-2 border-t border-[#123B2A] text-stone-400">
                    Difference:{' '}
                    <strong className="text-white">
                      {v.absoluteDiffPercentagePoints >= 0 ? '+' : ''}
                      {v.absoluteDiffPercentagePoints} percentage points
                    </strong>{' '}
                    • {v.comparisonSummary}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Experiment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#092218] border border-[#123B2A] rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Create Controlled A/B Experiment</h3>
            <p className="text-xs text-stone-400">
              Experiments may customize non-financial UI/CTA properties. Pricing, discounts, stock, and Razorpay authority are strictly locked.
            </p>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 mb-1">Experiment Key (slug)</label>
                <input
                  type="text"
                  required
                  placeholder="hero_cta_copy_v1"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#061912] border border-[#123B2A] text-white"
                />
              </div>
              <div>
                <label className="block text-stone-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="Hero CTA Button Copy Test"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#061912] border border-[#123B2A] text-white"
                />
              </div>
              <div>
                <label className="block text-stone-300 mb-1">Primary Metric</label>
                <select
                  value={primaryMetric}
                  onChange={(e) => setPrimaryMetric(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#061912] border border-[#123B2A] text-white"
                >
                  {PRIMARY_METRICS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 mb-1">Traffic Allocation (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={trafficPercentage}
                    onChange={(e) => setTrafficPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#061912] border border-[#123B2A] text-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 mb-1">Min Sample / Variant</label>
                  <input
                    type="number"
                    min={10}
                    max={100000}
                    value={minSampleSize}
                    onChange={(e) => setMinSampleSize(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#061912] border border-[#123B2A] text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#123B2A]">
                <div>
                  <label className="block text-stone-300 mb-1">Control Split (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={controlAlloc}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setControlAlloc(val);
                      setVariantAAlloc(100 - val);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-[#061912] border border-[#123B2A] text-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 mb-1">Variant A Split (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={variantAAlloc}
                    onChange={(e) => setVariantAAlloc(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-[#061912] border border-[#123B2A] text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 mb-1">Variant A Name</label>
                  <input
                    type="text"
                    value={variantAName}
                    onChange={(e) => setVariantAName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#061912] border border-[#123B2A] text-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 mb-1">Variant A CTA Text</label>
                  <input
                    type="text"
                    value={variantACtaText}
                    onChange={(e) => setVariantACtaText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#061912] border border-[#123B2A] text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#C6A15B] text-[#061912] font-extrabold"
                >
                  Create Draft Experiment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExperiments;
