// src/pages/Product.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RefreshCw,
  Heart,
  Star,
  Bell,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { type PantryProduct } from '../types';
import { fetchProducts } from '../services/products';
import { cartService } from '../services/cart';
import {
  retentionService,
  type RatingSummary,
  type ReviewItem,
  type RecommendedProduct,
} from '../services/retention';
import {
  trackViewItem,
  trackAddToWishlist,
  trackSubmitReview,
  trackBackInStockSignup,
} from '../services/analytics';
import { resolveRouteSeo, applySeoToDocument } from '../utils/seo';
import { Toast } from '../components/Toast';
import { authService } from '../services/auth';

export const Product: React.FC = () => {
  const [searchParams] = useSearchParams();
  const routeParams = useParams<{ sku?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const sku = searchParams.get('sku') ?? routeParams.sku ?? 'premium-100g';
  const [product, setProduct] = useState<PantryProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Retention States
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  // Back In Stock
  const [isSubscribedBackInStock, setIsSubscribedBackInStock] = useState(false);
  const [subscribingBackInStock, setSubscribingBackInStock] = useState(false);

  // Reviews & Rating Summary
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Write Review Form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFormMessage, setReviewFormMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Recommendations
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts();
      const found = data.find(
        (p) =>
          p.sku === sku ||
          p.slug === sku ||
          p.id === sku ||
          `${p.quality.toLowerCase()}-${p.weightGrams}g` === sku.toLowerCase()
      );
      setProduct(found ?? null);
    } catch (_e) {
      setError('Unable to load product details. Please check your connection.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [sku]);

  useEffect(() => {
    if (product) {
      const seo = resolveRouteSeo({
        pathname: location.pathname,
        search: location.search,
        product,
      });
      applySeoToDocument(seo);
      trackViewItem(product, 1);

      // Load Retention Data for this product
      loadRetentionData(product.id);
    }
  }, [product, location.pathname, location.search]);

  const loadRetentionData = async (productId: string) => {
    // 1. Rating Summary
    retentionService
      .getProductRatingSummary(productId)
      .then((data) => setRatingSummary(data))
      .catch((err) => console.error('Rating summary error:', err));

    // 2. Reviews
    setLoadingReviews(true);
    retentionService
      .getProductReviews(productId, 1, 10)
      .then((res) => setReviews(res.reviews))
      .catch((err) => console.error('Reviews load error:', err))
      .finally(() => setLoadingReviews(false));

    // 3. Recommendations
    retentionService
      .getRecommendations({ productId, limit: 4 })
      .then((data) => setRecommendations(data))
      .catch((err) => console.error('Recommendations error:', err));

    // 4. Back in stock status if user logged in
    if (currentUser) {
      retentionService
        .getBackInStockStatus(productId)
        .then((res) => setIsSubscribedBackInStock(res.subscribed))
        .catch(() => {});
    }
  };

  // Compute discount safely
  const discountPercentage =
    product && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const isOutOfStock = product ? product.stock <= 0 : false;
  const isLowStock = product ? product.stock > 0 && product.stock <= 20 : false;

  // Variant selector
  const handleSelectVariant = (quality: string, weight: number) => {
    const targetSku = `${quality.toLowerCase()}-${weight}g`;
    navigate(`/products/makhana?sku=${targetSku}`);
  };

  // Add to cart
  const handleAddToCart = (goToCart = false) => {
    if (!product || isOutOfStock) return;
    setIsAdding(true);
    cartService.addItem({
      productId: product.id,
      productName: product.name,
      quality: product.quality,
      weightGrams: product.weightGrams,
      price: product.price,
      mrp: product.mrp,
      quantity,
      image: product.image,
    });
    setToastMessage(`Added ${quantity} × ${product.name} to cart!`);
    setIsAdding(false);
    if (goToCart) {
      navigate('/cart');
    }
  };

  // Wishlist Toggle
  const handleToggleWishlist = async () => {
    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    if (!product) return;

    setTogglingWishlist(true);
    try {
      if (isWishlisted) {
        await retentionService.removeFromWishlist(product.id);
        setIsWishlisted(false);
        setToastMessage(`Removed ${product.name} from wishlist.`);
      } else {
        await retentionService.addToWishlist(product.id);
        setIsWishlisted(true);
        trackAddToWishlist(product, quantity);
        setToastMessage(`Saved ${product.name} to your wishlist!`);
      }
    } catch (err: any) {
      setToastMessage(err?.message || 'Could not update wishlist');
    } finally {
      setTogglingWishlist(false);
    }
  };

  // Back In Stock Toggle
  const handleToggleBackInStock = async () => {
    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    if (!product) return;

    setSubscribingBackInStock(true);
    try {
      if (isSubscribedBackInStock) {
        const res = await retentionService.unsubscribeBackInStock(product.id);
        setIsSubscribedBackInStock(false);
        setToastMessage(res.message);
      } else {
        const res = await retentionService.subscribeBackInStock(product.id);
        setIsSubscribedBackInStock(true);
        trackBackInStockSignup(product.id, product.name);
        setToastMessage(res.message);
      }
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to update back-in-stock notification');
    } finally {
      setSubscribingBackInStock(false);
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    if (!product) return;

    setSubmittingReview(true);
    setReviewFormMessage(null);
    try {
      await retentionService.createReview({
        productId: product.id,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim() || undefined,
      });

      trackSubmitReview(product.id, reviewRating, Boolean(reviewComment.trim()));
      setReviewFormMessage({
        type: 'success',
        text: 'Thank you! Your verified review has been submitted for moderation and will appear once approved.',
      });
      setReviewTitle('');
      setReviewComment('');
      setShowReviewForm(false);
    } catch (err: any) {
      setReviewFormMessage({
        type: 'error',
        text: err?.message || 'Failed to submit review. Only verified purchasers can review this item.',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FCFAF5] min-h-screen py-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#C6A15B] animate-spin mx-auto" />
          <p className="text-sm text-[#68756E] font-medium">Loading Makhana Details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-[#FCFAF5] min-h-screen py-16">
        <div className="max-w-[700px] mx-auto px-5 text-center space-y-4">
          <div className="bg-amber-50 text-amber-900 p-6 rounded-2xl border border-amber-200 space-y-2">
            <h2 className="font-serif text-xl font-bold">Pack Not Found</h2>
            <p className="text-xs text-[#68756E]">
              {error ?? "We couldn't locate this specific makhana variant in our pantry."}
            </p>
          </div>
          <Link
            to="/#pantry"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#123B2A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#092218]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Pantry</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FCFAF5] min-h-screen py-10 lg:py-16">
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 space-y-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/#pantry"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#68756E] hover:text-[#123B2A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Makhana Pantry</span>
          </Link>

          <button
            onClick={handleToggleWishlist}
            disabled={togglingWishlist}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors ${
              isWishlisted
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-white border-[#E8DECB] text-[#123B2A] hover:bg-[#F7F1E5]'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                isWishlisted ? 'text-rose-600 fill-rose-600' : 'text-[#68756E]'
              }`}
            />
            <span>{isWishlisted ? 'Saved' : 'Save to Wishlist'}</span>
          </button>
        </div>

        {/* Product Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8DECB] shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Image Container */}
            <div className="relative aspect-square w-full rounded-2xl bg-[#FCFAF5] overflow-hidden border border-[#E8DECB]/80 flex items-center justify-center p-6">
              <img
                src={product.image || '/assets/product-main.png'}
                alt={product.name}
                className="w-full h-full object-contain max-h-[420px] transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/product-main.png';
                }}
              />

              {/* Status Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="bg-[#123B2A] text-[#C6A15B] text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-xs">
                  {product.quality} Grade
                </span>
                {discountPercentage > 0 && (
                  <span className="bg-emerald-700 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-xs">
                    {discountPercentage}% OFF
                  </span>
                )}
                {isLowStock && !isOutOfStock && (
                  <span className="bg-amber-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-xs">
                    Only {product.stock} left in stock
                  </span>
                )}
              </div>

              {isOutOfStock && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center">
                  <div className="bg-rose-600 text-white text-xs font-extrabold px-4 py-2 rounded-xl uppercase tracking-wider shadow-md">
                    Out of Stock
                  </div>
                </div>
              )}
            </div>

            {/* Product Meta */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-[0.2em] text-[#C6A15B] uppercase block mb-1">
                  AUTHENTIC BIHAR HARVEST • GI-TAGGED
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#092218]">
                  {product.name}
                </h1>

                {/* Rating Stars Summary */}
                {ratingSummary && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center text-[#C6A15B]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(ratingSummary.averageRating)
                              ? 'fill-[#C6A15B] text-[#C6A15B]'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#123B2A]">
                      {ratingSummary.averageRating > 0
                        ? `${ratingSummary.averageRating.toFixed(1)} / 5.0`
                        : 'No ratings yet'}
                    </span>
                    <a
                      href="#reviews-section"
                      className="text-xs text-[#68756E] underline hover:text-[#123B2A]"
                    >
                      ({ratingSummary.totalReviews} verified {ratingSummary.totalReviews === 1 ? 'review' : 'reviews'})
                    </a>
                  </div>
                )}

                {/* Price Display */}
                <div className="flex items-baseline gap-3 mt-4">
                  <span className="text-3xl font-extrabold text-[#123B2A] font-serif">
                    ₹{product.price}
                  </span>
                  {product.mrp > product.price && (
                    <span className="text-base text-[#68756E] line-through">
                      ₹{product.mrp}
                    </span>
                  )}
                  <span className="text-xs text-[#68756E]">
                    (Inclusive of all taxes)
                  </span>
                </div>

                <p className="mt-4 text-xs sm:text-sm text-[#68756E] leading-relaxed">
                  {product.description}
                </p>

                {/* Quality Grade Selector */}
                <div className="mt-5 pt-5 border-t border-[#E8DECB]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-2">
                    Quality Grade:
                  </label>
                  <div className="flex gap-2">
                    {(['Premium', 'Normal'] as const).map((qual) => (
                      <button
                        key={qual}
                        type="button"
                        onClick={() => handleSelectVariant(qual, product.weightGrams)}
                        className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                          product.quality === qual
                            ? 'border-[#123B2A] bg-[#123B2A] text-white shadow-xs'
                            : 'border-[#E8DECB] bg-white text-[#1C1C1C] hover:border-[#123B2A]'
                        }`}
                      >
                        {qual} Makhana
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weight Selector */}
                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-2">
                    Pack Size:
                  </label>
                  <div className="flex gap-2">
                    {([100, 200, 250] as const).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handleSelectVariant(product.quality, w)}
                        className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                          product.weightGrams === w
                            ? 'border-[#123B2A] bg-[#123B2A] text-white shadow-xs'
                            : 'border-[#E8DECB] bg-white text-[#1C1C1C] hover:border-[#123B2A]'
                        }`}
                      >
                        {w}g Pouch
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                {!isOutOfStock && (
                  <div className="mt-4 flex items-center gap-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#1C1C1C]">
                      Quantity:
                    </label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="border border-[#E8DECB] bg-white px-3 py-1.5 text-xs font-bold text-[#1C1C1C] rounded-lg focus:outline-none focus:border-[#123B2A]"
                    >
                      {[1, 2, 3, 4, 5, 10].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'pack' : 'packs'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-5 border-t border-[#E8DECB] space-y-3">
                {isOutOfStock ? (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900">
                      This pack is temporarily sold out. Sign up to get notified the moment our Bihar
                      pantry roasts the next batch!
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleBackInStock}
                      disabled={subscribingBackInStock}
                      className="w-full py-3 px-4 rounded-xl bg-[#123B2A] text-white text-xs font-extrabold uppercase tracking-wider hover:bg-[#092218] transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Bell className="w-4 h-4 text-[#C6A15B]" />
                      <span>
                        {isSubscribedBackInStock
                          ? 'Subscribed to Restock Alerts'
                          : 'Notify Me When Available'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={isAdding}
                      onClick={() => handleAddToCart(false)}
                      className="py-3 px-4 rounded-xl border border-[#123B2A] bg-white hover:bg-[#F7F1E5] text-xs font-extrabold uppercase tracking-wider text-[#123B2A] transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      type="button"
                      disabled={isAdding}
                      onClick={() => handleAddToCart(true)}
                      className="py-3 px-4 rounded-xl bg-[#123B2A] hover:bg-[#092218] text-xs font-extrabold uppercase tracking-wider text-white transition-colors shadow-xs"
                    >
                      Buy Now
                    </button>
                  </div>
                )}

                {/* Features Pill */}
                <div className="grid grid-cols-3 gap-2 pt-3 text-[10px] text-[#68756E] border-t border-[#E8DECB]/60">
                  <div className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#123B2A] shrink-0" />
                    <span>Pan-India Courier</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#123B2A] shrink-0" />
                    <span>Mithila GI-Certified</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 text-[#123B2A] shrink-0" />
                    <span>Freshness Seal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews-section" className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8DECB] shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8DECB]">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#C6A15B] uppercase">
                AUTHENTIC CUSTOMER FEEDBACK
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#092218] mt-0.5">
                Verified Customer Reviews
              </h2>
              <p className="text-xs text-[#68756E] mt-0.5">
                Every review is submitted exclusively by verified purchasers of this pack.
              </p>
            </div>

            <button
              onClick={() => {
                if (!currentUser) {
                  navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
                } else {
                  setShowReviewForm(!showReviewForm);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-[#123B2A] text-white hover:bg-[#092218] text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 shadow-xs w-fit"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{showReviewForm ? 'Close Form' : 'Write a Review'}</span>
            </button>
          </div>

          {/* Review Submission Form */}
          {showReviewForm && (
            <form
              onSubmit={handleSubmitReview}
              className="bg-[#FCFAF5] p-5 sm:p-6 rounded-2xl border border-[#E8DECB] space-y-4"
            >
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-base text-[#1C1C1C]">
                  Share Your Makhana Experience
                </h3>
                <p className="text-xs text-[#68756E]">
                  Verified reviews must meet community standards and are published after moderator review.
                </p>
              </div>

              {/* Star Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1.5">
                  Your Rating:
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? 'fill-[#C6A15B] text-[#C6A15B]'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#123B2A] ml-2 self-center">
                    {reviewRating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                  Headline / Title (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Incredibly fresh and crunchy!"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-[#E8DECB] rounded-xl bg-white focus:outline-none focus:border-[#123B2A]"
                />
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1C1C] mb-1">
                  Your Review / Tasting Notes:
                </label>
                <textarea
                  rows={3}
                  placeholder="Share details about the texture, roast, or packaging..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-[#E8DECB] rounded-xl bg-white focus:outline-none focus:border-[#123B2A]"
                />
              </div>

              {reviewFormMessage && (
                <div
                  className={`p-3 rounded-xl text-xs ${
                    reviewFormMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  {reviewFormMessage.text}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 border border-[#E8DECB] rounded-lg text-xs font-bold text-[#68756E] hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-[#123B2A] hover:bg-[#092218] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}

          {/* Rating Summary Breakdown */}
          {ratingSummary && ratingSummary.totalReviews > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#FCFAF5] p-6 rounded-2xl border border-[#E8DECB]">
              <div className="text-center md:text-left space-y-1">
                <div className="text-4xl font-extrabold text-[#123B2A] font-serif">
                  {ratingSummary.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center md:justify-start text-[#C6A15B]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(ratingSummary.averageRating)
                          ? 'fill-[#C6A15B] text-[#C6A15B]'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#68756E] block">
                  Based on {ratingSummary.totalReviews} verified purchases
                </span>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = (ratingSummary.distribution as any)[stars] || 0;
                  const pct =
                    ratingSummary.totalReviews > 0
                      ? Math.round((count / ratingSummary.totalReviews) * 100)
                      : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="w-12 text-[#68756E] font-medium text-right">
                        {stars} Star
                      </span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#C6A15B] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-[11px] text-[#68756E]">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review List */}
          {loadingReviews ? (
            <div className="text-center py-8 text-xs text-[#68756E]">
              <RefreshCw className="w-5 h-5 text-[#C6A15B] animate-spin mx-auto mb-2" />
              Loading customer reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#68756E] space-y-2">
              <MessageSquare className="w-8 h-8 text-[#68756E]/40 mx-auto" />
              <p>No published reviews for this pack yet.</p>
              <p className="text-[11px]">Be the first verified customer to share your thoughts!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E8DECB] space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#1C1C1C]">
                        {rev.user?.name || 'Makhana Patron'}
                      </span>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#68756E]">
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

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
                    <h4 className="font-serif font-bold text-sm text-[#1C1C1C]">
                      {rev.title}
                    </h4>
                  )}

                  {rev.comment && (
                    <p className="text-xs text-[#68756E] leading-relaxed">
                      {rev.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Products Carousel / Grid */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8DECB] shadow-xs space-y-6">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#C6A15B] uppercase">
                FRESHLY CURATED PAIRINGS
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#092218] mt-0.5">
                Recommended From Our Bihar Pantry
              </h2>
              <p className="text-xs text-[#68756E]">
                Customers who ordered this makhana harvest frequently select these packs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.map((rec) => {
                const recImage =
                  rec.images && rec.images.length > 0
                    ? rec.images[0]
                    : '/assets/product-main.png';

                return (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl border border-[#E8DECB] bg-[#FCFAF5] flex flex-col justify-between space-y-3 group hover:border-[#123B2A] transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="aspect-square rounded-xl bg-white overflow-hidden flex items-center justify-center p-3 border border-[#E8DECB]/60">
                        <img
                          src={recImage}
                          alt={rec.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/product-main.png';
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-xs text-[#1C1C1C] line-clamp-1">
                          {rec.name}
                        </h3>
                        {rec.weight && (
                          <span className="text-[10px] text-[#68756E] block">{rec.weight}</span>
                        )}
                        <span className="text-sm font-extrabold text-[#123B2A] block mt-1">
                          ₹{rec.price}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/products/makhana?sku=${rec.slug || rec.id}`}
                      className="w-full py-2 px-3 rounded-lg bg-[#123B2A] text-white text-[11px] font-bold uppercase tracking-wider text-center hover:bg-[#092218] transition-colors shadow-2xs block"
                    >
                      View Pack
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};
