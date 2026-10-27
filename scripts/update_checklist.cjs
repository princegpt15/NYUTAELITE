const fs = require('fs');
let c = fs.readFileSync('src/pages/About.tsx', 'utf8');
const isCrlf = c.includes('\r\n');
c = c.replace(/\r\n/g, '\n');

c = c.replace('1 Verified · 6 Pending Review', '1 Verified · 7 In Review');
c = c.replace('The remaining six operational parameters are awaiting final business owner decision to conclude complete policy formalization:', 'The remaining operational parameters reflect confirmed owner intent with formal ratification pending:');

const oldList = `                {[
                  {
                    num: '2',
                    title: '2. Return / Damage Reporting Window',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Formally choose whether customer transit-damage claims must be filed within 48 hours, 72 hours, or 5 days of delivery.',
                  },
                  {
                    num: '3',
                    title: '3. Delivery Estimate Baseline',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Confirm whether the 5–7 business days starts from the moment of order placement or from courier pickup.',
                  },
                  {
                    num: '4',
                    title: '4. Shipping Fee & Free Shipping Rule Confirmation',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Confirm whether the ₹40 standard fee and ₹499 free-shipping threshold are the permanent national baseline across all states.',
                  },
                  {
                    num: '5',
                    title: '5. Regional Service Exclusions',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Confirm whether specific PIN codes (e.g. island territories, specific Northeast remote zones) are excluded or subject to extended transit.',
                  },
                  {
                    num: '6',
                    title: '6. Cancellation Cut-off & Delivery Refusal Fee',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Confirm whether cancellations are strictly pre-dispatch, and whether customer doorstep refusals incur courier return deductions.',
                  },
                  {
                    num: '7',
                    title: '7. Statutory Grievance Redressal Officer Appointment',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Nominate the official name, email, and postal address of the Grievance Officer in compliance with Indian E-Commerce Rules.',
                  },
                ]`;

const newList = `                {[
                  {
                    num: '2',
                    title: '2. Return / Damage Reporting Window (48 Hours Intended)',
                    status: 'PROPOSED INTENT: 48 HOURS · RATIFICATION PENDING',
                    desc: 'Owner has confirmed intended 48-hour post-delivery window for transit-damage and broken seal reporting. Implemented with statutory consumer protection safeguard clause preserving legal remedies.',
                  },
                  {
                    num: '3',
                    title: '3. Delivery Timeline (1–2 Days Processing + 5–7 Days Transit)',
                    status: 'PROPOSED INTENT: ~6–9 DAYS TOTAL · RATIFICATION PENDING',
                    desc: 'Standardized across Shipping Policy, FAQ, Product Page, and Checkout. Order processing clearly separated from courier transit; confirmed as partner estimates, not guarantees.',
                  },
                  {
                    num: '4',
                    title: '4. Shipping Pricing Rule (₹40 Standard / Free at ₹499+)',
                    status: 'ACTIVE IN CODE & BACKEND · CONFIRMED BASELINE',
                    desc: 'Matches backend order.service.ts and frontend checkout calculation. Confirmed as active baseline rule; wholesale sack freight quoted separately.',
                  },
                  {
                    num: '5',
                    title: '5. Regional Service Exclusions & Remote PIN Codes',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Formal confirmation of any non-serviceable PIN codes (e.g. island territories or high-altitude remote regions) or courier special freight surcharges.',
                  },
                  {
                    num: '6',
                    title: '6. Doorstep Refusal Deductions & In-Transit Cancellations',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Confirm whether customer doorstep refusals of non-damaged parcels incur actual two-way return courier fee deductions.',
                  },
                  {
                    num: '7',
                    title: '7. Statutory Grievance Redressal Officer Designation',
                    status: 'PROPOSED: RAUSHAN KUMAR · RATIFICATION PENDING',
                    desc: 'Proposed by owner: Raushan Kumar, info@nutyaelite.com, Bhojpur registered office. Formal appointment resolution and permanent mailbox confirmation pending.',
                  },
                  {
                    num: '8',
                    title: '8. Legal Entity Constitution & Tax Registration Status',
                    status: 'OWNER CONFIRMATION REQUIRED',
                    desc: 'Confirmation of formal commercial entity structure (Sole Proprietorship, Partnership, or Pvt Ltd) and GST registration status if applicable.',
                  },
                ]`;

if (!c.includes(oldList)) {
  console.log('oldList not found in file!');
  process.exit(1);
}

c = c.replace(oldList, newList);
fs.writeFileSync('src/pages/About.tsx', isCrlf ? c.replace(/\n/g, '\r\n') : c, 'utf8');
console.log('Successfully updated checklist in src/pages/About.tsx');
