/**
 * RetireWell Fiduciary Advisory - Universal Modular Navigation Header
 * Injects responsive sticky navbar with mobile slide-out menu, accessibility toggles,
 * client authentication check, and "Plan My Retirement" consultation trigger.
 */

document.addEventListener("DOMContentLoaded", () => {
  const mountEl = document.getElementById("navbar");
  if (!mountEl) return;

  const currentPath = window.location.pathname.toLowerCase();
  const isHome1 = currentPath.endsWith("index.html") || currentPath.endsWith("/") || currentPath.endsWith("retirewell") || currentPath.endsWith("retirewell/");
  const isHome2 = currentPath.includes("index-2.html") || currentPath.includes("home-2.html");
  const isHome = isHome1 || isHome2;
  const isAbout = currentPath.includes("about.html");
  const isServices = currentPath.includes("services.html");
  const isAdvisors = currentPath.includes("advisors.html");
  const isLogin = currentPath.includes("login.html");
  const isDashboard = currentPath.includes("user.html");

  // Suppress website header when in client portal login or sign up
  if (isLogin || isDashboard) {
    mountEl.innerHTML = "";
    return;
  }

  // Ensure mount container is sticky at the top
  mountEl.classList.add("sticky", "top-0", "z-50", "w-full");

  // Check auth session
  const session = window.RetireWellDB ? window.RetireWellDB.getSession() : null;
  const isLoggedIn = !!session;
  const userName = session && session.user ? session.user.name : "Client Portal";

  mountEl.innerHTML = `
    <header id="mainNavbar" class="sticky top-0 z-50 w-full transition-all duration-300 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div class="max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-8">
        <div class="relative flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          <!-- Left: Brand Logo -->
          <div class="flex items-center flex-shrink-0 z-10">
            <!-- Brand Logo -->
            <a href="index.html" class="flex items-center gap-2 sm:gap-2.5 xl:gap-3 group min-w-0" aria-label="RetireWell Homepage">
              <div class="w-9 h-9 sm:w-10 sm:h-10 xl:w-11 xl:h-11 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/40 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform flex-shrink-0 overflow-hidden">
                <img src="images/brand-logo.png" alt="RetireWell Logo" class="w-full h-full object-contain">
              </div>
              <div class="flex flex-col justify-center min-w-0">
                <span class="text-base sm:text-lg xl:text-xl font-bold font-serif tracking-tight text-slate-900 dark:text-white flex items-center leading-none">
                  Retire<span class="text-amber-600 dark:text-amber-400">Well</span>
                </span>
                <span class="text-[8px] sm:text-[9.5px] xl:text-[10px] uppercase tracking-wide sm:tracking-wider text-slate-500 dark:text-slate-400 font-semibold leading-none mt-1 whitespace-nowrap">
                  <span class="hidden xl:inline">Annuity &amp; Longevity Planning</span>
                  <span class="xl:hidden">Annuity &amp; Longevity</span>
                </span>
              </div>
            </a>
          </div>

          <!-- Middle: Desktop Navigation Links (True Middle Alignment) -->
          <nav class="rw-nav-middle gap-1 xl:gap-2">
            
            <!-- Home Dropdown (Home 1 & Home 2) -->
            <div class="relative group">
              <a href="index.html" class="h-9 xl:h-10 inline-flex items-center gap-1 px-2.5 xl:px-3 rounded-xl text-xs xl:text-sm font-semibold transition whitespace-nowrap relative ${isHome ? 'text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/40 shadow-xs font-bold after:absolute after:bottom-1 after:left-2.5 after:right-2.5 after:h-0.5 after:bg-amber-600 dark:after:bg-amber-400 after:rounded-full' : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'}">
                <span>Home</span> <i class="bi bi-chevron-down text-[10px] opacity-70 group-hover:rotate-180 transition-transform"></i>
              </a>
              <div class="absolute top-full left-0 mt-1 w-56 p-1.5 bg-white dark:bg-navy-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 hidden group-hover:block z-50">
                <a href="index.html" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-navy-800 transition ${isHome1 ? 'text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-navy-800 font-bold' : 'text-slate-700 dark:text-slate-300'}">
                  <span class="flex items-center gap-2"><i class="bi bi-house-door-fill text-amber-600 dark:text-amber-400"></i> Home 1 (Standard)</span>
                  ${isHome1 ? '<i class="bi bi-check2 text-amber-600 font-bold"></i>' : ''}
                </a>
                <a href="index-2.html" class="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-navy-800 transition ${isHome2 ? 'text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-navy-800 font-bold' : 'text-slate-700 dark:text-slate-300'}">
                  <span class="flex items-center gap-2"><i class="bi bi-stars text-amber-500"></i> Home 2 (Executive)</span>
                  ${isHome2 ? '<i class="bi bi-check2 text-amber-600 font-bold"></i>' : ''}
                </a>
              </div>
            </div>

            <a href="services.html" class="h-9 xl:h-10 inline-flex items-center px-2.5 xl:px-3 rounded-xl text-xs xl:text-sm font-semibold transition whitespace-nowrap relative ${isServices ? 'text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/40 shadow-xs font-bold after:absolute after:bottom-1 after:left-2.5 after:right-2.5 after:h-0.5 after:bg-amber-600 dark:after:bg-amber-400 after:rounded-full' : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'}">
              Annuities & Services
            </a>
            <a href="advisors.html" class="h-9 xl:h-10 inline-flex items-center px-2.5 xl:px-3 rounded-xl text-xs xl:text-sm font-semibold transition whitespace-nowrap relative ${isAdvisors ? 'text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/40 shadow-xs font-bold after:absolute after:bottom-1 after:left-2.5 after:right-2.5 after:h-0.5 after:bg-amber-600 dark:after:bg-amber-400 after:rounded-full' : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'}">
              Fiduciary Advisors
            </a>
            <!-- 4th Option: About -->
            <a href="about.html" class="h-9 xl:h-10 inline-flex items-center px-2.5 xl:px-3 rounded-xl text-xs xl:text-sm font-semibold transition whitespace-nowrap relative ${isAbout ? 'text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/40 shadow-xs font-bold after:absolute after:bottom-1 after:left-2.5 after:right-2.5 after:h-0.5 after:bg-amber-600 dark:after:bg-amber-400 after:rounded-full' : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'}">
              About
            </a>
            <!-- 5th Option: Contact (Placed before Dashboard, without logo) -->
            <button type="button" onclick="RetireWellApp.openBookingModal('General Fiduciary Inquiry & Contact')" 
              class="h-9 xl:h-10 inline-flex items-center px-2.5 xl:px-3 rounded-xl text-xs xl:text-sm font-semibold transition whitespace-nowrap relative text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent cursor-pointer"
              title="Contact RetireWell Advisory">
              Contact
            </button>
            <!-- 6th Option: Dashboard (Without logo) -->
            <a href="user.html" class="h-9 xl:h-10 inline-flex items-center px-2.5 xl:px-3 rounded-xl text-xs xl:text-sm font-semibold transition whitespace-nowrap relative ${isDashboard ? 'text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/40 shadow-xs font-bold after:absolute after:bottom-1 after:left-2.5 after:right-2.5 after:h-0.5 after:bg-amber-600 dark:after:bg-amber-400 after:rounded-full' : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'}">
              Dashboard
            </a>
          </nav>

          <!-- Right: Desktop Actions & Accessibility Bar -->
          <div class="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0 z-10">
            
            <!-- Grouped Accessibility Controls Pill -->
            <div class="flex items-center h-9 xl:h-10 bg-slate-100/80 dark:bg-navy-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
              <!-- Theme Toggle -->
              <button onclick="RetireWellApp.toggleTheme()" 
                class="w-7 h-7 xl:w-8 xl:h-8 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-navy-800 hover:text-amber-600 transition flex items-center justify-center cursor-pointer" 
                title="Toggle Light / Dark Navy Theme">
                <i class="bi bi-moon-stars-fill theme-toggle-icon"></i>
              </button>

              <span class="w-px h-4 bg-slate-300/80 dark:bg-slate-700 mx-0.5"></span>

              <!-- RTL Toggle -->
              <button onclick="RetireWellApp.toggleRTL()" 
                class="rtl-toggle-btn h-7 xl:h-8 px-2 xl:px-2.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-navy-800 hover:text-amber-600 font-bold transition flex items-center cursor-pointer" 
                title="Toggle RTL (Right-to-Left)">
                ⇄ RTL
              </button>
            </div>

            <!-- Client Login / Portal Link -->
            ${isLoggedIn ? `
              <div class="flex items-center gap-1.5">
                <a href="user.html" class="h-9 xl:h-10 flex items-center gap-2 px-3 rounded-xl border border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold text-xs transition hover:bg-amber-500/20 whitespace-nowrap" title="Client Dashboard">
                  <i class="bi bi-person-check-fill text-sm"></i>
                  <span class="max-w-[100px] truncate">${userName}</span>
                </a>
                <button onclick="if(window.RetireWellDB){window.RetireWellDB.logout();}else{try{localStorage.removeItem('retirewell_session');}catch(e){}}if(window.RetireWellApp){window.RetireWellApp.toast('Signed out of session. Returning to home...','info');}setTimeout(()=>{window.location.href='index.html';},400);" class="h-9 xl:h-10 inline-flex items-center gap-1.5 px-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white font-bold text-xs transition shadow-2xs cursor-pointer" title="Sign Out">
                  <i class="bi bi-box-arrow-right text-xs"></i>
                  <span>Sign Out</span>
                </button>
              </div>
            ` : `
              <a href="login.html" class="h-9 xl:h-10 inline-flex items-center gap-1.5 px-3 xl:px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-xs text-slate-800 dark:text-slate-200 hover:border-amber-600 hover:text-amber-600 dark:hover:border-amber-400 dark:hover:text-amber-400 transition bg-white dark:bg-navy-900 shadow-xs whitespace-nowrap">
                <i class="bi bi-lock-fill text-xs"></i> <span>Client Login</span>
              </a>
            `}
          </div>

          <!-- Mobile Hamburger & Compact Theme Toggle -->
          <div class="flex items-center gap-1.5 sm:gap-2 lg:hidden flex-shrink-0">
            <button onclick="RetireWellApp.toggleTheme()" 
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-2xs" 
              title="Toggle Theme" 
              aria-label="Toggle Theme">
              <i class="bi bi-moon-stars-fill theme-toggle-icon text-sm"></i>
            </button>
            <button id="mobileMenuBtn" 
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs" 
              aria-label="Open Navigation Menu">
              <i class="bi bi-list text-xl sm:text-2xl"></i>
            </button>
          </div>

        </div>
      </div>
    </header>

    <!-- Mobile Slide-out Drawer -->
    <div id="mobileDrawerBackdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] hidden transition-opacity duration-300">
      <div id="mobileDrawer" class="fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-white dark:bg-navy-950 p-4 sm:p-5 flex flex-col justify-between shadow-2xl transform translate-x-full transition-transform duration-300 ease-in-out border-l border-slate-200 dark:border-slate-800 overflow-y-auto z-[101]">
        
        <div>
          <!-- Drawer Header -->
          <div class="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/40 p-0.5 flex items-center justify-center overflow-hidden">
                <img src="images/brand-logo.png" alt="RetireWell Logo" class="w-full h-full object-contain">
              </div>
              <span class="font-serif font-bold text-base text-slate-900 dark:text-white">Retire<span class="text-amber-600 dark:text-amber-400">Well</span></span>
            </div>
            <button id="closeMobileDrawer" class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:white" aria-label="Close Menu">
              <i class="bi bi-x-lg text-sm sm:text-base"></i>
            </button>
          </div>

          <!-- Theme & RTL Flip Quick Options (Placed Above Home 1) -->
          <div class="pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div class="flex items-center justify-between gap-2">
              <button onclick="RetireWellApp.toggleTheme()" class="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-center flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <i class="bi bi-moon-stars-fill theme-toggle-icon text-xs"></i> <span>Theme</span>
              </button>
              <button onclick="RetireWellApp.toggleRTL()" class="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-center text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                ⇄ RTL Flip
              </button>
            </div>
          </div>

          <!-- Client Login Portal Quick Button (Directly Above Home 1) -->
          <div class="pt-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            ${isLoggedIn ? `
            <div class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 space-y-2 text-[11px] shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 truncate">
                  <i class="bi bi-person-check-fill text-amber-600 text-xs"></i> <span class="truncate max-w-[130px]">${userName}</span>
                </span>
                <a href="user.html" class="px-2 py-0.5 rounded-md bg-amber-600 text-white font-bold hover:bg-amber-700 text-[10px] shadow-2xs transition">Portfolio</a>
              </div>
              <button onclick="if(window.RetireWellDB){window.RetireWellDB.logout();}else{try{localStorage.removeItem('retirewell_session');}catch(e){}}if(window.RetireWellApp){window.RetireWellApp.toast('Signed out of session. Returning to home...','info');}setTimeout(()=>{window.location.href='index.html';},400);" class="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 font-bold text-xs transition cursor-pointer">
                <i class="bi bi-box-arrow-right"></i> Sign Out
              </button>
            </div>
            ` : `
            <a href="login.html" class="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-amber-600/30 bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-xs shadow-2xs transition group ${isLogin ? 'ring-2 ring-amber-500' : ''}">
              <span class="flex items-center gap-2">
                <i class="bi bi-lock-fill text-amber-600 dark:text-amber-400 text-xs"></i>
                <span>Client Login Portal</span>
              </span>
              <i class="bi bi-chevron-right text-[10px] text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform"></i>
            </a>
            `}
          </div>

          <!-- Drawer Navigation Links (Reduced Size for Mobile) -->
          <nav class="py-2.5 space-y-1 text-xs font-semibold text-slate-800 dark:text-slate-100">
            <a href="index.html" class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isHome1 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 font-bold' : ''}">
              <span class="flex items-center gap-2"><i class="bi bi-house-door-fill text-xs text-amber-600"></i> Home 1 (Standard)</span> <i class="bi bi-chevron-right text-[10px] opacity-50"></i>
            </a>
            <a href="index-2.html" class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isHome2 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 font-bold' : ''}">
              <span class="flex items-center gap-2"><i class="bi bi-stars text-xs text-amber-500"></i> Home 2 (Executive)</span> <i class="bi bi-chevron-right text-[10px] opacity-50"></i>
            </a>
            <a href="services.html" class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isServices ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 font-bold' : ''}">
              <span class="flex items-center gap-2"><i class="bi bi-shield-check text-xs text-amber-600"></i> Annuities &amp; Services</span> <i class="bi bi-chevron-right text-[10px] opacity-50"></i>
            </a>
            <a href="advisors.html" class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isAdvisors ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 font-bold' : ''}">
              <span class="flex items-center gap-2"><i class="bi bi-people text-xs text-amber-600"></i> Fiduciary Advisors</span> <i class="bi bi-chevron-right text-[10px] opacity-50"></i>
            </a>
            <a href="about.html" class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isAbout ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 font-bold' : ''}">
              <span class="flex items-center gap-2"><i class="bi bi-info-circle-fill text-xs text-amber-600"></i> About Us</span> <i class="bi bi-chevron-right text-[10px] opacity-50"></i>
            </a>
            <!-- Contact Us (Before Dashboard, without logo) -->
            <button type="button" onclick="RetireWellApp.openBookingModal('General Fiduciary Inquiry & Contact'); const d = document.getElementById('closeMobileDrawer'); if(d) d.click();" class="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-800 dark:text-slate-100 text-left font-semibold cursor-pointer">
              <span>Contact Us</span> <i class="bi bi-chevron-right text-[10px] opacity-50"></i>
            </button>
            <!-- Dashboard (without logo) -->
            <a href="user.html" class="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isDashboard ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 font-bold' : ''}">
              <span>Client Dashboard</span> <i class="bi bi-chevron-right text-[10px] opacity-50"></i>
            </a>
          </nav>
        </div>

        <!-- Drawer Footer Controls (Compact Size for Mobile) -->
        <div class="pt-3 border-t border-slate-200 dark:border-slate-800">
          <button onclick="RetireWellApp.openBookingModal('General Advisory Consultation'); const d = document.getElementById('closeMobileDrawer'); if(d) d.click();" class="w-full btn-primary-gold py-2 px-3 text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5">
            <i class="bi bi-calendar-check"></i> Plan My Retirement
          </button>
        </div>

      </div>
    </div>
  `;

  // Attach mobile drawer event handlers
  const openDrawerBtn = document.getElementById("mobileMenuBtn");
  const closeDrawerBtn = document.getElementById("closeMobileDrawer");
  const drawerBackdrop = document.getElementById("mobileDrawerBackdrop");
  const drawer = document.getElementById("mobileDrawer");

  if (openDrawerBtn && drawerBackdrop && drawer) {
    openDrawerBtn.addEventListener("click", () => {
      drawerBackdrop.classList.remove("hidden");
      requestAnimationFrame(() => {
        drawer.classList.remove("translate-x-full");
      });
    });

    const closeHandler = () => {
      drawer.classList.add("translate-x-full");
      setTimeout(() => {
        drawerBackdrop.classList.add("hidden");
      }, 300);
    };

    if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", closeHandler);
    drawerBackdrop.addEventListener("click", (e) => {
      if (e.target === drawerBackdrop) closeHandler();
    });
  }

  // Dynamic Scroll Listener for Sticky Navbar Elevation & Glassmorphism
  const handleScroll = () => {
    const nav = document.getElementById("mainNavbar");
    if (!nav) return;
    if (window.scrollY > 8) {
      nav.classList.add("rw-navbar-scrolled");
    } else {
      nav.classList.remove("rw-navbar-scrolled");
    }
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  // Sync theme icon in newly mounted navbar
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  RetireWellApp.updateThemeIcons(currentTheme);
});
