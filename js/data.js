/**
 * RetireWell Fiduciary Advisory - LocalStorage Data Engine
 * Pre-populates realistic sample data for a 58-year-old client (Robert Vance)
 * with a multi-account retirement structure ($1.284M total assets).
 */

const SEED_DATA = {
  // Demo client profile
  user: {
    id: "usr_882910",
    name: "Robert Vance",
    email: "user@gmail.com",
    password: "1234",
    phone: "(617) 492-8820",
    currentAge: 58,
    targetRetirementAge: 63,
    address: "74 Beacon Hill Terrace, Boston, MA 02108",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
    riskProfile: "Moderate Capital Preservation",
    assignedAdvisor: {
      name: "David Vance, CFP®, RICP®",
      title: "Senior Fiduciary Partner & Longevity Strategist",
      email: "david.vance@retirewell.com",
      phone: "(800) 584-9210 ext 104",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80"
    },
    readinessScore: 88,
    monthlyExpenseTarget: 6500,
    projectedMonthlyIncome: 6850,
    guaranteedFloorIncome: 4800,
    nextReviewDate: "2026-10-24T14:00:00"
  },

  // Client's diverse retirement portfolios
  accounts: [
    {
      id: "ACC-FIA-8921",
      name: "Pacific Horizon Capital Shield",
      type: "Fixed Indexed Annuity (FIA)",
      carrier: "Pacific Horizon Life",
      policyNumber: "PHA-892144",
      balance: 540000,
      annualYield: "6.75% Index Cap",
      surrenderPeriod: "Year 7 of 10",
      guaranteeFeature: "Lifetime Income Rider (GLWB) - $3,250/mo guaranteed at age 63",
      status: "Active & Accumulating",
      startDate: "2021-04-15",
      taxStatus: "Non-Qualified Tax-Deferred"
    },
    {
      id: "ACC-IRA-3310",
      name: "Fiduciary Rollover Traditional IRA",
      type: "Traditional IRA (Rollover)",
      carrier: "Charles Schwab Institutional",
      policyNumber: "SCH-331089",
      balance: 485000,
      annualYield: "5.80% Balanced Fiduciary Yield",
      surrenderPeriod: "Fully Liquid (No penalties)",
      guaranteeFeature: "Dividend & Short-Duration Treasury Preservation",
      status: "Active & Rebalancing",
      startDate: "2019-11-01",
      taxStatus: "Pre-Tax Traditional IRA"
    },
    {
      id: "ACC-ROTH-9023",
      name: "Tax-Free Roth Horizon Portfolio",
      type: "Roth IRA",
      carrier: "Charles Schwab Institutional",
      policyNumber: "SCH-902341",
      balance: 142500,
      annualYield: "7.10% Dividend Aristocrats",
      surrenderPeriod: "Fully Liquid",
      guaranteeFeature: "100% Tax-Free Qualified Retirement Distributions",
      status: "Active",
      startDate: "2018-02-10",
      taxStatus: "Roth (Post-Tax / Tax-Free)"
    },
    {
      id: "ACC-DIA-7729",
      name: "Summit Mutual Longevity Bridge",
      type: "Deferred Income Annuity (DIA)",
      carrier: "Summit Mutual Life",
      policyNumber: "SM-772910",
      balance: 117000,
      annualYield: "Guaranteed Payout Rate 8.4%",
      surrenderPeriod: "Irrevocable Longevity Lock",
      guaranteeFeature: "Guaranteed $2,800/mo payout starting at age 75 for lifetime",
      status: "Deferred Accumulation",
      startDate: "2022-08-20",
      taxStatus: "Tax-Deferred Longevity Asset"
    }
  ],

  // Historical formal statements
  statements: [
    {
      id: "STM-2026-Q3",
      accountId: "ACC-FIA-8921",
      accountName: "Pacific Horizon Capital Shield FIA",
      period: "Q3 2026 (Jul 1 - Sep 30)",
      statementDate: "2026-10-01",
      type: "Quarterly Indexed Annuity Statement",
      startingBalance: 531200,
      credits: 10400,
      fees: -1600,
      endingBalance: 540000,
      guaranteedValue: 512000,
      surrenderValue: 536400,
      downloadUrl: "#statement-q3-2026"
    },
    {
      id: "STM-2026-Q2",
      accountId: "ACC-IRA-3310",
      accountName: "Fiduciary Rollover Traditional IRA",
      period: "Q2 2026 (Apr 1 - Jun 30)",
      statementDate: "2026-07-01",
      type: "Quarterly Fiduciary Portfolio Report",
      startingBalance: 476800,
      credits: 9800,
      fees: -1600,
      endingBalance: 485000,
      guaranteedValue: 485000,
      surrenderValue: 485000,
      downloadUrl: "#statement-q2-2026"
    },
    {
      id: "STM-2026-Q1",
      accountId: "ACC-ROTH-9023",
      accountName: "Tax-Free Roth Horizon Portfolio",
      period: "Q1 2026 (Jan 1 - Mar 31)",
      statementDate: "2026-04-01",
      type: "Quarterly Asset Valuation",
      startingBalance: 139100,
      credits: 3700,
      fees: -300,
      endingBalance: 142500,
      guaranteedValue: 142500,
      surrenderValue: 142500,
      downloadUrl: "#statement-q1-2026"
    },
    {
      id: "STM-2025-ANN",
      accountId: "ALL",
      accountName: "Consolidated Fiduciary Annual Package",
      period: "Full Year 2025",
      statementDate: "2026-01-15",
      type: "Annual Tax Form 1099-R & Performance Review",
      startingBalance: 1195000,
      credits: 94500,
      fees: -5000,
      endingBalance: 1284500,
      guaranteedValue: 1210000,
      surrenderValue: 1270000,
      downloadUrl: "#statement-ann-2025"
    }
  ],

  // Beneficiaries structure (Primary 100%, Contingent 100%)
  beneficiaries: [
    {
      id: "BEN-01",
      name: "Margaret Vance",
      relation: "Spouse",
      type: "Primary",
      share: 70,
      dob: "1968-04-12",
      phone: "(617) 492-8821",
      email: "margaret.vance@gmail.com",
      accountsLinked: ["All Accounts (FIA, IRA, Roth, DIA)"]
    },
    {
      id: "BEN-02",
      name: "Jonathan Vance",
      relation: "Adult Child",
      type: "Primary",
      share: 30,
      dob: "1995-09-22",
      phone: "(617) 510-4491",
      email: "jonathan.vance@alumni.harvard.edu",
      accountsLinked: ["All Accounts (FIA, IRA, Roth, DIA)"]
    },
    {
      id: "BEN-03",
      name: "Vance Family Irrevocable Living Trust",
      relation: "Trust / Estate",
      type: "Contingent",
      share: 60,
      dob: "Established 2017",
      phone: "(617) 492-8820",
      email: "trustee@vancefamilylaw.com",
      accountsLinked: ["All Accounts"]
    },
    {
      id: "BEN-04",
      name: "St. Jude Children's Research Hospital",
      relation: "Charitable Endowment",
      type: "Contingent",
      share: 40,
      dob: "501(c)(3) Org",
      phone: "(800) 822-6344",
      email: "donor.relations@stjude.org",
      accountsLinked: ["All Accounts"]
    }
  ],

  // Client Documents Vault
  documents: [
    {
      id: "DOC-882",
      title: "Pacific Horizon Fixed Indexed Annuity Contract & Rider Policy",
      category: "Policy Contracts",
      account: "Pacific Horizon FIA #PHA-892144",
      size: "3.4 MB",
      dateAdded: "2021-04-18",
      format: "PDF"
    },
    {
      id: "DOC-883",
      title: "2026 Annual Fiduciary Longevity & Monte Carlo Analysis",
      category: "Advisory Plans",
      account: "All Consolidated Assets",
      size: "5.1 MB",
      dateAdded: "2026-01-20",
      format: "PDF"
    },
    {
      id: "DOC-884",
      title: "IRS Form 1099-R & Tax Reporting Summary (2025)",
      category: "Tax Documents",
      account: "Charles Schwab Institutional IRA",
      size: "1.2 MB",
      dateAdded: "2026-02-05",
      format: "PDF"
    },
    {
      id: "DOC-885",
      title: "Beneficiary Designations & Notarized Acceptance Affidavit",
      category: "Legal & Beneficiary",
      account: "Consolidated Estate",
      size: "2.8 MB",
      dateAdded: "2024-11-12",
      format: "PDF"
    }
  ],

  // Advisor Chat Conversation
  messages: [
    {
      id: "MSG-01",
      sender: "David Vance, CFP®",
      isAdvisor: true,
      time: "Yesterday, 3:15 PM",
      text: "Hello Robert, I reviewed your Q3 index crediting on the Pacific Horizon FIA. You locked in an impressive 6.75% cap with zero downside exposure during the recent market fluctuation."
    },
    {
      id: "MSG-02",
      sender: "Robert Vance",
      isAdvisor: false,
      time: "Yesterday, 4:20 PM",
      text: "That is fantastic news, David. Margaret and I were curious if we should accelerate our 401(k) rollover bridge before our target age 63."
    },
    {
      id: "MSG-03",
      sender: "David Vance, CFP®",
      isAdvisor: true,
      time: "Today, 9:45 AM",
      text: "I have prepared a side-by-side Monte Carlo comparison. We will walk through it during our scheduled video review on Oct 24th at 2:00 PM. Rest assured, your guaranteed lifetime floor of $4,800/mo remains 100% safeguarded."
    }
  ],

  // Notifications
  notifications: [
    {
      id: "NOTIF-01",
      title: "Upcoming Fiduciary Review",
      body: "Video strategy session confirmed with David Vance, CFP® on Oct 24, 2026 at 2:00 PM EST.",
      time: "2 hours ago",
      read: false,
      icon: "bi-calendar-check",
      color: "text-blue-600"
    },
    {
      id: "NOTIF-02",
      title: "Q3 2026 Statement Ready",
      body: "Your quarterly statement for Pacific Horizon Capital Shield FIA is available for download.",
      time: "1 day ago",
      read: false,
      icon: "bi-file-earmark-text",
      color: "text-emerald-600"
    },
    {
      id: "NOTIF-03",
      title: "Annual Beneficiary Audit Due",
      body: "We recommend reviewing your 70/30 primary allocation before year-end.",
      time: "3 days ago",
      read: true,
      icon: "bi-shield-check",
      color: "text-amber-600"
    }
  ],

  // Projection Scenarios Saved
  scenarios: [
    {
      id: "SCN-01",
      title: "Current Baseline (Age 63 Retirement)",
      retirementAge: 63,
      currentAge: 58,
      monthlyContribution: 1500,
      annualReturn: 6.5,
      inflation: 2.5,
      desiredMonthlyIncome: 6500,
      socialSecurityAge: 67,
      projectedMonthlyIncome: 6850,
      guaranteedFloor: 4800,
      totalPotAtRetirement: 1640000,
      createdDate: "2026-09-15"
    },
    {
      id: "SCN-02",
      title: "Early Horizon Bridge (Age 61.5 Retirement)",
      retirementAge: 61.5,
      currentAge: 58,
      monthlyContribution: 2500,
      annualReturn: 6.0,
      inflation: 2.8,
      desiredMonthlyIncome: 7000,
      socialSecurityAge: 68,
      projectedMonthlyIncome: 6320,
      guaranteedFloor: 4500,
      totalPotAtRetirement: 1495000,
      createdDate: "2026-10-02"
    }
  ],

  // Consultations booked
  consultations: [
    {
      id: "RW-2026-8824",
      clientName: "Robert Vance",
      email: "user@gmail.com",
      phone: "(617) 492-8820",
      advisor: "David Vance, CFP®, RICP®",
      topic: "Fiduciary Longevity & 401(k) Rollover Bridge",
      date: "2026-10-24",
      time: "14:00",
      meetingType: "Video Call (Secure Zoom)",
      status: "Confirmed",
      notes: "Review Q3 FIA credit cap and examine tax-free Roth laddering."
    }
  ]
};

// LocalStorage Manager Functions
const RetireWellDB = {
  init() {
    if (!localStorage.getItem("retirewell_initialized")) {
      localStorage.setItem("retirewell_user", JSON.stringify(SEED_DATA.user));
      localStorage.setItem("retirewell_accounts", JSON.stringify(SEED_DATA.accounts));
      localStorage.setItem("retirewell_statements", JSON.stringify(SEED_DATA.statements));
      localStorage.setItem("retirewell_beneficiaries", JSON.stringify(SEED_DATA.beneficiaries));
      localStorage.setItem("retirewell_documents", JSON.stringify(SEED_DATA.documents));
      localStorage.setItem("retirewell_messages", JSON.stringify(SEED_DATA.messages));
      localStorage.setItem("retirewell_notifications", JSON.stringify(SEED_DATA.notifications));
      localStorage.setItem("retirewell_scenarios", JSON.stringify(SEED_DATA.scenarios));
      localStorage.setItem("retirewell_consultations", JSON.stringify(SEED_DATA.consultations));
      localStorage.setItem("retirewell_session", JSON.stringify({ isLoggedIn: true, user: SEED_DATA.user }));
      localStorage.setItem("retirewell_initialized", "true");
    } else {
      // Migrate legacy demo credentials to new default user@gmail.com / 1234
      const existingUser = this.get("user");
      if (existingUser && (existingUser.email === "client@retirewell.com" || !existingUser.email)) {
        existingUser.email = "user@gmail.com";
        existingUser.password = "1234";
        this.set("user", existingUser);
        const session = this.get("session");
        if (session && session.user && session.user.email === "client@retirewell.com") {
          session.user.email = "user@gmail.com";
          session.user.password = "1234";
          this.set("session", session);
        }
      }
    }
  },

  get(key) {
    const raw = localStorage.getItem(`retirewell_${key}`);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  set(key, val) {
    localStorage.setItem(`retirewell_${key}`, JSON.stringify(val));
  },

  // Auth helper
  getSession() {
    const session = this.get("session");
    return session && session.isLoggedIn ? session : null;
  },

  login(email, password) {
    const storedUser = this.get("user") || SEED_DATA.user;
    const cleanEmail = (email || "").trim().toLowerCase();
    const isDefault = (cleanEmail === "user@gmail.com" && password === "1234");
    const isStored = (cleanEmail === (storedUser.email || "").toLowerCase() && password === storedUser.password);

    if (isDefault || isStored) {
      if (isDefault && storedUser.email !== "user@gmail.com") {
        storedUser.email = "user@gmail.com";
        storedUser.password = "1234";
        this.set("user", storedUser);
      }
      const session = { isLoggedIn: true, user: storedUser };
      this.set("session", session);
      return { success: true, user: storedUser };
    }
    return { success: false, message: "Invalid email or password. Please verify your credentials and try again." };
  },

  register(userData) {
    const newUser = {
      ...SEED_DATA.user,
      id: "usr_" + Math.floor(100000 + Math.random() * 900000),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phone: userData.phone || "(617) 555-0199",
      targetRetirementAge: parseInt(userData.targetAge) || 65
    };
    this.set("user", newUser);
    this.set("session", { isLoggedIn: true, user: newUser });
    return { success: true, user: newUser };
  },

  logout() {
    this.set("session", { isLoggedIn: false, user: null });
  },

  // Consultation booking
  addConsultation(booking) {
    const list = this.get("consultations") || [];
    const newBooking = {
      id: "RW-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000),
      status: "Confirmed",
      createdDate: new Date().toISOString(),
      ...booking
    };
    list.unshift(newBooking);
    this.set("consultations", list);

    // Also inject notification
    const notifs = this.get("notifications") || [];
    notifs.unshift({
      id: "NOTIF-" + Date.now(),
      title: "Consultation Booked: " + newBooking.id,
      body: `Review scheduled with ${newBooking.advisor || 'Fiduciary Specialist'} on ${newBooking.date} at ${newBooking.time}.`,
      time: "Just now",
      read: false,
      icon: "bi-calendar-check",
      color: "text-blue-600"
    });
    this.set("notifications", notifs);

    return newBooking;
  },

  // Beneficiary management with validation
  saveBeneficiaries(beneficiaries) {
    this.set("beneficiaries", beneficiaries);
    // Add pending confirmation notice
    const notifs = this.get("notifications") || [];
    notifs.unshift({
      id: "NOTIF-" + Date.now(),
      title: "Beneficiary Allocation Updated",
      body: "Your primary and contingent allocations were updated and recorded in your vault.",
      time: "Just now",
      read: false,
      icon: "bi-shield-check",
      color: "text-emerald-600"
    });
    this.set("notifications", notifs);
  },

  // Messages management
  addMessage(text, isAdvisor = false) {
    const messages = this.get("messages") || [];
    const user = this.get("user") || SEED_DATA.user;
    const msg = {
      id: "MSG-" + Date.now(),
      sender: isAdvisor ? user.assignedAdvisor.name : user.name,
      isAdvisor: isAdvisor,
      time: "Just now",
      text: text
    };
    messages.push(msg);
    this.set("messages", messages);
    return msg;
  },

  // Scenarios management
  saveScenario(scenario) {
    const scenarios = this.get("scenarios") || [];
    const newScn = {
      id: "SCN-" + Date.now(),
      createdDate: new Date().toISOString().split("T")[0],
      ...scenario
    };
    scenarios.unshift(newScn);
    this.set("scenarios", scenarios);
    return newScn;
  },

  deleteScenario(id) {
    let scenarios = this.get("scenarios") || [];
    scenarios = scenarios.filter(s => s.id !== id);
    this.set("scenarios", scenarios);
    return scenarios;
  }
};

// Initialize DB immediately on script load
RetireWellDB.init();

if (typeof window !== "undefined") {
  window.RetireWellDB = RetireWellDB;
}
