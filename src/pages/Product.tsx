// src/pages/Product.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Heart,
  Star,
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
import { wishlistService } from '../services/wishlist';
import {
  trackViewItem,
  trackAddToWishlist,
  trackSubmitReview,
  trackBackInStockSignup,
} from '../services/analytics';
import { resolveRouteSeo, applySeoToDocument, finalizeSeo } from '../utils/seo';
import { Toast } from '../components/Toast';
import { Breadcrumb } from '../components/Breadcrumb';
import { authService } from '../services/auth';
import defaultProductImage from '../assets/images/product-main.webp';

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
    } catch (_) {
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
      const rawSeo = resolveRouteSeo({
        pathname: location.pathname,
        search: location.search,
        product,
      });
      const seo = finalizeSeo(rawSeo);
      applySeoToDocument(seo);
      trackViewItem(product, 1);
      loadRetentionData(product.id);
    }
  }, [product, location.pathname, location.search]);

  // Synchronize wishlisted status
  useEffect(() => {
    if (!product) return;
    setIsWishlisted(wishlistService.isWishlisted(product.id));
    const unsub = wishlistService.subscribe(() => {
      setIsWishlisted(wishlistService.isWishlisted(product.id));
    });
    return () => unsub();
  }, [product?.id]);

  const loadRetentionData = async (productId: string) => {
    // Rating Summary
    retentionService
      .getProductRatingSummary(productId)
      .then(setRatingSummary)
      .catch((err) => console.error('Rating summary error:', err));

    // Reviews
    setLoadingReviews(true);
    retentionService
      .getProductReviews(productId, 1, 10)
      .then((res) => setReviews(res.reviews))
      .catch((err) => console.error('Reviews load error:', err))
      .finally(() => setLoadingReviews(false));

    // Recommendations
    retentionService
      .getRecommendations({ productId, limit: 4 })
      .then(setRecommendations)
      .catch((err) => console.error('Recommendations error:', err));

    // Back in stock for logged-in users
    if (currentUser) {
      retentionService
        .getBackInStockStatus(productId)
        .then((res) => setIsSubscribedBackInStock(res.subscribed))
        .catch(() => {});
    }
  };

  const discountPercentage =
    product && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const isOutOfStock = product ? product.stock <= 0 : false;
  const isLowStock = product ? product.stock > 0 && product.stock <= 20 : false;

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
    if (goToCart) navigate('/cart');
  };

  const handleToggleWishlist = async () => {
    if (!product || togglingWishlist) return;
    setTogglingWishlist(true);
    try {
      const nowSaved = await wishlistService.toggleWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        weightGrams: product.weightGrams,
        slug: product.sku || product.id,
        stock: product.stock,
      });
      setIsWishlisted(nowSaved);
      if (nowSaved) {
        trackAddToWishlist(product);
      }
      setToastMessage(nowSaved ? `Saved ${product.name} to your wishlist!` : `Removed ${product.name} from wishlist.`);
    } catch (err: any) {
      setToastMessage(err?.message || 'Could not update wishlist');
    } finally {
      setTogglingWishlist(false);
    }
  };

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
      setReviewFormMessage({ type: 'success', text: 'Thank you! Your verified review has been submitted for moderation and will appear once approved.' });
      setReviewTitle('');
      setReviewComment('');
      setShowReviewForm(false);
    } catch (err: any) {
      setReviewFormMessage({ type: 'error', text: err?.message || 'Failed to submit review. Only verified purchasers can review this item.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  // --- Rendering branches ---
  if (loading) {
    return (
      <div className="bg-[#FCFAF5] min-h-screen py-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#C6A15B] animate-spin mx-auto" />
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

  // Main product page
  return (
    <div className="bg-[#FCFAF5] min-h-screen py-10 lg:py-16">
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 space-y-12">
        {/* Navigation Breadcrumb */}
        <div className="space-y-1">
          <Breadcrumb
            items={[
              { label: 'Home', to: '/' },
              { label: 'Shop Makhana', to: '/categories' },
              { label: `${product.name} (${product.weightGrams}g ${product.quality} Grade)` },
            ]}
          />
        </div>
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
            <Heart className={`w-4 h-4 ${isWishlisted ? 'text-rose-600 fill-rose-600' : 'text-[#68756E]'}`} />
            <span>{isWishlisted ? 'Saved' : 'Save to Wishlist'}</span>
          </button>
        </div>
        {/* Product Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8DECB] shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Image Container */}
            <div className="relative aspect-square w-full rounded-2xl bg-[#FAF7EF] overflow-hidden border border-[#E8DECB]/80 flex items-center justify-center p-3 sm:p-4">
              <img
                src={product.image || defaultProductImage}
                alt={`${product.name} ${product.weightGrams}g — ${product.quality} Grade Bihar Fox Nuts (Makhana) | Nyuta Elite`}
                className="block w-full h-full object-contain object-center transition-transform duration-300 hover:scale-104"
                loading="eager"
                fetchPriority="high"
                width={500}
                height={500}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultProductImage;
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
              {/* Out of stock overlay */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center">
                  <div className="bg-rose-600 text-white text-xs font-extrabold px-4 py-2 rounded-xl uppercase tracking-wider shadow-md">
                    Out of Stock
                  </div>
                </div>
              )}
            </div>
            {/* Product Details */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-[0.2em] text-[#C6A15B] uppercase block mb-1">
                  AUTHENTIC BIHAR HARVEST • MITHILA REGION
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#092218]">
                  NYUTA ELITE {product.name} – {product.weightGrams}g
                </h1>
                {/* Rating Stars Summary */}
                {ratingSummary && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center text-[#C6A15B]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-4 h-4 ${star <= Math.round(ratingSummary.averageRating) ? 'fill-[#C6A15B] text-[#C6A15B]' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#123B2A]">
                      {ratingSummary.averageRating > 0 ? `${ratingSummary.averageRating.toFixed(1)} / 5.0` : 'No ratings yet'}
                    </span>
                    <a href="#reviews-section" className="text-xs text-[#68756E] underline hover:text-[#123B2A]">
                      ({ratingSummary.totalReviews} verified {ratingSummary.totalReviews === 1 ? 'review' : 'reviews'})
                    </a>
                  </div>
                )}
                {/* Price Display */}
                <div className="flex items-baseline gap-3 mt-4">
                  <span className="text-3xl font-extrabold text-[#123B2A] font-serif">₹{product.price}</span>
                  {product.mrp > product.price && (
                    <span className="text-base font-medium text-[#68756E] line-through">₹{product.mrp}</span>
                  )}
                  <span className="text-xs font-medium text-[#68756E]">(Inclusive of all taxes)</span>
                </div>

                {/* Product Description */}
                <p className="text-sm text-[#68756E] leading-relaxed mt-4">
                  {product.description}
                </p>

                {/* Product Specifications */}
                <div className="grid grid-cols-2 gap-2.5 pt-4 mt-4 border-t border-[#E8DECB]/60 text-xs text-[#1C1C1C]">
                  <div>
                    <span className="font-bold text-[#123B2A]">Quality Grade: </span>
                    <span className="text-[#68756E]">{product.quality} Hand-Sorted</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#123B2A]">Pack Size: </span>
                    <span className="text-[#68756E]">{product.weightGrams}g Pouch</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#123B2A]">Harvest Origin: </span>
                    <span className="text-[#68756E]">Mithila, Bihar</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#123B2A]">Packaging: </span>
                    <span className="text-[#68756E]">Airtight Barrier</span>
                  </div>
                </div>

                {/* Quantity Selector and Add to Cart */}
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex items-center border border-[#E8DECB] rounded-md overflow-hidden">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 text-[#68756E] hover:bg-[#F7F1E5]">-</button>
                    <span className="px-3 py-1">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 text-[#68756E] hover:bg-[#F7F1E5]">+</button>
                  </div>
                  <button onClick={() => handleAddToCart()} disabled={isAdding || isOutOfStock} className="px-6 py-2 bg-[#123B2A] text-white rounded-lg hover:bg-[#092218] disabled:opacity-50">Add to Cart</button>
                  <button onClick={() => handleAddToCart(true)} disabled={isAdding || isOutOfStock} className="px-6 py-2 bg-[#C6A15B] text-white rounded-lg hover:bg-[#A58F3D] disabled:opacity-50">Buy Now</button>
                </div>

                {/* Available Pack Sizes & Grade Options (Crawlable Internal Links) */}
                <div className="mt-6 pt-5 border-t border-[#E8DECB] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-[#123B2A]">
                      Available {product.quality} Grade Sizes:
                    </span>
                    <Link to="/categories" className="text-[#C6A15B] font-semibold hover:underline">
                      View All Packs
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {[100, 200, 250].map((wt) => {
                      const targetSku = `${product.quality.toLowerCase()}-${wt}g`;
                      const isCurrent = product.weightGrams === wt;
                      return (
                        <Link
                          key={wt}
                          to={`/products/makhana?sku=${targetSku}`}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            isCurrent
                              ? 'bg-[#123B2A] text-white border-[#123B2A] shadow-xs'
                              : 'bg-white text-[#1C1C1C] border-[#E8DECB] hover:border-[#123B2A]'
                          }`}
                        >
                          {wt}g Pack
                        </Link>
                      );
                    })}
                  </div>

                  <div className="pt-2 text-xs">
                    <span className="text-[#68756E]">Looking for everyday snacking? </span>
                    <Link
                      to={`/products/makhana?sku=${product.quality === 'Premium' ? 'normal' : 'premium'}-${product.weightGrams}g`}
                      className="text-[#123B2A] font-bold underline hover:text-[#C6A15B]"
                    >
                      Explore {product.quality === 'Premium' ? 'Normal Everyday' : 'Premium Jumbo'} Grade ({product.weightGrams}g)
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Back‑In‑Stock Subscription */}
        {currentUser && (
          <div className="mt-6">
            <button onClick={handleToggleBackInStock} disabled={subscribingBackInStock} className="px-4 py-2 bg-[#123B2A] text-white rounded hover:bg-[#092218] disabled:opacity-50">
              {isSubscribedBackInStock ? 'Unsubscribe' : 'Notify Me When Back In Stock'}
            </button>
          </div>
        )}
        {/* ── Internal Content Links: Articles relevant to this product ── */}
        <section aria-label="Learn more about makhana" className="bg-[#F7F1E5] rounded-2xl p-6 border border-[#E8DECB] space-y-4">
          <h2 className="font-serif text-lg font-bold text-[#092218]">Learn More About Makhana</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/learn/how-to-choose-good-quality-makhana"
              className="bg-white p-4 rounded-xl border border-[#E8DECB] hover:border-[#123B2A] transition-colors group block space-y-1"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C6A15B]">Buyer's Guide</span>
              <p className="font-serif font-bold text-sm text-[#092218] group-hover:underline">How to Choose Good-Quality Makhana</p>
              <p className="text-xs text-[#68756E]">Understand Suta sizing, unbleached sourcing, crispness checks, and storage tips.</p>
            </Link>
            <Link
              to="/learn/makhana-benefits-health"
              className="bg-white p-4 rounded-xl border border-[#E8DECB] hover:border-[#123B2A] transition-colors group block space-y-1"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C6A15B]">Nutrition & Lifestyle</span>
              <p className="font-serif font-bold text-sm text-[#092218] group-hover:underline">Makhana Benefits: 7 Reasons to Eat Fox Nuts Every Day</p>
              <p className="text-xs text-[#68756E]">Evidence-informed look at protein, fiber, magnesium, and heart health support.</p>
            </Link>
          </div>
          <div className="pt-1 flex flex-wrap gap-3 text-xs">
            <Link to="/categories" className="text-[#123B2A] font-bold hover:underline">← All Makhana Packs</Link>
            <Link to="/faq" className="text-[#123B2A] font-bold hover:underline">FAQ — Shipping, Grades & Returns</Link>
            <Link to="/bulk-order/qualities" className="text-[#123B2A] font-bold hover:underline">Bulk / Wholesale Orders</Link>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="reviews-section" className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Customer Reviews</h2>
          {loadingReviews ? (
            <p>Loading reviews...</p>
          ) : (
            <div>
              {reviews.map((rev) => (
                <div key={rev.id} className="border-b py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center text-[#C6A15B]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-[#C6A15B] text-[#C6A15B]' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm text-[#68756E]">{new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {rev.title && <h4 className="font-serif font-bold text-sm text-[#1C1C1C]">{rev.title}</h4>}
                  {rev.comment && <p className="text-xs text-[#68756E] leading-relaxed">{rev.comment}</p>}
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowReviewForm(!showReviewForm)} className="mt-4 px-4 py-2 bg-[#C6A15B] text-white rounded hover:bg-[#A58F3D]">
            {showReviewForm ? 'Cancel' : 'Write a Review'}
          </button>
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium" htmlFor="rating">Rating</label>
                <select id="rating" value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="mt-1 block w-full border rounded">
                  {[5,4,3,2,1].map((v) => (
                    <option key={v} value={v}>{v} star{v > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium" htmlFor="title">Title (optional)</label>
                <input id="title" type="text" value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} className="mt-1 block w-full border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium" htmlFor="comment">Comment</label>
                <textarea id="comment" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="mt-1 block w-full border rounded" rows={4} />
              </div>
              {reviewFormMessage && (
                <p className={reviewFormMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}>{reviewFormMessage.text}</p>
              )}
              <button type="submit" disabled={submittingReview} className="px-4 py-2 bg-[#123B2A] text-white rounded hover:bg-[#092218] disabled:opacity-50">Submit Review</button>
            </form>
          )}
        </section>
        {/* Recommended Products */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8DECB] shadow-xs space-y-6">
            <div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#C6A15B] uppercase">FRESHLY CURATED PAIRINGS</span>
              <h2 className="font-serif text-2xl font-bold text-[#092218] mt-0.5">Recommended From Our Bihar Pantry</h2>
              <p className="text-xs text-[#68756E]">Customers who ordered this makhana harvest frequently select these packs.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.map((rec) => {
                const recImage = rec.images && rec.images.length > 0 ? rec.images[0] : defaultProductImage;
                return (
                  <div key={rec.id} className="p-4 rounded-2xl border border-[#E8DECB] bg-[#FCFAF5] flex flex-col justify-between space-y-3 group hover:border-[#123B2A] transition-colors">
                    <div className="space-y-2">
                      <div className="aspect-square rounded-xl bg-white overflow-hidden flex items-center justify-center p-3 border border-[#E8DECB]/60">
                        <img src={recImage} alt={rec.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" onError={(e) => {(e.target as HTMLImageElement).src = defaultProductImage;}} />
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-xs text-[#1C1C1C] line-clamp-1">{rec.name}</h3>
                        {rec.weight && <span className="text-[10px] text-[#68756E] block">{rec.weight}</span>}
                        <span className="text-sm font-extrabold text-[#123B2A] block mt-1">₹{rec.price}</span>
                      </div>
                    </div>
                    <Link to={`/products/makhana?sku=${rec.slug || rec.id}`} className="w-full py-2 px-3 rounded-lg bg-[#123B2A] text-white text-[11px] font-bold uppercase tracking-wider text-center hover:bg-[#092218] transition-colors shadow-2xs block">View Pack</Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Toast */}
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      </div>
    </div>
  );
};
