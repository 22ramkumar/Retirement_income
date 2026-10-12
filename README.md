# RetireWell - Fiduciary Annuity & Retirement Income Planning HTML Template

A modern, production-grade, ThemeForest / TemplateMonster-ready HTML5 template designed for independent fiduciary financial advisors, wealth management firms, annuity brokers, life insurance agencies, and retirement longevity planners.

---

## 🌟 Key Highlights

- **100% Pure Frontend**: Built with HTML5, Tailwind CSS, Vanilla ES6 JavaScript, Google Fonts, and Bootstrap Icons. No frameworks, Node.js runtime, PHP, or database servers required.
- **Client Fiduciary Portal (`user.html`)**:
  - **Overview**: Real-time asset overview (\$1.284M sample portfolio), projected monthly income, animated 88% readiness score ring, next review countdown, and activity timeline.
  - **Retirement Projections**: Dynamic Chart.js area/line projection graph with interactive sliders (Current Age, Retirement Age, Nest Egg, Monthly Savings, Return %, Desired Income). Includes Conservative, Expected, and Optimistic scenario tabs, target vs. projected income gap indicator, scenario saving to `localStorage`, and printable PDF-ready reporting.
  - **Accounts & Statements**: 4 account cards (Fixed Indexed Annuity with GLWB rider, Rollover Traditional IRA, Tax-Free Roth IRA, Deferred Longevity Annuity), searchable/filterable statement table, modal view with line-item breakdowns, and demo download engine.
  - **Beneficiary Management**: Primary and contingent beneficiary records with live 100% total allocation validation bar, Add/Edit/Delete modals, and audit reminder logs.
  - **Documents Vault**: Categorized encrypted vault with simulated upload engine and download triggers.
  - **Advisor Live Chat**: Direct messaging interface with assigned advisor David Vance, CFP®, with realistic instant advisor reply simulator.
  - **Profile & Settings**: Contact info updates, password change validation, and accessibility preferences.
- **Consultation Booking Engine**:
  - Accessible via every "Plan My Retirement" and "Book Consultation" button across all pages.
  - Prefills selected services or advisors automatically.
  - Generates unique reference code (`RW-2026-XXXX`), saves to `localStorage`, and adds confirmed appointment directly to the client dashboard.
- **Universal Accessibility & Theming**:
  - **Airy Light Mode & Curated Dark Navy Mode**: Not a simple color inversion; uses deep midnight blues (`#0A192F`, `#0E172E`) with high contrast text and custom borders.
  - **Font Size Scaler**: One-click text-size toggle (`A` 100% / `A+` 112% / `A++` 125%) stored in `localStorage` for senior legibility.
  - **RTL Support**: Full Right-to-Left Arabic/Hebrew layout flip via CSS logical properties.
  - **WCAG AA Compliance**: High contrast ratios, large touch targets (44px+), visible focus rings, and keyboard navigation.

---

## 🔐 Demo Client Login Credentials

The template includes seeded demo accounts stored automatically in browser `localStorage`:

| Role | Email Address | Password | Destination Page |
| :--- | :--- | :--- | :--- |
| **Demo Client** | `client@retirewell.com` | `Client@123` | `user.html` (Client Portal) |

*Quick Fill: The login page includes a single-click "One-Click Fill Demo Credentials" button for instant testing.*

---

## 📁 Directory Structure & File Map

```
retirewell/
├── index.html              # Home Page: Hero, Trust stats, Calculator, Solutions, Checklist, Advisors, FAQ
├── services.html           # Services: All 12 Annuity & Planning Services, Tabs, Comparison Matrix, Detail Modal
├── advisors.html           # Advisors: 6 Fiduciary Partner Profiles, Specialty Filters, Bio Modals, Direct Booking
├── login.html              # Authentication: Client Sign In, Registration, Password Recovery, 256-Bit Security
├── user.html               # Client Portal: Overview, Projections, Accounts, Beneficiaries, Documents, Chat
├── README.md               # Template Documentation & Guide
├── css/
│   └── style.css           # Custom Design Tokens, Dark Navy Theme, RTL Logical Properties, Print CSS
└── js/
    ├── config.js           # Centralized Photography Assets, Carrier Ratings, Brand Constants
    ├── data.js             # LocalStorage Database Engine (Seed Client, Accounts, Statements, Beneficiaries)
    ├── app.js              # Toast System, Theme Switcher, RTL Controller, Font Size Scaler, Modals, Booking
    ├── navbar.js           # Universal Sticky Header with Drawer Menu, Active States, and Auth Status
    ├── footer.js           # Universal Compliance Footer, Carrier Disclosures, Booking & Disclaimers Modals
    └── projections.js      # Mathematical Engine & Chart.js Integration for Retirement Cash Flow Projections
```

---

## 🚀 How to Run & Preview

1. Open the project folder in any code editor (e.g. VS Code).
2. Simply double-click `index.html` in your browser, or run a lightweight local static server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Or using Node.js
   npx serve
   ```
3. Navigate to `http://localhost:8000/index.html`.

---

## 🎨 Color Palette & Typography

- **Midnight Navy (Primary)**: `#0A192F`, `#172A45`, `#050C18`
- **Fiduciary Teal (Growth & Stability)**: `#0D9488`, `#0F766E`, `#14B8A6`
- **Refined Gold / Warm Amber (Accent)**: `#D97706`, `#B45309`, `#F59E0B`
- **Light Surfaces**: `#F8FAFC`, `#FFFFFF`, `#F1F5F9`
- **Dark Navy Surfaces**: `#070D1B`, `#0E172E`, `#131F3E`
- **Typography**: Headings use Google Font *Lora* (Serif), body text uses *Plus Jakarta Sans*.

---

## 📄 Compliance & Regulatory Notes

This template complies with SEC / FINRA / State Insurance Department formatting conventions:
- Prominent disclaimers explaining that annuity guarantees depend solely on the claims-paying ability of the issuing insurer.
- Form CRS (Customer Relationship Summary) modal and privacy policy triggers.
- Clear disclosures stating that calculators and projections are illustrative only.

---

© 2026 RetireWell Fiduciary Advisory LLC. Designed for ThemeForest & TemplateMonster.
