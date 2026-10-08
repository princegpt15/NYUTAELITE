// src/pages/admin/AdminReviews.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  Star,
  Check,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { retentionService, type ReviewItem } from '../../services/retention';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Summary counts
  const [summaryCounts, setSummaryCounts] = useState<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }>({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // Delete modal state
  const [reviewToDelete, setReviewToDelete] = useState<ReviewItem | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const filterParam = statusFilter === 'ALL' ? undefined : statusFilter;
      const [res, summary] = await Promise.all([
        retentionService.adminGetReviews({ status: filterParam, page, limit: 15 }),
        retentionService.adminGetRetentionSummary(),
      ]);

      setReviews(res.reviews);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
      if (summary?.reviews) {
        setSummaryCounts(summary.reviews);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to load reviews' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleModerate = async (review: ReviewItem, newStatus: 'APPROVED' | 'REJECTED') => {
    setActionInProgressId(review.id);
    try {
      await retentionService.adminModerateReview(review.id, newStatus);
      setFeedback({
        type: 'success',
        text: `Review from ${review.user?.name || 'Customer'} marked as ${newStatus}.`,
      });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to update review status' });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;
    setActionInProgressId(reviewToDelete.id);
    try {
      await retentionService.adminDeleteReview(reviewToDelete.id);
      setFeedback({ type: 'success', text: 'Review deleted successfully.' });
      setReviewToDelete(null);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to delete review' });
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C6A15B] block">
            CUSTOMER TRUST &amp; RATING INTEGRITY
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218]">
            Product Reviews &amp; Moderation
          </h1>
          <p className="text-xs text-[#68756E] mt-0.5">
            Audit and moderate verified purchaser reviews before storefront publication. Zero fabricated ratings.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E8DECB] bg-white hover:bg-[#FCFAF5] text-xs font-bold text-[#1C1C1C] transition-colors self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Retention Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8DECB] shadow-xs">
          <span className="text-[10px] font-bold uppercase text-[#68756E] block">Total Reviews</span>
          <span className="text-2xl font-bold text-[#123B2A] font-serif">{summaryCounts.total}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-800 block">Pending Moderation</span>
          <span className="text-2xl font-bold text-amber-900 font-serif">{summaryCounts.pending}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-800 block">Approved</span>
          <span className="text-2xl font-bold text-emerald-900 font-serif">{summaryCounts.approved}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-800 block">Rejected</span>
          <span className="text-2xl font-bold text-rose-900 font-serif">{summaryCounts.rejected}</span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8DECB] pb-2 overflow-x-auto">
        <Filter className="w-4 h-4 text-[#68756E] mr-1 shrink-0" />
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
              statusFilter === status
                ? 'bg-[#123B2A] text-white shadow-2xs'
                : 'text-[#68756E] hover:text-[#123B2A] hover:bg-white'
            }`}
          >
            {status === 'ALL'
              ? 'All Reviews'
              : `${status.charAt(0) + status.slice(1).toLowerCase()} (${
                  status === 'PENDING'
                    ? summaryCounts.pending
                    : status === 'APPROVED'
                    ? summaryCounts.approved
                    : summaryCounts.rejected
                })`}
          </button>
        ))}
      </div>

      {/* Review Cards List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-xs text-[#68756E] border border-[#E8DECB] space-y-2">
          <RefreshCw className="w-6 h-6 text-[#C6A15B] animate-spin mx-auto" />
          <p>Loading customer reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E8DECB] space-y-2">
          <MessageSquare className="w-8 h-8 text-[#68756E]/40 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[#1C1C1C]">No Reviews Found</h3>
          <p className="text-xs text-[#68756E]">
            {statusFilter === 'PENDING'
              ? 'Great news! All verified customer reviews have been reviewed.'
              : `No reviews currently found in ${statusFilter.toLowerCase()} status.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl p-5 border border-[#E8DECB] shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8DECB] gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F7F1E5] text-[#123B2A] flex items-center justify-center font-bold text-xs border border-[#E8DECB]">
                    {rev.rating}★
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1C1C1C]">
                        {rev.product?.name || 'Makhana Pack'}
                      </span>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#68756E]">
                      Customer: {rev.user?.name || 'Anonymous'} • Submitted on{' '}
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      rev.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : rev.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-1">
                <div className="flex items-center text-[#C6A15B]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= rev.rating ? 'fill-[#C6A15B] text-[#C6A15B]' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                {rev.title && (
                  <h4 className="font-serif font-bold text-sm text-[#1C1C1C]">{rev.title}</h4>
                )}
                <p className="text-xs text-[#68756E] leading-relaxed">
                  {rev.comment || '(No additional text provided)'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E8DECB]/60 flex items-center justify-end gap-2">
                {rev.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleModerate(rev, 'APPROVED')}
                    disabled={actionInProgressId === rev.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                )}

                {rev.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleModerate(rev, 'REJECTED')}
                    disabled={actionInProgressId === rev.id}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1 shadow-2xs"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}

                <button
                  onClick={() => setReviewToDelete(rev)}
                  disabled={actionInProgressId === rev.id}
                  className="p-1.5 rounded-lg border border-[#E8DECB] hover:bg-rose-50 hover:border-rose-300 text-[#68756E] hover:text-rose-600 transition-colors ml-2"
                  title="Permanently delete review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs text-[#68756E]">
            Page {page} of {totalPages} ({totalCount} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-[#E8DECB] rounded-lg text-xs font-bold text-[#1C1C1C] hover:bg-white disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-[#E8DECB] rounded-lg text-xs font-bold text-[#1C1C1C] hover:bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {reviewToDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Customer Review"
          message={`Are you sure you want to permanently delete the review from "${
            reviewToDelete.user?.name || 'Customer'
          }" for "${reviewToDelete.product?.name || 'Product'}"? This action cannot be undone.`}
          confirmLabel="Delete Review"
          isDestructive={true}
          onConfirm={handleDelete}
          onCancel={() => setReviewToDelete(null)}
        />
      )}
    </div>
  );
};
