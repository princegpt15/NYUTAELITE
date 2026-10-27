# NYUTAELITE Search Engine Discovery & SEO Report
**Run Timestamp:** 2026-10-26T04:23:08.175Z (UTC)
**Website Origin:** [https://nyutaelite.com](https://nyutaelite.com)
**Overall System Health:** **HEALTHY**

## 1. Executive Summary
| Metric | Value | Status |
|---|:---:|:---:|
| **Discovered Inventory** | 14 URLs | PASS |
| **Sitemap XML URLs** | 14 URLs | VALID |
| **Pages Passing Technical Check** | 6 / 14 | ATTENTION |
| **Google Merchant Center Feed** | 6 Products | COMPLIANT |
| **Critical Severity Issues** | 0 | NONE |
| **High Severity Issues** | 0 | NONE |
| **Medium / Low Issues** | 14 | INFO |

## 2. Search Engine Platform Integrations
### Google Search Console API
* **Authentication Mode:** `NONE`
* **API Connection:** Pending Credentials
* **Status Notice:** Authentication not configured
> [!NOTE]
> **Configuration Guide:**
> ```
> Google Search Console API Authentication is not configured.
> 
> Option A (Recommended for Automated Jobs: Service Account):
>   1. Create a Google Cloud Project & enable Google Search Console API.
>   2. Create a Service Account, download the JSON key file.
>   3. Add the service account email as a "Full" user in Google Search Console for https://nyutaelite.com/.
>   4. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json in your .env or environment.
> 
> Option B (OAuth 2.0 Web/App):
>   1. Configure OAuth 2.0 Client credentials in Google Cloud Console.
>   2. Generate a Refresh Token with scope: https://www.googleapis.com/auth/webmasters.readonly
>   3. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in your .env.
> ```

### Bing Webmaster Tools API
* **Configured:** No
* **API Connection:** Pending Key
* **Status Notice:** Bing API key not configured
> [!NOTE]
> **Configuration Guide:**
> ```
> Bing Webmaster Tools API is not configured.
> 
> Setup Steps:
>   1. Log in to Bing Webmaster Tools (https://www.bing.com/webmasters).
>   2. Ensure https://nyutaelite.com is verified (can import from Google Search Console in 1 click).
>   3. Navigate to Settings (gear icon) -> API Access -> API Key.
>   4. Generate or copy your Bing Webmaster API Key.
>   5. Set BING_API_KEY=<your_api_key> in your .env or environment.
> ```

## 3. Crawlability & Indexing Status Inventory
| URL | Sieve / Category | Status Code | Indexing State | Canonical Parity | Schema Types |
|---|---|:---:|---|:---:|---|
| [/](https://nyutaelite.com/) | INSPECTION_PENDING_CREDENTIALS | 200 OK | INSPECTION_PENDING_CREDENTIALS | MATCH | Breadcrumb, Product/Article |
| [/categories](https://nyutaelite.com/categories) | INSPECTION_PENDING_CREDENTIALS | 200 OK | INSPECTION_PENDING_CREDENTIALS | MATCH | Breadcrumb, Product/Article |
| [/products/makhana](https://nyutaelite.com/products/makhana) | INSPECTION_PENDING_CREDENTIALS | 200 OK | INSPECTION_PENDING_CREDENTIALS | MATCH | Breadcrumb, Product/Article |
| [/about](https://nyutaelite.com/about) | INSPECTION_PENDING_CREDENTIALS | 200 OK | INSPECTION_PENDING_CREDENTIALS | MATCH | Breadcrumb, Product/Article |
| [/faq](https://nyutaelite.com/faq) | INSPECTION_PENDING_CREDENTIALS | 200 OK | INSPECTION_PENDING_CREDENTIALS | MATCH | Breadcrumb, Product/Article |
| [/contact](https://nyutaelite.com/contact) | INSPECTION_PENDING_CREDENTIALS | 200 OK | INSPECTION_PENDING_CREDENTIALS | MATCH | Breadcrumb, Product/Article |
| [/bulk-order/qualities](https://nyutaelite.com/bulk-order/qualities) | INSPECTION_PENDING_CREDENTIALS | 200 OK | INSPECTION_PENDING_CREDENTIALS | MATCH | Breadcrumb, Product/Article |
| [/learn/how-to-choose-good-quality-makhana](https://nyutaelite.com/learn/how-to-choose-good-quality-makhana) | INSPECTION_PENDING_CREDENTIALS | 200 OK | INSPECTION_PENDING_CREDENTIALS | MATCH | Breadcrumb, Product/Article |
| [/products/makhana?sku=premium-100g](https://nyutaelite.com/products/makhana?sku=premium-100g) | INSPECTION_PENDING_CREDENTIALS | 200 OK | INSPECTION_PENDING_CREDENTIALS | MATCH | Breadcrumb, Product/Article |
| [/products/makhana?sku=premium-200g](https://nyutaelite.com/products/makhana?sku=premium-200g) | INSPECTION_PENDING_CREDENTIALS | 200 OK | INSPECTION_PENDING_CREDENTIALS | MATCH | Breadcrumb, Product/Article |
| [/products/makhana?sku=premium-250g](https://nyutaelite.com/products/makhana?sku=premium-250g) | INSPECTION_PENDING_CREDENTIALS | 200 OK | INSPECTION_PENDING_CREDENTIALS | MATCH | Breadcrumb, Product/Article |
| [/products/makhana?sku=normal-100g](https://nyutaelite.com/products/makhana?sku=normal-100g) | INSPECTION_PENDING_CREDENTIALS | 200 OK | INSPECTION_PENDING_CREDENTIALS | MATCH | Breadcrumb, Product/Article |
| [/products/makhana?sku=normal-200g](https://nyutaelite.com/products/makhana?sku=normal-200g) | INSPECTION_PENDING_CREDENTIALS | 200 OK | INSPECTION_PENDING_CREDENTIALS | MATCH | Breadcrumb, Product/Article |
| [/products/makhana?sku=normal-250g](https://nyutaelite.com/products/makhana?sku=normal-250g) | INSPECTION_PENDING_CREDENTIALS | 200 OK | INSPECTION_PENDING_CREDENTIALS | MATCH | Breadcrumb, Product/Article |

## 4. Google Merchant Center Feed Alignment
* **Total Feed Products:** 6 (Expected: 6)
* **XML Syntax & Namespace:** VALID (xmlns:g declared)
| SKU | Title | Price | Availability | Weight | Matches Catalog |
|---|---|---|:---:|:---:|:---:|
| `NYM-PREM-100` | NYUTAELITE Premium Makhana – 100g Jumbo Fox Nuts | 160.00 INR | in_stock | 100 g | YES |
| `NYM-PREM-200` | NYUTAELITE Premium Makhana – 200g Jumbo Fox Nuts | 310.00 INR | in_stock | 200 g | YES |
| `NYM-PREM-250` | NYUTAELITE Premium Makhana – 250g Jumbo Fox Nuts | 380.00 INR | in_stock | 250 g | YES |
| `NYM-NORM-100` | NYUTAELITE Makhana – 100g Everyday Fox Nuts | 120.00 INR | in_stock | 100 g | YES |
| `NYM-NORM-200` | NYUTAELITE Makhana – 200g Everyday Fox Nuts | 230.00 INR | in_stock | 200 g | YES |
| `NYM-NORM-250` | NYUTAELITE Makhana – 250g Everyday Fox Nuts | 280.00 INR | in_stock | 250 g | YES |

## 5. Issue Tracking & Trend
* **New Issues Detected:** 14
* **Continuing Issues:** 0
* **Resolved Issues:** 0

### Newly Detected Issues:
- **[LOW]** `https://nyutaelite.com/products/makhana`: Sub-optimal title length: 78 characters (recommended 30-60)
- **[LOW]** `https://nyutaelite.com/learn/how-to-choose-good-quality-makhana`: Sub-optimal title length: 79 characters (recommended 30-60)
- **[LOW]** `https://nyutaelite.com/learn/how-to-choose-good-quality-makhana`: Sub-optimal meta description length: 166 characters (recommended 120-160)
- **[LOW]** `https://nyutaelite.com/products/makhana?sku=premium-100g`: Sub-optimal title length: 96 characters (recommended 30-60)
- **[LOW]** `https://nyutaelite.com/products/makhana?sku=premium-100g`: Sub-optimal meta description length: 191 characters (recommended 120-160)
- **[LOW]** `https://nyutaelite.com/products/makhana?sku=premium-200g`: Sub-optimal title length: 96 characters (recommended 30-60)
- **[LOW]** `https://nyutaelite.com/products/makhana?sku=premium-250g`: Sub-optimal title length: 96 characters (recommended 30-60)
- **[LOW]** `https://nyutaelite.com/products/makhana?sku=premium-250g`: Sub-optimal meta description length: 175 characters (recommended 120-160)
- **[LOW]** `https://nyutaelite.com/products/makhana?sku=normal-100g`: Sub-optimal title length: 96 characters (recommended 30-60)
- **[LOW]** `https://nyutaelite.com/products/makhana?sku=normal-100g`: Sub-optimal meta description length: 171 characters (recommended 120-160)
- **[LOW]** `https://nyutaelite.com/products/makhana?sku=normal-200g`: Sub-optimal title length: 96 characters (recommended 30-60)
- **[LOW]** `https://nyutaelite.com/products/makhana?sku=normal-200g`: Sub-optimal meta description length: 170 characters (recommended 120-160)
- **[LOW]** `https://nyutaelite.com/products/makhana?sku=normal-250g`: Sub-optimal title length: 96 characters (recommended 30-60)
- **[LOW]** `https://nyutaelite.com/products/makhana?sku=normal-250g`: Sub-optimal meta description length: 169 characters (recommended 120-160)

---
*Automated Report generated by NYUTAELITE SEO Engine. Confidential & Internal Use Only.*