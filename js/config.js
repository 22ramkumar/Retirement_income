/**
 * RetireWell Fiduciary Advisory - Central Configuration & Assets Map
 * All images are high-resolution, royalty-free photography curated for senior retirement,
 * fiduciary wealth advisory, and client peace-of-mind.
 */

const RETIREWELL_CONFIG = {
  brand: {
    name: "RetireWell",
    fullName: "RetireWell Fiduciary Partners & Annuity Advisory",
    tagline: "Retire With Confidence. Income That Lasts as Long as You Do.",
    estYear: 1998,
    phone: "(800) 584-9210",
    email: "advisory@retirewell.com",
    address: "One Financial Center, 34th Floor, Boston, MA 02111",
    fiduciaryNotice: "RetireWell Advisory Group is an SEC-registered investment adviser and independent fiduciary annuity brokerage."
  },

  // Centralized photography assets
  images: {
    hero: {
      coupleBeach: "images/hero-retired-couple.jpg", // Happy mature couple walking on beach
      planningMeeting: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80", // Advisor consultation in bright office
      relaxedHome: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=80", // Happy senior couple enjoying home
      familyGathering: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80" // Multi-generational family
    },
    advisors: {
      davidVance: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80", // Senior Male Executive Advisor
      elenaRostova: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80", // Professional Female Advisor
      marcusSterling: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80", // Friendly Experienced Wealth Manager
      sarahJenkins: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80", // Accomplished Female Planner
      raymondScott: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80", // Experienced Estate Specialist
      miriamPatel: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80" // Senior Analytical Director
    },
    lifestyle: {
      travel: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      gardening: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
      grandkids: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=800&q=80",
      peacefulCabin: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80"
    },
    services: {
      fixedAnnuity: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
      variableAnnuity: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
      indexedAnnuity: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      immediateIncome: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=800&q=80",
      deferredAnnuity: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80",
      incomeRider: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
      incomeRoadmap: "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&w=800&q=80",
      rollover: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80",
      socialSecurity: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80",
      legacyPlanning: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80",
      longTermCare: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80",
      annualReview: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80"
    },
    testimonials: {
      robertLinda: "images/avatar-thomas-linda.jpg",
      charlesGreene: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
      patriciaMiller: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80"
    }
  },

  // Institutional Carrier Partners with credit ratings
  carriers: [
    { name: "Summit Mutual Life", rating: "A+ (Superior)", agency: "A.M. Best", assets: "$142B", icon: "bi-shield-check" },
    { name: "Pacific Horizon Life", rating: "A++ (Superior)", agency: "A.M. Best", assets: "$210B", icon: "bi-building-check" },
    { name: "Keystone Annuity Corp", rating: "AA+ (Very Strong)", agency: "S&P Global", assets: "$88B", icon: "bi-safe" },
    { name: "Guardian Apex Capital", rating: "A1 (Good)", agency: "Moody's", assets: "$115B", icon: "bi-award" },
    { name: "Vanguard Heritage Life", rating: "A+ (Superior)", agency: "Fitch", assets: "$175B", icon: "bi-bank" }
  ]
};

if (typeof window !== "undefined") {
  window.RETIREWELL_CONFIG = RETIREWELL_CONFIG;
}
