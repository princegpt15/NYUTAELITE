// backend/src/routes/growth.routes.ts
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import {
  getSegmentSummaries,
  getCustomers,
  getCustomerDetail,
  getCampaigns,
  createCampaign,
  getCampaignDetail,
  updateCampaign,
  previewCampaign,
  launchCampaign,
  cancelCampaign,
  getCampaignRecipients,
  getAbandonedCarts,
  processAbandonedCarts,
  getCustomerPreferences,
  updateCustomerPreferences,
  unsubscribe,
  restoreRecoveredCart,
  trackBehavioralEventHandler,
  getGrowthAnalyticsDashboard,
  getConversionFunnelAnalytics,
  getCheckoutFunnelAnalytics,
  getRevenueAndAovAnalytics,
  getProductConversionAnalytics,
  getCartRecoveryAnalytics,
  getCampaignPerformanceAnalytics,
  getSegmentPerformanceAnalytics,
  getCohortRetentionAnalytics,
  getRepeatAndLtvAnalytics,
  getProgramsPerformanceAnalytics,
  listExperiments,
  createExperiment,
  getExperimentDetail,
  updateExperiment,
  transitionExperimentStatus,
  getExperimentResults,
  assignExperimentSubject,
  recordExperimentEvent,
} from '../controllers/growth.controller.js';

const router = Router();

// ================= CUSTOMER PREFERENCES & UNSUBSCRIBE =================
router.get('/account/preferences', requireAuth, getCustomerPreferences);
router.put('/account/preferences', requireAuth, updateCustomerPreferences);
router.post('/marketing/unsubscribe', unsubscribe);

// ================= CART RECOVERY (PUBLIC CUSTOMER RESTORATION) =================
router.get('/cart/recover/:token', restoreRecoveredCart);

// ================= STOREFRONT BEHAVIORAL EVENTS & EXPERIMENTS =================
router.post('/analytics/events', trackBehavioralEventHandler);
router.post('/experiments/:key/assign', assignExperimentSubject);
router.post('/experiments/:key/events', recordExperimentEvent);

// ================= ADMIN SEGMENTS & CRM =================
router.get('/admin/growth/segments', requireAuth, requireAdmin, getSegmentSummaries);
router.get('/admin/growth/customers', requireAuth, requireAdmin, getCustomers);
router.get('/admin/growth/customers/:id', requireAuth, requireAdmin, getCustomerDetail);

// ================= ADMIN CAMPAIGNS =================
router.get('/admin/growth/campaigns', requireAuth, requireAdmin, getCampaigns);
router.post('/admin/growth/campaigns', requireAuth, requireAdmin, createCampaign);
router.get('/admin/growth/campaigns/:id', requireAuth, requireAdmin, getCampaignDetail);
router.patch('/admin/growth/campaigns/:id', requireAuth, requireAdmin, updateCampaign);
router.post('/admin/growth/campaigns/:id/preview', requireAuth, requireAdmin, previewCampaign);
router.post('/admin/growth/campaigns/:id/launch', requireAuth, requireAdmin, launchCampaign);
router.post('/admin/growth/campaigns/:id/cancel', requireAuth, requireAdmin, cancelCampaign);
router.get('/admin/growth/campaigns/:id/recipients', requireAuth, requireAdmin, getCampaignRecipients);

// ================= ADMIN ABANDONED CARTS =================
router.get('/admin/growth/abandoned-carts', requireAuth, requireAdmin, getAbandonedCarts);
router.post('/admin/growth/abandoned-carts/process', requireAuth, requireAdmin, processAbandonedCarts);

// ================= PHASE 19: ADMIN GROWTH ANALYTICS =================
router.get('/admin/growth/analytics/dashboard', requireAuth, requireAdmin, getGrowthAnalyticsDashboard);
router.get('/admin/growth/analytics/funnel/conversion', requireAuth, requireAdmin, getConversionFunnelAnalytics);
router.get('/admin/growth/analytics/funnel/checkout', requireAuth, requireAdmin, getCheckoutFunnelAnalytics);
router.get('/admin/growth/analytics/revenue-aov', requireAuth, requireAdmin, getRevenueAndAovAnalytics);
router.get('/admin/growth/analytics/products', requireAuth, requireAdmin, getProductConversionAnalytics);
router.get('/admin/growth/analytics/cart-recovery', requireAuth, requireAdmin, getCartRecoveryAnalytics);
router.get('/admin/growth/analytics/campaigns', requireAuth, requireAdmin, getCampaignPerformanceAnalytics);
router.get('/admin/growth/analytics/segments', requireAuth, requireAdmin, getSegmentPerformanceAnalytics);
router.get('/admin/growth/analytics/cohorts', requireAuth, requireAdmin, getCohortRetentionAnalytics);
router.get('/admin/growth/analytics/repeat-ltv', requireAuth, requireAdmin, getRepeatAndLtvAnalytics);
router.get('/admin/growth/analytics/programs', requireAuth, requireAdmin, getProgramsPerformanceAnalytics);

// ================= PHASE 19: ADMIN EXPERIMENTATION ENGINE =================
router.get('/admin/experiments', requireAuth, requireAdmin, listExperiments);
router.post('/admin/experiments', requireAuth, requireAdmin, createExperiment);
router.get('/admin/experiments/:id', requireAuth, requireAdmin, getExperimentDetail);
router.patch('/admin/experiments/:id', requireAuth, requireAdmin, updateExperiment);
router.post('/admin/experiments/:id/status', requireAuth, requireAdmin, transitionExperimentStatus);
router.get('/admin/experiments/:id/results', requireAuth, requireAdmin, getExperimentResults);

export default router;

