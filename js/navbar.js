/**
 * RetireWell Fiduciary Advisory - Universal Modular Navigation Header
 * Injects responsive sticky navbar with mobile slide-out menu, accessibility toggles,
 * client authentication check, and "Plan My Retirement" consultation trigger.
 */

document.addEventListener("DOMContentLoaded", () => {
  const mountEl = document.getElementById("navbar");
  if (!mountEl) return;

  const currentPath = window.location.pathname;
  const isHome = currentPath.endsWith("index.html") || currentPath.endsWith("/") || currentPath.endsWith("retirewell") || currentPath.endsWith("retirewell/");
  const isServices = currentPath.includes("services.html");
  const isAdvisors = currentPath.includes("advisors.html");
  const isLogin = currentPath.includes("login.html");
  const isDashboard = currentPath.includes("user.html");

  // Check auth session
  const session = window.RetireWellDB ? window.RetireWellDB.getSession() : null;
  const isLoggedIn = !!session;
  const userName = session && session.user ? session.user.name : "Client Portal";

  mountEl.innerHTML = `
    <header id="mainNavbar" class="sticky top-0 z-50 w-full transition-all duration-300 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          
          <!-- Brand Logo -->
          <div class="flex-shrink-0">
            <a href="index.html" class="flex items-center gap-3 group" aria-label="RetireWell Homepage">
              <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform">
                <i class="bi bi-shield-lock-fill text-2xl"></i>
              </div>
              <div class="flex flex-col">
                <span class="text-xl font-bold font-serif tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  Retire<span class="text-teal-600 dark:text-teal-400">Well</span>
                  <span class="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-sans font-semibold">FIDUCIARY</span>
                </span>
                <span class="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">Annuity & Longevity Planning</span>
              </div>
            </a>
          </div>

          <!-- Desktop Center Navigation -->
          <nav class="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <a href="index.html" class="transition hover:text-teal-600 dark:hover:text-teal-400 py-1 border-b-2 ${isHome ? 'text-teal-600 dark:text-teal-400 border-teal-600 dark:border-teal-400' : 'border-transparent'}">
              Home
            </a>
            <a href="services.html" class="transition hover:text-teal-600 dark:hover:text-teal-400 py-1 border-b-2 ${isServices ? 'text-teal-600 dark:text-teal-400 border-teal-600 dark:border-teal-400' : 'border-transparent'}">
              Annuities & Services
            </a>
            <a href="advisors.html" class="transition hover:text-teal-600 dark:hover:text-teal-400 py-1 border-b-2 ${isAdvisors ? 'text-teal-600 dark:text-teal-400 border-teal-600 dark:border-teal-400' : 'border-transparent'}">
              Fiduciary Advisors
            </a>
            <a href="user.html" class="transition hover:text-teal-600 dark:hover:text-teal-400 py-1 border-b-2 ${isDashboard ? 'text-teal-600 dark:text-teal-400 border-teal-600 dark:border-teal-400' : 'border-transparent'} flex items-center gap-1.5">
              <i class="bi bi-speedometer2 text-teal-600"></i> Client Dashboard
            </a>
          </nav>

          <!-- Desktop Actions & Accessibility Bar -->
          <div class="hidden lg:flex items-center gap-4">
            
            <!-- Accessibility: Text Size Toggle -->
            <button onclick="RetireWellApp.cycleTextScale()" 
              class="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 text-xs font-bold transition flex items-center gap-1 cursor-pointer" 
              title="Toggle Font Sizing (Normal / Large / Extra Large)">
              <span class="text-scale-label">A (100%)</span>
            </button>

            <!-- Accessibility: Theme Toggle -->
            <button onclick="RetireWellApp.toggleTheme()" 
              class="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-teal-500 hover:text-teal-600 text-base transition flex items-center justify-center cursor-pointer" 
              title="Toggle Light / Dark Navy Theme">
              <i class="bi bi-moon-stars-fill theme-toggle-icon"></i>
            </button>

            <!-- Accessibility: RTL Toggle -->
            <button onclick="RetireWellApp.toggleRTL()" 
              class="rtl-toggle-btn px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-teal-500 text-xs font-bold transition cursor-pointer" 
              title="Toggle RTL (Right-to-Left)">
              ⇄ RTL
            </button>

            <!-- Client Login / Portal Link -->
            ${isLoggedIn ? `
              <a href="user.html" class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-teal-600/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold text-xs transition hover:bg-teal-500/20">
                <i class="bi bi-person-check-fill text-sm"></i>
                <span class="max-w-[100px] truncate">${userName}</span>
              </a>
            ` : `
              <a href="login.html" class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-xs text-slate-800 dark:text-slate-200 hover:border-teal-600 hover:text-teal-600 transition">
                <i class="bi bi-lock-fill mr-1"></i> Client Login
              </a>
            `}

            <!-- Primary CTA Button: Book Consultation -->
            <button onclick="RetireWellApp.openBookingModal('Comprehensive Retirement Income Plan')" 
              class="btn-primary-gold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-md cursor-pointer">
              <i class="bi bi-calendar2-check-fill mr-1"></i> Plan My Retirement
            </button>
          </div>

          <!-- Mobile Hamburger -->
          <div class="flex items-center gap-3 lg:hidden">
            <button onclick="RetireWellApp.toggleTheme()" class="p-2 rounded-lg text-slate-700 dark:text-slate-200" title="Theme">
              <i class="bi bi-moon-stars-fill theme-toggle-icon"></i>
            </button>
            <button id="mobileMenuBtn" class="p-2 rounded-xl text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition" aria-label="Open Navigation Menu">
              <i class="bi bi-list text-3xl"></i>
            </button>
          </div>

        </div>
      </div>
    </header>

    <!-- Mobile Slide-out Drawer -->
    <div id="mobileDrawerBackdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden transition-opacity duration-300">
      <div id="mobileDrawer" class="fixed inset-y-0 right-0 w-80 max-w-full bg-white dark:bg-navy-950 p-6 flex flex-col justify-between shadow-2xl transform translate-x-full transition-transform duration-300 ease-in-out border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
        
        <div>
          <!-- Drawer Header -->
          <div class="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
                <i class="bi bi-shield-lock-fill"></i>
              </div>
              <span class="font-serif font-bold text-lg text-slate-900 dark:text-white">Retire<span class="text-teal-600">Well</span></span>
            </div>
            <button id="closeMobileDrawer" class="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white" aria-label="Close Menu">
              <i class="bi bi-x-lg text-xl"></i>
            </button>
          </div>

          <!-- Drawer Navigation Links -->
          <nav class="py-6 space-y-3 font-semibold text-slate-800 dark:text-slate-100">
            <a href="index.html" class="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isHome ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600' : ''}">
              <span>Home</span> <i class="bi bi-chevron-right text-xs opacity-50"></i>
            </a>
            <a href="services.html" class="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isServices ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600' : ''}">
              <span>Annuities & Services</span> <i class="bi bi-chevron-right text-xs opacity-50"></i>
            </a>
            <a href="advisors.html" class="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isAdvisors ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600' : ''}">
              <span>Fiduciary Advisors</span> <i class="bi bi-chevron-right text-xs opacity-50"></i>
            </a>
            <a href="user.html" class="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isDashboard ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600' : ''}">
              <span>Client Dashboard</span> <i class="bi bi-chevron-right text-xs opacity-50"></i>
            </a>
            <a href="login.html" class="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isLogin ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600' : ''}">
              <span>Client Portal Login</span> <i class="bi bi-chevron-right text-xs opacity-50"></i>
            </a>
          </nav>
        </div>

        <!-- Drawer Footer Controls -->
        <div class="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div class="flex items-center justify-between gap-2">
            <button onclick="RetireWellApp.cycleTextScale()" class="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-center">
              Text: <span class="text-scale-label">100%</span>
            </button>
            <button onclick="RetireWellApp.toggleRTL()" class="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-center">
              ⇄ RTL Flip
            </button>
          </div>

          <button onclick="RetireWellApp.openBookingModal('Comprehensive Retirement Income Plan'); document.getElementById('closeMobileDrawer').click();" 
            class="btn-primary-gold w-full text-center py-3 text-xs uppercase tracking-wider font-bold">
            <i class="bi bi-calendar-check mr-1"></i> Plan My Retirement
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

  // Sync theme icon in newly mounted navbar
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  RetireWellApp.updateThemeIcons(currentTheme);
});
