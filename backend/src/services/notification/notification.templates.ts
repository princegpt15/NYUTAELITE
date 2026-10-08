// backend/src/services/notification/notification.templates.ts
import type { NotificationType } from '@prisma/client';
import type {
  OrderNotificationContext,
  RenderedNotificationTemplate,
  NotificationAddressSnapshot,
} from './notification.types.js';

function escapeHtml(unsafe: unknown): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatInr(amount: number | null | undefined): string {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateInr(date: Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatAddressHtml(addr: NotificationAddressSnapshot | null): string {
  if (!addr) return 'Address on file';
  const lines = [
    addr.fullName ? `<strong>${escapeHtml(addr.fullName)}</strong>` : '',
    escapeHtml(addr.addressLine1),
    addr.addressLine2 ? escapeHtml(addr.addressLine2) : '',
    addr.landmark ? `Landmark: ${escapeHtml(addr.landmark)}` : '',
    [addr.city, addr.state, addr.postalCode].filter(Boolean).map(escapeHtml).join(', '),
    addr.country ? escapeHtml(addr.country) : 'India',
    addr.phone ? `Phone: ${escapeHtml(addr.phone)}` : '',
  ].filter(Boolean);
  return lines.join('<br/>');
}

function formatAddressText(addr: NotificationAddressSnapshot | null): string {
  if (!addr) return 'Address on file';
  return [
    addr.fullName,
    addr.addressLine1,
    addr.addressLine2,
    addr.landmark ? `Landmark: ${addr.landmark}` : '',
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(', '),
    addr.country || 'India',
    addr.phone ? `Phone: ${addr.phone}` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

function getHeaderCopy(
  type: NotificationType,
  ctx: OrderNotificationContext
): {
  subject: string;
  badge: string;
  headline: string;
  lead: string;
  statusNote: string;
} {
  const orderNo = ctx.orderNumber;
  switch (type) {
    case 'ORDER_CONFIRMED':
      return {
        subject: `Order Confirmed — ${orderNo} | NYUTA ELITE MAKHANA`,
        badge: 'ORDER CONFIRMED',
        headline: 'Thank you for your order from our Mithila Pantry.',
        lead: `Hi ${ctx.customerName}, your order ${orderNo} has been confirmed and is being prepared for roasting and packing at our Bihar pantry.`,
        statusNote: 'Order Status: CONFIRMED • Shipping Status: PENDING',
      };
    case 'ORDER_PROCESSING':
      return {
        subject: `Preparing Your Order — ${orderNo} | NYUTA ELITE MAKHANA`,
        badge: 'IN PANTRY PREPARATION',
        headline: 'Your makhana order is being freshly packed.',
        lead: `Hi ${ctx.customerName}, our team is currently quality-checking and sealing your packs for order ${orderNo}.`,
        statusNote: 'Order Status: PROCESSING • Shipping Status: PENDING',
      };
    case 'ORDER_SHIPPED':
      return {
        subject: `Order Shipped — ${orderNo} | NYUTA ELITE MAKHANA`,
        badge: 'ORDER SHIPPED',
        headline: 'Your NYUTA ELITE makhana is on its way!',
        lead: `Hi ${ctx.customerName}, great news — order ${orderNo} has been dispatched from our pantry and is in transit to your delivery address.`,
        statusNote: 'Order Status: SHIPPED • Shipping Status: SHIPPED',
      };
    case 'ORDER_DELIVERED':
      return {
        subject: `Order Delivered — ${orderNo} | NYUTA ELITE MAKHANA`,
        badge: 'ORDER DELIVERED',
        headline: 'Your order has been delivered.',
        lead: `Hi ${ctx.customerName}, order ${orderNo} has been marked as delivered. We hope you enjoy the crisp, authentic taste of Mithila makhana!`,
        statusNote: 'Order Status: DELIVERED • Shipping Status: DELIVERED',
      };
    case 'ORDER_CANCELLED':
      return {
        subject: `Order Cancelled — ${orderNo} | NYUTA ELITE MAKHANA`,
        badge: 'ORDER CANCELLED',
        headline: `Your order ${orderNo} has been cancelled.`,
        lead: `Hi ${ctx.customerName}, order ${orderNo} has been cancelled as requested or per order status update.`,
        statusNote: `Order Status: CANCELLED • Payment Status: ${ctx.paymentStatus}`,
      };
    case 'PAYMENT_SUCCESS':
      return {
        subject: `Payment Received — ${orderNo} | NYUTA ELITE MAKHANA`,
        badge: 'PAYMENT SUCCESSFUL',
        headline: `We have received your payment of ${formatInr(ctx.totalAmount)}.`,
        lead: `Hi ${ctx.customerName}, your payment for order ${orderNo} has been verified and captured.`,
        statusNote: `Payment Status: CAPTURED${ctx.paymentReference ? ` • Ref: ${ctx.paymentReference}` : ''}`,
      };
    case 'PAYMENT_FAILED':
      return {
        subject: `Payment Unsuccessful — ${orderNo} | NYUTA ELITE MAKHANA`,
        badge: 'PAYMENT FAILED',
        headline: `Payment could not be completed for order ${orderNo}.`,
        lead: `Hi ${ctx.customerName}, we could not complete the payment for order ${orderNo}. If any amount was debited, your bank will reverse it automatically.`,
        statusNote: 'Payment Status: FAILED',
      };
    case 'REFUND_INITIATED':
      return {
        subject: `Refund Initiated — ${orderNo} | NYUTA ELITE MAKHANA`,
        badge: 'REFUND INITIATED',
        headline: `A refund of ${formatInr(ctx.refundAmount ?? ctx.totalAmount)} has been initiated.`,
        lead: `Hi ${ctx.customerName}, we have initiated a refund for order ${orderNo} to your original payment method.`,
        statusNote: `Refund Amount: ${formatInr(ctx.refundAmount ?? ctx.totalAmount)}`,
      };
    case 'REFUND_COMPLETED':
      return {
        subject: `Refund Processed — ${orderNo} | NYUTA ELITE MAKHANA`,
        badge: 'REFUND COMPLETED',
        headline: `Your refund of ${formatInr(ctx.refundAmount ?? ctx.totalAmount)} has been processed.`,
        lead: `Hi ${ctx.customerName}, your refund for order ${orderNo} has been confirmed by our payment gateway and credited toward your original payment source (typically reflects within 5–7 business days).`,
        statusNote: `Refund Status: COMPLETED${ctx.refundReference ? ` • Refund ID: ${ctx.refundReference}` : ''}`,
      };
    case 'BACK_IN_STOCK':
      return {
        subject: `Back In Stock Alert | NYUTA ELITE MAKHANA`,
        badge: 'BACK IN STOCK',
        headline: `Good news! Your favorite makhana pack is back in stock.`,
        lead: `Hi ${ctx.customerName}, the makhana pack you requested is now freshly roasted and available in our pantry. Order now before stock runs out!`,
        statusNote: 'Inventory Status: RESTOCKED',
      };
    case 'REVIEW_APPROVED':
      return {
        subject: `Your Review is Live! | NYUTA ELITE MAKHANA`,
        badge: 'REVIEW APPROVED',
        headline: `Thank you for sharing your feedback with the Mithila pantry family!`,
        lead: `Hi ${ctx.customerName}, your product review has been verified and approved by our team. Thank you for helping other makhana lovers make healthy choices.`,
        statusNote: 'Review Status: APPROVED',
      };
    case 'REFERRAL_REWARD':
      return {
        subject: `Referral Reward Earned! | NYUTA ELITE MAKHANA`,
        badge: 'REFERRAL REWARD',
        headline: `You earned reward points from a friend referral!`,
        lead: `Hi ${ctx.customerName}, your referred friend completed their first order! Bonus loyalty points have been credited to your pantry account.`,
        statusNote: 'Reward: REFERRAL BONUS CREDITED',
      };
    case 'LOYALTY_REWARD':
      return {
        subject: `Pantry Points Credited! | NYUTA ELITE MAKHANA`,
        badge: 'LOYALTY REWARD',
        headline: `You earned loyalty reward points!`,
        lead: `Hi ${ctx.customerName}, loyalty reward points have been credited to your NYUTA ELITE pantry account from order ${orderNo}. Use them for instant discounts on your next purchase.`,
        statusNote: 'Account Status: POINTS CREDITED',
      };
  }
}

/**
 * Render branded, mobile-responsive HTML email, plain-text fallback, and WhatsApp message
 * for any order/payment lifecycle notification.
 */
export function renderNotificationTemplate(
  type: NotificationType,
  ctx: OrderNotificationContext
): RenderedNotificationTemplate {
  const copy = getHeaderCopy(type, ctx);
  const formattedDate = formatDateInr(ctx.orderDate);

  const itemsRowsHtml = ctx.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #E8DECB; color: #1C1C1C; font-size: 14px;">
          <strong>${escapeHtml(item.productName)}</strong>
          <div style="color: #68756E; font-size: 12px;">Qty: ${item.quantity} × ${formatInr(item.price)}</div>
        </td>
        <td align="right" style="padding: 10px 0; border-bottom: 1px solid #E8DECB; color: #123B2A; font-weight: 700; font-size: 14px;">
          ${formatInr(item.subtotal)}
        </td>
      </tr>`
    )
    .join('');

  const discountRowHtml =
    ctx.discountAmount > 0 || ctx.couponCode
      ? `
      <tr>
        <td style="padding: 6px 0; color: #123B2A; font-size: 13px;">
          Discount${ctx.couponCode ? ` <span style="background:#F7F1E5;border:1px solid #C6A15B;padding:1px 6px;border-radius:4px;font-family:monospace;font-size:11px;">${escapeHtml(ctx.couponCode)}</span>` : ''}
        </td>
        <td align="right" style="padding: 6px 0; color: #15803D; font-weight: 700; font-size: 13px;">
          -${formatInr(ctx.discountAmount)}
        </td>
      </tr>`
      : '';

  const refundSectionHtml =
    (type === 'REFUND_INITIATED' || type === 'REFUND_COMPLETED') &&
    (ctx.refundAmount || ctx.refundReference)
      ? `
      <div style="margin-top: 20px; padding: 14px 16px; background-color: #F7F1E5; border-left: 4px solid #C6A15B; border-radius: 6px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #123B2A;">
          Refund Summary
        </div>
        <div style="margin-top: 6px; font-size: 13px; color: #1C1C1C;">
          <strong>Refunded Amount:</strong> ${formatInr(ctx.refundAmount ?? ctx.totalAmount)}<br/>
          ${ctx.refundReference ? `<strong>Gateway Reference:</strong> <span style="font-family:monospace;">${escapeHtml(ctx.refundReference)}</span><br/>` : ''}
          ${ctx.refundReason ? `<strong>Note:</strong> ${escapeHtml(ctx.refundReason)}` : ''}
        </div>
      </div>`
      : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(copy.subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FCFAF5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1C1C1C;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FCFAF5; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E8DECB; border-radius: 14px; overflow: hidden;">
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #123B2A; padding: 24px 28px; border-bottom: 3px solid #C6A15B;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; color: #C6A15B; text-transform: uppercase;">
                NYUTA ELITE MAKHANA • MITHILA PANTRY
              </div>
              <div style="margin-top: 8px; display: inline-block; background-color: #092218; color: #F7F1E5; border: 1px solid #C6A15B; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em;">
                ${escapeHtml(copy.badge)}
              </div>
              <h1 style="margin: 12px 0 0 0; font-size: 22px; line-height: 1.3; color: #FCFAF5; font-weight: 700;">
                ${escapeHtml(copy.headline)}
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 26px 28px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #1C1C1C;">
                ${escapeHtml(copy.lead)}
              </p>

              <!-- Order Meta Bar -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F7F1E5; border: 1px solid #E8DECB; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #1C1C1C;">
                    <strong>Order Number:</strong> <span style="font-family: monospace; color: #123B2A;">${escapeHtml(ctx.orderNumber)}</span><br/>
                    <strong>Order Date:</strong> ${escapeHtml(formattedDate)}<br/>
                    <strong>Payment Status:</strong> ${escapeHtml(ctx.paymentStatus)}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 6px; font-size: 12px; color: #123B2A; font-weight: 600;">
                    ${escapeHtml(copy.statusNote)}
                  </td>
                </tr>
              </table>

              ${refundSectionHtml}

              <!-- Order Items -->
              <div style="margin-top: 20px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #68756E; margin-bottom: 8px;">
                  Order Items
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${itemsRowsHtml}
                </table>
              </div>

              <!-- Financial Summary -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 16px;">
                <tr>
                  <td style="padding: 6px 0; color: #68756E; font-size: 13px;">Subtotal</td>
                  <td align="right" style="padding: 6px 0; color: #1C1C1C; font-weight: 600; font-size: 13px;">${formatInr(ctx.subtotal)}</td>
                </tr>
                ${discountRowHtml}
                <tr>
                  <td style="padding: 6px 0; color: #68756E; font-size: 13px;">Shipping</td>
                  <td align="right" style="padding: 6px 0; color: #1C1C1C; font-weight: 600; font-size: 13px;">
                    ${ctx.shippingAmount === 0 ? 'FREE' : formatInr(ctx.shippingAmount)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0 4px 0; border-top: 2px solid #123B2A; color: #092218; font-weight: 800; font-size: 15px;">
                    Total
                  </td>
                  <td align="right" style="padding: 10px 0 4px 0; border-top: 2px solid #123B2A; color: #123B2A; font-weight: 800; font-size: 16px;">
                    ${formatInr(ctx.totalAmount)}
                  </td>
                </tr>
              </table>

              <!-- Shipping Address -->
              <div style="margin-top: 22px; padding-top: 16px; border-top: 1px solid #E8DECB;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #68756E; margin-bottom: 6px;">
                  Shipping Address
                </div>
                <div style="font-size: 13px; line-height: 1.5; color: #1C1C1C;">
                  ${formatAddressHtml(ctx.shippingAddress)}
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F7F1E5; padding: 18px 28px; border-top: 1px solid #E8DECB; font-size: 12px; color: #68756E; line-height: 1.5;">
              Need help with your order? Contact NYUTA ELITE Support at
              <a href="mailto:support@nutyaelite.com" style="color: #123B2A; font-weight: 700; text-decoration: none;">support@nutyaelite.com</a>
              or visit <a href="https://nutyaelite.com/orders" style="color: #123B2A; font-weight: 700; text-decoration: none;">nutyaelite.com/orders</a>.<br/>
              <span style="font-size: 11px;">This is a transactional notification regarding your NYUTA ELITE MAKHANA order.</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const itemsText = ctx.items
    .map((i) => `- ${i.productName} (Qty: ${i.quantity} x ${formatInr(i.price)}) = ${formatInr(i.subtotal)}`)
    .join('\n');

  const discountText =
    ctx.discountAmount > 0 || ctx.couponCode
      ? `Discount${ctx.couponCode ? ` (${ctx.couponCode})` : ''}: -${formatInr(ctx.discountAmount)}\n`
      : '';

  const refundText =
    (type === 'REFUND_INITIATED' || type === 'REFUND_COMPLETED') &&
    (ctx.refundAmount || ctx.refundReference)
      ? `\nRefund Amount: ${formatInr(ctx.refundAmount ?? ctx.totalAmount)}${
          ctx.refundReference ? `\nRefund Reference: ${ctx.refundReference}` : ''
        }\n`
      : '';

  const text = [
    `NYUTA ELITE MAKHANA — ${copy.badge}`,
    copy.headline,
    '',
    copy.lead,
    '',
    `Order Number: ${ctx.orderNumber}`,
    `Order Date: ${formattedDate}`,
    copy.statusNote,
    refundText,
    'Items:',
    itemsText,
    '',
    `Subtotal: ${formatInr(ctx.subtotal)}`,
    discountText ? discountText.trimEnd() : null,
    `Shipping: ${ctx.shippingAmount === 0 ? 'FREE' : formatInr(ctx.shippingAmount)}`,
    `Total: ${formatInr(ctx.totalAmount)}`,
    '',
    `Shipping Address: ${formatAddressText(ctx.shippingAddress)}`,
    '',
    'Need assistance? Contact support@nutyaelite.com or visit https://nutyaelite.com/orders',
  ]
    .filter((line) => line !== null && line !== undefined)
    .join('\n');

  const whatsappText = `NYUTA ELITE MAKHANA: ${copy.badge} (${ctx.orderNumber}). ${copy.lead} Total: ${formatInr(
    ctx.totalAmount
  )}. Track at https://nutyaelite.com/orders`;

  return {
    subject: copy.subject,
    html,
    text,
    whatsappText,
  };
}
