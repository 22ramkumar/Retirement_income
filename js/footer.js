/**
 * RetireWell Fiduciary Advisory - Universal Compliance Footer & Global Modals
 * Automatically mounts the compliance footer, SEC/FINRA regulatory disclosures,
 * and global modals (Booking Consultation Modal + Full Legal Disclaimers Modal).
 */

document.addEventListener("DOMContentLoaded", () => {
  const mountEl = document.getElementById("footer");
  if (!mountEl) return;

  mountEl.innerHTML = `
    <!-- Global Compliance Footer -->
    <footer class="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          <!-- Column 1: Fiduciary Brand & Contact -->
          <div class="lg:col-span-2 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                <i class="bi bi-shield-lock-fill"></i>
              </div>
              <span class="font-serif font-bold text-2xl text-white tracking-tight">Retire<span class="text-teal-400">Well</span></span>
            </div>
            <p class="text-sm text-slate-400 leading-relaxed max-w-sm">
              An independent fiduciary wealth advisory and institutional annuity brokerage. Dedicated exclusively to safeguarding hard-earned capital and creating guaranteed lifetime retirement income.
            </p>
            <div class="pt-2 space-y-2 text-xs text-slate-400">
              <p class="flex items-center gap-2"><i class="bi bi-geo-alt-fill text-teal-400"></i> One Financial Center, 34th Floor, Boston, MA 02111</p>
              <p class="flex items-center gap-2"><i class="bi bi-telephone-fill text-teal-400"></i> Fiduciary Desk: (800) 584-9210</p>
              <p class="flex items-center gap-2"><i class="bi bi-envelope-fill text-teal-400"></i> advisory@retirewell.com</p>
            </div>
          </div>

          <!-- Column 2: Annuity Solutions -->
          <div>
            <h4 class="text-sm font-bold uppercase tracking-wider text-white mb-4">Annuity Solutions</h4>
            <ul class="space-y-2.5 text-sm text-slate-400">
              <li><a href="services.html#fixed" class="hover:text-teal-400 transition">Fixed Multi-Year (MYGA)</a></li>
              <li><a href="services.html#indexed" class="hover:text-teal-400 transition">Fixed Indexed (FIA)</a></li>
              <li><a href="services.html#immediate" class="hover:text-teal-400 transition">Immediate Income (SPIA)</a></li>
              <li><a href="services.html#deferred" class="hover:text-teal-400 transition">Deferred Longevity (DIA)</a></li>
              <li><a href="services.html#riders" class="hover:text-teal-400 transition">Lifetime Income Riders</a></li>
              <li><a href="services.html#compare" class="hover:text-teal-400 transition">Compare All 4 Types</a></li>
            </ul>
          </div>

          <!-- Column 3: Fiduciary Planning -->
          <div>
            <h4 class="text-sm font-bold uppercase tracking-wider text-white mb-4">Retirement Planning</h4>
            <ul class="space-y-2.5 text-sm text-slate-400">
              <li><a href="services.html#rollover" class="hover:text-teal-400 transition">401(k) / IRA Rollovers</a></li>
              <li><a href="services.html#socialsecurity" class="hover:text-teal-400 transition">Social Security Timing</a></li>
              <li><a href="services.html#legacy" class="hover:text-teal-400 transition">Legacy & Beneficiaries</a></li>
              <li><a href="services.html#longtermcare" class="hover:text-teal-400 transition">Asset-Based Long Term Care</a></li>
              <li><a href="advisors.html" class="hover:text-teal-400 transition">Our Fiduciary Advisors</a></li>
              <li><a href="user.html" class="hover:text-teal-400 transition">Client Portal Dashboard</a></li>
            </ul>
          </div>

          <!-- Column 4: Institutional Trust & Security -->
          <div>
            <h4 class="text-sm font-bold uppercase tracking-wider text-white mb-4">Fiduciary Security</h4>
            <div class="space-y-3 text-xs text-slate-400">
              <div class="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
                <i class="bi bi-shield-check text-2xl text-teal-400 flex-shrink-0"></i>
                <span>100% Fiduciary Standard. Legally bound to put your interests first.</span>
              </div>
              <div class="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
                <i class="bi bi-patch-check-fill text-2xl text-amber-400 flex-shrink-0"></i>
                <span>Carrier Rating Minimum: A.M. Best 'A' (Excellent) or higher.</span>
              </div>
              <button onclick="RetireWellApp.openDisclaimersModal()" class="text-teal-400 hover:text-teal-300 font-semibold underline text-xs">
                View Full Regulatory Disclosures →
              </button>
            </div>
          </div>

        </div>

        <!-- Compliance & Regulatory Disclaimers Body -->
        <div class="pt-8 text-xs text-slate-500 leading-relaxed space-y-3">
          <p>
            <strong class="text-slate-400">Regulatory & Annuity Guarantee Notice:</strong> Annuities are long-term insurance contracts designed for retirement savings and guaranteed income. Annuity guarantees and principal protections are backed solely by the financial strength and claims-paying ability of the issuing insurance carrier. They are not FDIC-insured, not bank-guaranteed, and may be subject to surrender charges, market value adjustments, and a 10% IRS penalty if withdrawn prior to age 59½.
          </p>
          <p>
            <strong class="text-slate-400">Fiduciary Advisory Disclaimer:</strong> Advisory services provided through RetireWell Advisory Group, an SEC-registered investment adviser. Registration does not imply a certain level of skill or training. Past performance does not guarantee future results. Projections, calculators, and illustrations are hypothetical and intended solely for educational illustration.
          </p>
        </div>

        <!-- Bottom Copyright & Links -->
        <div class="pt-8 mt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 RetireWell Fiduciary Partners LLC. All rights reserved. Member FINRA / SIPC.</p>
          <div class="flex items-center gap-6">
            <button onclick="RetireWellApp.openDisclaimersModal()" class="hover:text-white transition">Form CRS (Customer Relationship)</button>
            <button onclick="RetireWellApp.openDisclaimersModal()" class="hover:text-white transition">Privacy & 256-Bit Security</button>
            <button onclick="RetireWellApp.openDisclaimersModal()" class="hover:text-white transition">Terms of Advisory</button>
          </div>
        </div>

      </div>
    </footer>

    <!-- =========================================================================
         GLOBAL MODAL 1: CONSULTATION BOOKING MODAL
         ========================================================================= -->
    <div id="bookingModal" class="rw-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="bookingModalTitle">
      <div class="rw-modal-dialog">
        
        <!-- Modal Header -->
        <div class="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-navy-950/50 rounded-t-2xl">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/20">
              <i class="bi bi-calendar2-week"></i>
            </div>
            <div>
              <h3 id="bookingModalTitle" class="text-lg font-bold font-serif text-slate-900 dark:text-white">Schedule Fiduciary Consultation</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Complimentary 45-minute retirement income & annuity blueprint</p>
            </div>
          </div>
          <button onclick="RetireWellApp.closeModal('bookingModal')" class="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition" aria-label="Close dialog">
            <i class="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        <!-- Form Section -->
        <div id="bookingFormSection" class="p-6">
          <form onsubmit="RetireWellApp.submitBooking(event)" class="space-y-4">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="bookingName" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Full Name *</label>
                <input type="text" id="bookingName" required class="rw-input" placeholder="e.g. Margaret & Robert Vance">
              </div>
              <div>
                <label for="bookingPhone" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Phone Number *</label>
                <input type="tel" id="bookingPhone" required class="rw-input" placeholder="(617) 555-0199">
              </div>
            </div>

            <div>
              <label for="bookingEmail" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Email Address *</label>
              <input type="email" id="bookingEmail" required class="rw-input" placeholder="client@example.com">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="bookingTopic" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Advisory Topic *</label>
                <select id="bookingTopic" class="rw-input cursor-pointer">
                  <option value="Comprehensive Retirement Income Plan">Comprehensive Income Plan</option>
                  <option value="Fixed & Indexed Annuity Guidance">Fixed & Indexed Annuities</option>
                  <option value="401(k) / IRA Fiduciary Rollover">401(k) / IRA Rollover Review</option>
                  <option value="Immediate Payout (SPIA/DIA) Longevity">Immediate / Deferred Annuities</option>
                  <option value="Social Security Timing & Optimization">Social Security Timing</option>
                  <option value="Legacy & Beneficiary Structure">Legacy & Beneficiary Protection</option>
                </select>
              </div>
              <div>
                <label for="bookingAdvisor" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Preferred Advisor</label>
                <select id="bookingAdvisor" class="rw-input cursor-pointer">
                  <option value="David Vance, CFP®, RICP®">David Vance, CFP®, RICP® (Managing Partner)</option>
                  <option value="Elena Rostova, ChFC®, CLU®">Elena Rostova, ChFC® (Annuity Strategist)</option>
                  <option value="Marcus Sterling, CFA, CFP®">Marcus Sterling, CFA (Portfolio Director)</option>
                  <option value="Sarah Jenkins, CFP®, RICP®">Sarah Jenkins, CFP® (Rollover Specialist)</option>
                  <option value="Dr. Miriam Patel, Ph.D., CFP®">Dr. Miriam Patel, CFP® (Longevity Economics)</option>
                  <option value="First Available Senior Fiduciary">First Available Senior Fiduciary</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label for="bookingDate" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Date *</label>
                <input type="date" id="bookingDate" required class="rw-input cursor-pointer">
              </div>
              <div>
                <label for="bookingTime" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Preferred Time *</label>
                <select id="bookingTime" class="rw-input cursor-pointer">
                  <option value="09:30 AM EST">09:30 AM EST</option>
                  <option value="11:00 AM EST">11:00 AM EST</option>
                  <option value="02:00 PM EST" selected>02:00 PM EST</option>
                  <option value="04:00 PM EST">04:00 PM EST</option>
                </select>
              </div>
              <div>
                <label for="bookingMeetingType" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Meeting Format</label>
                <select id="bookingMeetingType" class="rw-input cursor-pointer">
                  <option value="Video Call (Secure Zoom)">Video (Zoom / Teams)</option>
                  <option value="Direct Phone Call">Direct Phone Call</option>
                  <option value="In-Person (Boston Office)">In-Person (Boston HQ)</option>
                </select>
              </div>
            </div>

            <div>
              <label for="bookingNotes" class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">Retirement Goals / Questions (Optional)</label>
              <textarea id="bookingNotes" rows="2" class="rw-input" placeholder="e.g. Planning to retire in 4 years, want to lock in a guaranteed $5,000/mo income floor..."></textarea>
            </div>

            <div class="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-500/20 text-xs text-teal-800 dark:text-teal-300 flex items-start gap-2">
              <i class="bi bi-shield-check text-base text-teal-600 flex-shrink-0 mt-0.5"></i>
              <span><strong>Fiduciary Oath:</strong> No sales pressure, no proprietary quotas. You receive an objective, mathematical analysis of carrier options.</span>
            </div>

            <div class="pt-2 flex items-center justify-end gap-3">
              <button type="button" onclick="RetireWellApp.closeModal('bookingModal')" class="btn-outline-navy py-2.5 px-4 text-xs">
                Cancel
              </button>
              <button type="submit" class="btn-primary-gold py-2.5 px-6 text-xs uppercase tracking-wider font-bold">
                <i class="bi bi-check2-circle text-base"></i> Confirm Reservation
              </button>
            </div>

          </form>
        </div>

        <!-- Success Section (Displayed after form submit) -->
        <div id="bookingSuccessSection" class="p-8 text-center space-y-4 hidden">
          <div class="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-inner">
            <i class="bi bi-check-lg"></i>
          </div>
          <h4 class="text-xl font-bold font-serif text-slate-900 dark:text-white">Consultation Confirmed</h4>
          <p class="text-xs text-slate-500 uppercase tracking-widest font-mono">Reference Code: <span id="bookingRefCode" class="font-bold text-teal-600 dark:text-teal-400">RW-2026-8824</span></p>
          <p id="bookingSummaryText" class="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            Your appointment has been registered in the Fiduciary System. A secure calendar invite and preparatory checklist have been dispatched to your email.
          </p>
          <div class="pt-4 flex items-center justify-center gap-3">
            <a href="user.html" class="btn-secondary-teal text-xs py-2.5 px-5">
              <i class="bi bi-speedometer2"></i> View in Client Dashboard
            </a>
            <button onclick="RetireWellApp.closeModal('bookingModal')" class="btn-outline-navy text-xs py-2.5 px-5">
              Done
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- =========================================================================
         GLOBAL MODAL 2: LEGAL & REGULATORY DISCLAIMERS
         ========================================================================= -->
    <div id="disclaimersModal" class="rw-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="disclaimersModalTitle">
      <div class="rw-modal-dialog max-w-2xl">
        <div class="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-navy-950/50 rounded-t-2xl">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-lg">
              <i class="bi bi-file-earmark-lock2-fill"></i>
            </div>
            <div>
              <h3 id="disclaimersModalTitle" class="text-lg font-bold font-serif text-slate-900 dark:text-white">Fiduciary & Regulatory Disclosures</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">SEC Registered Investment Adviser & National Carrier Brokerage</p>
            </div>
          </div>
          <button onclick="RetireWellApp.closeModal('disclaimersModal')" class="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition" aria-label="Close dialog">
            <i class="bi bi-x-lg text-lg"></i>
          </button>
        </div>

        <div class="p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto">
          <div>
            <h5 class="text-sm font-bold text-slate-900 dark:text-white mb-1">1. Fiduciary Standard of Care</h5>
            <p>RetireWell Advisory Group LLC operates under the Investment Advisers Act of 1940 as a Registered Investment Adviser (RIA). We owe a legal and ethical fiduciary duty to each client to act solely in their best interests, to disclose all material conflicts, and to maintain transparent compensation.</p>
          </div>

          <div>
            <h5 class="text-sm font-bold text-slate-900 dark:text-white mb-1">2. Nature of Annuity Contracts & Guarantees</h5>
            <p>Annuities are contracts between an individual and a licensed life insurance carrier. All income guarantees, death benefits, principal protection riders, and index floor promises are backed strictly by the financial strength and claims-paying ability of the issuing insurer. Guarantees are not insured by the FDIC, SIPC, or any federal agency.</p>
          </div>

          <div>
            <h5 class="text-sm font-bold text-slate-900 dark:text-white mb-1">3. Surrender Charges & Tax Considerations</h5>
            <p>Early withdrawals prior to age 59½ may trigger a 10% federal penalty tax in addition to standard income taxes. Annuity products often feature surrender charge schedules during early contract years. Clients must preserve adequate liquid cash reserves outside of fixed annuities for emergency needs.</p>
          </div>

          <div>
            <h5 class="text-sm font-bold text-slate-900 dark:text-white mb-1">4. Hypothetical Projections & Calculators</h5>
            <p>All projection tools, charts, Monte Carlo simulations, and retirement calculators rendered across this website and dashboard are purely illustrative. They do not constitute a forecast or guarantee of future investment return or insurer crediting rates.</p>
          </div>

          <div>
            <h5 class="text-sm font-bold text-slate-900 dark:text-white mb-1">5. 256-Bit Cryptographic Data Protection</h5>
            <p>All client credentials, account records, and beneficiary designations transmitted to or stored in RetireWell systems are protected via TLS 1.3 encryption and AES-256 vault standards. Demo sessions are safely contained within the local browser sandbox.</p>
          </div>
        </div>

        <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950/50 flex justify-end rounded-b-2xl">
          <button onclick="RetireWellApp.closeModal('disclaimersModal')" class="btn-primary-gold py-2 px-5 text-xs">
            I Understand & Acknowledge
          </button>
        </div>
      </div>
    </div>
  `;
});
