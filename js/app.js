/**
 * RetireWell Fiduciary Partners - Core Application & Global Controllers
 * Manages Toast System, Theme (Light / Dark Navy), RTL, Text-Scaling (A/A+/A++),
 * Modals, Consultation Booking Engine, and Counter Animations.
 */

const RetireWellApp = {
  // --------------------------------------------------------------------------
  // 1. Toast Notification System
  // --------------------------------------------------------------------------
  toast(message, type = "success", duration = 4000) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast-item toast-${type}`;

    let iconHtml = '<i class="bi bi-check-circle-fill text-emerald-600 text-lg"></i>';
    if (type === "error") iconHtml = '<i class="bi bi-exclamation-triangle-fill text-rose-600 text-lg"></i>';
    if (type === "info") iconHtml = '<i class="bi bi-info-circle-fill text-blue-600 text-lg"></i>';
    if (type === "warning") iconHtml = '<i class="bi bi-shield-exclamation text-amber-600 text-lg"></i>';

    toast.innerHTML = `
      <div class="flex-shrink-0">${iconHtml}</div>
      <div class="flex-1 text-sm font-medium leading-snug">${message}</div>
      <button class="text-xs opacity-50 hover:opacity-100 p-1 cursor-pointer transition" aria-label="Close" onclick="this.parentElement.remove()">
        <i class="bi bi-x-lg"></i>
      </button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // --------------------------------------------------------------------------
  // 2. Theme & Dark Navy Controller
  // --------------------------------------------------------------------------
  initTheme() {
    const savedTheme = localStorage.getItem("retirewell_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
    this.updateThemeIcons(savedTheme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("retirewell_theme", next);
    this.updateThemeIcons(next);
    this.toast(`${next === "dark" ? "Dark Navy Mode" : "Light Airy Mode"} activated`, "info", 2000);
  },

  updateThemeIcons(theme) {
    document.querySelectorAll(".theme-toggle-icon").forEach(icon => {
      icon.className = theme === "dark" ? "bi bi-sun-fill theme-toggle-icon text-amber-400" : "bi bi-moon-stars-fill theme-toggle-icon text-slate-700";
    });
  },

  // --------------------------------------------------------------------------
  // 3. Accessible Text-Scaling Controller (A / A+ / A++)
  // --------------------------------------------------------------------------
  initTextScale() {
    const savedScale = localStorage.getItem("retirewell_text_scale") || "normal";
    this.applyTextScale(savedScale, false);
  },

  cycleTextScale() {
    const scales = ["normal", "lg", "xl"];
    const current = localStorage.getItem("retirewell_text_scale") || "normal";
    const nextIdx = (scales.indexOf(current) + 1) % scales.length;
    const nextScale = scales[nextIdx];
    this.applyTextScale(nextScale, true);
  },

  applyTextScale(scale, notify = true) {
    const html = document.documentElement;
    html.classList.remove("text-scale-lg", "text-scale-xl");
    if (scale === "lg") html.classList.add("text-scale-lg");
    if (scale === "xl") html.classList.add("text-scale-xl");
    localStorage.setItem("retirewell_text_scale", scale);

    // Update label on buttons if any
    document.querySelectorAll(".text-scale-label").forEach(el => {
      if (scale === "normal") el.textContent = "A (100%)";
      if (scale === "lg") el.textContent = "A+ (112%)";
      if (scale === "xl") el.textContent = "A++ (125%)";
    });

    if (notify) {
      const label = scale === "normal" ? "Standard Size (100%)" : scale === "lg" ? "Large Sizing (112%)" : "Extra Large (125%)";
      this.toast(`Text scaling adjusted: ${label}`, "info", 1800);
    }
  },

  // --------------------------------------------------------------------------
  // 4. RTL Layout Controller
  // --------------------------------------------------------------------------
  initRTL() {
    const savedRTL = localStorage.getItem("retirewell_rtl") === "true";
    document.documentElement.setAttribute("dir", savedRTL ? "rtl" : "ltr");
    this.updateRTLButton(savedRTL);
  },

  toggleRTL() {
    const isRTL = document.documentElement.getAttribute("dir") === "rtl";
    const newRTL = !isRTL;
    document.documentElement.setAttribute("dir", newRTL ? "rtl" : "ltr");
    localStorage.setItem("retirewell_rtl", newRTL ? "true" : "false");
    this.updateRTLButton(newRTL);
    this.toast(`Layout changed to ${newRTL ? "Right-to-Left (RTL)" : "Left-to-Right (LTR)"}`, "info", 2000);
  },

  updateRTLButton(isRTL) {
    document.querySelectorAll(".rtl-toggle-btn").forEach(btn => {
      btn.setAttribute("title", isRTL ? "Switch to LTR" : "Switch to RTL");
    });
  },

  // --------------------------------------------------------------------------
  // 5. Global Modal Controller
  // --------------------------------------------------------------------------
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";
  },

  // --------------------------------------------------------------------------
  // 6. Consultation Booking Engine
  // --------------------------------------------------------------------------
  openBookingModal(preselectedTopic = "", preselectedAdvisor = "") {
    const modal = document.getElementById("bookingModal");
    if (!modal) {
      this.toast("Consultation booking system is loading...", "info");
      return;
    }

    // Prefill form if elements exist
    const topicSelect = document.getElementById("bookingTopic");
    if (topicSelect && preselectedTopic) {
      topicSelect.value = preselectedTopic;
    }

    const advisorSelect = document.getElementById("bookingAdvisor");
    if (advisorSelect && preselectedAdvisor) {
      advisorSelect.value = preselectedAdvisor;
    }

    // Set minimum date to tomorrow
    const dateInput = document.getElementById("bookingDate");
    if (dateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.min = tomorrow.toISOString().split("T")[0];
      if (!dateInput.value) {
        dateInput.value = tomorrow.toISOString().split("T")[0];
      }
    }

    // Reset view to form
    const formSection = document.getElementById("bookingFormSection");
    const successSection = document.getElementById("bookingSuccessSection");
    if (formSection && successSection) {
      formSection.classList.remove("hidden");
      successSection.classList.add("hidden");
    }

    this.openModal("bookingModal");
  },

  submitBooking(e) {
    if (e) e.preventDefault();

    const name = document.getElementById("bookingName")?.value.trim();
    const email = document.getElementById("bookingEmail")?.value.trim();
    const phone = document.getElementById("bookingPhone")?.value.trim();
    const topic = document.getElementById("bookingTopic")?.value;
    const advisor = document.getElementById("bookingAdvisor")?.value;
    const date = document.getElementById("bookingDate")?.value;
    const time = document.getElementById("bookingTime")?.value;
    const meetingType = document.getElementById("bookingMeetingType")?.value;
    const notes = document.getElementById("bookingNotes")?.value.trim() || "";

    if (!name || !email || !phone || !date || !time) {
      this.toast("Please fill in all required contact and schedule fields.", "error");
      return;
    }

    // Basic email check
    if (!/\S+@\S+\.\S+/.test(email)) {
      this.toast("Please provide a valid email address.", "error");
      return;
    }

    // Save to LocalStorage via DB engine
    const booking = window.RetireWellDB.addConsultation({
      clientName: name,
      email: email,
      phone: phone,
      topic: topic || "Retirement Income & Annuity Strategy",
      advisor: advisor || "David Vance, CFP®, RICP®",
      date: date,
      time: time,
      meetingType: meetingType || "Video Call (Secure Zoom)",
      notes: notes
    });

    // Show Confirmation View inside Modal
    const formSection = document.getElementById("bookingFormSection");
    const successSection = document.getElementById("bookingSuccessSection");
    const refCodeEl = document.getElementById("bookingRefCode");
    const summaryEl = document.getElementById("bookingSummaryText");

    if (refCodeEl) refCodeEl.textContent = booking.id;
    if (summaryEl) {
      summaryEl.textContent = `Confirmed for ${booking.date} at ${booking.time} (${booking.meetingType}) with ${booking.advisor}. A calendar invite was dispatched to ${booking.email}.`;
    }

    if (formSection && successSection) {
      formSection.classList.add("hidden");
      successSection.classList.remove("hidden");
    }

    this.toast(`Consultation Confirmed! Ref: ${booking.id}`, "success", 4500);

    // If on Dashboard, notify update
    if (typeof window.renderUpcomingMeeting === "function") {
      window.renderUpcomingMeeting();
    }
  },

  // --------------------------------------------------------------------------
  // 7. Disclaimers & Compliance Modal
  // --------------------------------------------------------------------------
  openDisclaimersModal() {
    this.openModal("disclaimersModal");
  },

  // --------------------------------------------------------------------------
  // 8. Statistics Counter Animation
  // --------------------------------------------------------------------------
  animateCounters() {
    const counters = document.querySelectorAll(".stat-counter");
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains("counted")) {
          entry.target.classList.add("counted");
          const target = parseFloat(entry.target.getAttribute("data-target")) || 0;
          const prefix = entry.target.getAttribute("data-prefix") || "";
          const suffix = entry.target.getAttribute("data-suffix") || "";
          const decimals = parseInt(entry.target.getAttribute("data-decimals")) || 0;
          let current = 0;
          const stepTime = 20;
          const totalSteps = 60;
          const increment = target / totalSteps;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            entry.target.textContent = prefix + (decimals > 0 ? current.toFixed(decimals) : Math.floor(current).toLocaleString()) + suffix;
          }, stepTime);
        }
      });
    }, { threshold: 0.3 });

    counters.forEach(c => observer.observe(c));
  },

  // --------------------------------------------------------------------------
  // 9. Global Init
  // --------------------------------------------------------------------------
  init() {
    this.initTheme();
    this.initTextScale();
    this.initRTL();
    this.animateCounters();

    // Global ESC key listener to close active modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".rw-modal-backdrop.active").forEach(m => {
          m.classList.remove("active");
        });
        document.body.style.overflow = "";
      }
    });

    // Close modal when clicking backdrop
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("rw-modal-backdrop")) {
        e.target.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }
};

// Auto-run on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  RetireWellApp.init();
});

if (typeof window !== "undefined") {
  window.RetireWellApp = RetireWellApp;
}
