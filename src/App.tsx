import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/ui/Navbar';
import { Footer } from './components/ui/Footer';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { HeroSection } from './components/public/HeroSection';
import { OutletSelector } from './components/public/OutletSelector';
import { SignaturePicks } from './components/public/SignaturePicks';
import { ChapterSection } from './components/public/ChapterSection';
import { OpenBoothSection } from './components/public/OpenBoothSection';
import { BaristasSection } from './components/public/BaristasSection';
import { AboutAndContactSection } from './components/public/AboutAndContactSection';

import { OrderingView } from './components/ordering/OrderingView';
import { ProductCustomizationModal } from './components/ordering/ProductCustomizationModal';
import { CartSidebar } from './components/ordering/CartSidebar';
import { CheckoutView } from './components/ordering/CheckoutView';
import { OrderSuccessView } from './components/ordering/OrderSuccessView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminTab } from './components/admin/AdminSidebar';

import {
  Barista,
  CartItemOption,
  Category,
  Order,
  OrderType,
  Outlet,
  Product,
  Profile,
  WebsiteContent
} from './types';
import {
  INITIAL_BARISTAS,
  INITIAL_CATEGORIES,
  INITIAL_OUTLETS,
  INITIAL_PRODUCTS,
  INITIAL_WEBSITE_CONTENT
} from './data/initialData';
import { outletService } from './services/outletService';
import { productService } from './services/productService';
import { contentService } from './services/contentService';
import { orderService } from './services/orderService';
import { authService, AuthUserSession } from './services/authService';
import { useCart } from './hooks/useCart';

type AppPage = 'home' | 'ordering' | 'checkout' | 'success' | 'admin' | 'admin-login';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<AppPage>('home');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

  // Supabase Auth Session & Profile
  const [adminSession, setAdminSession] = useState<AuthUserSession | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Core Data States (Pre-populated with Stitch initial data to prevent empty flash)
  const [outlets, setOutlets] = useState<Outlet[]>(INITIAL_OUTLETS);
  const [selectedOutletId, setSelectedOutletId] = useState<string>('outlet-sudirman');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [baristas, setBaristas] = useState<Barista[]>(INITIAL_BARISTAS);
  const [websiteContent, setWebsiteContent] = useState<WebsiteContent>(INITIAL_WEBSITE_CONTENT);
  const [orders, setOrders] = useState<Order[]>([]);

  // Ordering & Checkout States
  const [fulfillmentMode, setFulfillmentMode] = useState<OrderType>('DINE IN');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isOutletSelectorModalOpen, setIsOutletSelectorModalOpen] = useState<boolean>(false);
  const [latestPlacedOrder, setLatestPlacedOrder] = useState<Order | null>(null);

  // Cart Hook
  const {
    items: cartItems,
    subtotal: cartSubtotal,
    pb1Tax: cartPb1Tax,
    ecoDiscount: cartEcoDiscount,
    total: cartTotal,
    totalItems: cartItemCount,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart
  } = useCart();

  // Parse current route from URL
  const parseRouteFromUrl = useCallback((): { page: AppPage; tab: AdminTab } => {
    const path = window.location.pathname.toLowerCase();

    if (path === '/admin/login' || path === '/admin-login') {
      return { page: 'admin-login', tab: 'dashboard' };
    }

    if (path.startsWith('/admin')) {
      const sub = path.replace('/admin', '').replace(/^\//, '');
      const validTabs: AdminTab[] = [
        'dashboard',
        'orders',
        'menu',
        'categories',
        'options',
        'stock',
        'outlets',
        'content',
        'baristas',
        'open-booth',
        'analytics',
        'admins',
        'settings',
        'profile'
      ];
      const matchedTab = validTabs.find((t) => t === sub) || 'dashboard';
      return { page: 'admin', tab: matchedTab };
    }

    if (path === '/menu' || path === '/ordering' || path === '/order') {
      return { page: 'ordering', tab: 'dashboard' };
    }

    if (path === '/checkout') {
      return { page: 'checkout', tab: 'dashboard' };
    }

    return { page: 'home', tab: 'dashboard' };
  }, []);

  // Sync route on popstate and initial load
  const syncRouteWithState = useCallback((session: AuthUserSession | null) => {
    const { page, tab } = parseRouteFromUrl();

    if (page === 'admin') {
      // Protected Route Guard: If not logged in, redirect to /admin/login
      if (!session) {
        window.history.replaceState(null, '', '/admin/login');
        setActivePage('admin-login');
        setAdminTab('dashboard');
      } else {
        setActivePage('admin');
        setAdminTab(tab);
      }
    } else if (page === 'admin-login') {
      // If already logged in, redirect to /admin
      if (session) {
        window.history.replaceState(null, '', '/admin');
        setActivePage('admin');
        setAdminTab('dashboard');
      } else {
        setActivePage('admin-login');
      }
    } else {
      setActivePage(page);
    }
  }, [parseRouteFromUrl]);

  // Initial Auth & Data Load
  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;

    const init = async () => {
      // Check auth session
      try {
        const session = await authService.getSession();
        setAdminSession(session);
        setCurrentProfile(session?.profile || null);
        syncRouteWithState(session);
      } catch (err) {
        console.error('Error checking auth session:', err);
      } finally {
        setIsAuthChecking(false);
      }

      // Listen for auth state change
      unsubscribeAuth = authService.onAuthStateChange((session) => {
        setAdminSession(session);
        setCurrentProfile(session?.profile || null);
        if (session) {
          if (window.location.pathname === '/admin/login') {
            window.history.pushState(null, '', '/admin');
            setActivePage('admin');
            setAdminTab('dashboard');
          }
        } else {
          if (window.location.pathname.startsWith('/admin')) {
            window.history.pushState(null, '', '/admin/login');
            setActivePage('admin-login');
          }
        }
      });

      // Load initial data
      try {
        const [
          fetchedOutlets,
          fetchedProducts,
          fetchedCategories,
          fetchedBaristas,
          fetchedContent,
          fetchedOrders
        ] = await Promise.all([
          outletService.getOutlets(),
          productService.getProducts(),
          productService.getCategories(),
          contentService.getBaristas(),
          contentService.getWebsiteContent(),
          orderService.getOrders()
        ]);

        if (fetchedOutlets && fetchedOutlets.length > 0) setOutlets(fetchedOutlets);
        if (fetchedProducts && fetchedProducts.length > 0) setProducts(fetchedProducts);
        if (fetchedCategories && fetchedCategories.length > 0) setCategories(fetchedCategories);
        if (fetchedBaristas && fetchedBaristas.length > 0) setBaristas(fetchedBaristas);
        if (fetchedContent) setWebsiteContent(fetchedContent);
        if (fetchedOrders) setOrders(fetchedOrders);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 400);
      }
    };

    init();

    // Listen to popstate for browser navigation
    const handlePopState = () => {
      syncRouteWithState(adminSession);
    };
    window.addEventListener('popstate', handlePopState);

    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
      setIsAuthChecking(false);
    }, 1200);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (unsubscribeAuth) unsubscribeAuth();
      clearTimeout(fallbackTimer);
    };
  }, [syncRouteWithState]);

  const currentOutlet: Outlet =
    (outlets || []).find((o) => o?.id === selectedOutletId) ||
    (outlets || [])[0] ||
    INITIAL_OUTLETS[0];

  // Online ordering outlets strictly restricted to Sudirman and Kelakap 7 (MPP / LET'GO removed)
  const onlineOrderOutlets: Outlet[] = (outlets || []).filter((o) => {
    if (!o) return false;
    const idLower = (o.id || '').toLowerCase();
    const nameLower = (o.name || '').toLowerCase();
    return (
      !idLower.includes('letgo') &&
      !idLower.includes('mpp') &&
      !nameLower.includes("let'go") &&
      !nameLower.includes('letgo') &&
      !nameLower.includes('mpp')
    );
  });

  // Smooth scroll with navbar height offset
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const navHeight = 80;
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navHeight;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleNavigate = (view: string) => {
    if (view === 'home') {
      window.history.pushState(null, '', '/');
      setActivePage('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (view === 'menu' || view === 'ordering') {
      window.history.pushState(null, '', '/menu');
      setActivePage('ordering');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (view === 'locations') {
      if (activePage !== 'home') {
        window.history.pushState(null, '', '/');
        setActivePage('home');
        setTimeout(() => scrollToSection('outlets-section'), 100);
      } else {
        scrollToSection('outlets-section');
      }
      return;
    }

    if (view === 'chapters') {
      if (activePage !== 'home') {
        window.history.pushState(null, '', '/');
        setActivePage('home');
        setTimeout(() => scrollToSection('chapters-section'), 100);
      } else {
        scrollToSection('chapters-section');
      }
      return;
    }

    if (view === 'baristas') {
      if (activePage !== 'home') {
        window.history.pushState(null, '', '/');
        setActivePage('home');
        setTimeout(() => scrollToSection('baristas-section'), 100);
      } else {
        scrollToSection('baristas-section');
      }
      return;
    }

    if (view === 'about') {
      if (activePage !== 'home') {
        window.history.pushState(null, '', '/');
        setActivePage('home');
        setTimeout(() => scrollToSection('about-section'), 100);
      } else {
        scrollToSection('about-section');
      }
      return;
    }

    if (view === 'contact') {
      if (activePage !== 'home') {
        window.history.pushState(null, '', '/');
        setActivePage('home');
        setTimeout(() => scrollToSection('contact-section'), 100);
      } else {
        scrollToSection('contact-section');
      }
      return;
    }

    if (view === 'admin') {
      if (adminSession && currentProfile) {
        window.history.pushState(null, '', '/admin');
        setActivePage('admin');
        setAdminTab('dashboard');
      } else {
        window.history.pushState(null, '', '/admin/login');
        setActivePage('admin-login');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (view === 'checkout') {
      window.history.pushState(null, '', '/checkout');
      setActivePage('checkout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActivePage(view as any);
  };

  const handleAdminTabChange = (tab: AdminTab) => {
    setAdminTab(tab);
    const newPath = tab === 'dashboard' ? '/admin' : `/admin/${tab}`;
    window.history.pushState(null, '', newPath);
  };

  const handleLoginSuccess = (session: AuthUserSession) => {
    setAdminSession(session);
    setCurrentProfile(session.profile);
    window.history.pushState(null, '', '/admin');
    setActivePage('admin');
    setAdminTab('dashboard');
  };

  const handleLogout = async () => {
    await authService.signOut();
    setAdminSession(null);
    setCurrentProfile(null);
    window.history.pushState(null, '', '/admin/login');
    setActivePage('admin-login');
  };

  // Handlers
  const handleOpenCustomization = (product: Product) => {
    setCustomizingProduct(product);
  };

  const handleConfirmAddToCart = (
    product: Product,
    options: CartItemOption,
    quantity: number
  ) => {
    addToCart(product, options, quantity);
  };

  const handleOrderPlaced = async (order: Order) => {
    await orderService.createOrder(order);
    setLatestPlacedOrder(order);
    clearCart();
    setActivePage('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const updated = await orderService.getOrders();
    setOrders(updated);
  };

  const handleRefreshOrders = async () => {
    const updated = await orderService.getOrders();
    setOrders(updated);
  };

  const handleRefreshProducts = async () => {
    const [p, c] = await Promise.all([
      productService.getProducts(),
      productService.getCategories()
    ]);
    setProducts(p);
    setCategories(c);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      {/* 1. Loading Screen (Smooth entrance) */}
      <LoadingScreen
        isLoading={isLoading}
        onComplete={() => setIsLoading(false)}
      />

      {/* 2. Top Navigation Bar (Shown on public & ordering, hidden on admin & admin-login) */}
      {activePage !== 'admin' && activePage !== 'admin-login' && (
        <Navbar
          activePage={activePage}
          onNavigate={handleNavigate}
          cartItemCount={cartItemCount}
          onOpenCart={() => setIsCartOpen(true)}
          currentOutlet={currentOutlet}
          outlets={outlets}
          onSelectOutlet={(id) => setSelectedOutletId(id)}
          onOpenOutletSelector={() => setIsOutletSelectorModalOpen(true)}
          onOrderOnline={() => setIsOutletSelectorModalOpen(true)}
          onOpenAdmin={() => {
            if (adminSession && currentProfile) {
              window.history.pushState(null, '', '/admin');
              setActivePage('admin');
              setAdminTab('dashboard');
            } else {
              window.history.pushState(null, '', '/admin/login');
              setActivePage('admin-login');
            }
          }}
        />
      )}

      {/* 3. Main Views Content */}
      <main className="flex-1 w-full">
        {/* PUBLIC HOME PAGE */}
        {activePage === 'home' && (
          <div className="space-y-space-2xl">
            <HeroSection
              content={websiteContent.hero}
              outlets={outlets}
              selectedOutletId={selectedOutletId}
              onSelectOutlet={setSelectedOutletId}
              onOrderNow={() => {
                setIsOutletSelectorModalOpen(true);
              }}
              onExploreMenu={() => {
                window.history.pushState(null, '', '/menu');
                setActivePage('ordering');
              }}
            />

            <section id="outlets-section" className="scroll-mt-24">
              <OutletSelector
                outlets={outlets}
                selectedOutletId={selectedOutletId}
                onSelectOutlet={setSelectedOutletId}
              />
            </section>

            <section id="signature-picks-section">
              <SignaturePicks
                products={products}
                onSelectProduct={handleOpenCustomization}
              />
            </section>

            <section id="chapters-section" className="scroll-mt-24">
              <ChapterSection
                content={websiteContent?.chapters}
                outlets={outlets}
                onSelectChapter={(outletId) => {
                  setSelectedOutletId(outletId);
                  window.history.pushState(null, '', '/menu');
                  setActivePage('ordering');
                }}
              />
            </section>

            <section id="open-booth-section">
              <OpenBoothSection content={websiteContent?.open_booth} />
            </section>

            <section id="baristas-section" className="scroll-mt-24">
              <BaristasSection baristas={baristas} />
            </section>

            <section id="about-section" className="scroll-mt-24">
              <AboutAndContactSection
                contact={websiteContent?.contact}
              />
            </section>
          </div>
        )}

        {/* ORDERING MENU VIEW */}
        {activePage === 'ordering' && (
          <OrderingView
            outlets={outlets}
            currentOutlet={currentOutlet}
            selectedOutlet={currentOutlet}
            onSelectOutlet={setSelectedOutletId}
            fulfillmentMode={fulfillmentMode}
            onChangeFulfillmentMode={setFulfillmentMode}
            products={products}
            categories={categories}
            onSelectProduct={handleOpenCustomization}
            cartCount={cartItemCount}
            cartItems={cartItems}
            cartSubtotal={cartSubtotal}
            cartPb1Tax={cartPb1Tax}
            cartTotal={cartTotal}
            onOpenCart={() => setIsCartOpen(true)}
            onCheckout={() => {
              setIsCartOpen(false);
              window.history.pushState(null, '', '/checkout');
              setActivePage('checkout');
            }}
            onOpenOutletSelector={() => setIsOutletSelectorModalOpen(true)}
          />
        )}

        {/* CHECKOUT VIEW */}
        {activePage === 'checkout' && (
          <CheckoutView
            currentOutlet={currentOutlet}
            outlet={currentOutlet}
            initialMode={fulfillmentMode}
            orderType={fulfillmentMode}
            cartItems={cartItems}
            items={cartItems}
            cartSubtotal={cartSubtotal}
            subtotal={cartSubtotal}
            cartPb1Tax={cartPb1Tax}
            pb1Tax={cartPb1Tax}
            ecoDiscount={cartEcoDiscount}
            cartTotal={cartTotal}
            total={cartTotal}
            onBackToMenu={() => {
              window.history.pushState(null, '', '/menu');
              setActivePage('ordering');
            }}
            onBack={() => {
              window.history.pushState(null, '', '/menu');
              setActivePage('ordering');
            }}
            onOrderPlaced={handleOrderPlaced}
          />
        )}

        {/* ORDER SUCCESS VIEW */}
        {activePage === 'success' && latestPlacedOrder && (
          <OrderSuccessView
            order={latestPlacedOrder}
            onBackToHome={() => {
              window.history.pushState(null, '', '/');
              setActivePage('home');
            }}
          />
        )}

        {/* ADMIN LOGIN VIEW */}
        {activePage === 'admin-login' && (
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onBackToHome={() => {
              window.history.pushState(null, '', '/');
              setActivePage('home');
            }}
          />
        )}

        {/* PROTECTED ADMIN DASHBOARD VIEW */}
        {activePage === 'admin' && adminSession && (
          <AdminDashboard
            outlets={outlets}
            products={products}
            categories={categories}
            baristas={baristas}
            websiteContent={websiteContent}
            orders={orders}
            currentProfile={currentProfile}
            initialTab={adminTab}
            onTabChange={handleAdminTabChange}
            onRefreshOrders={handleRefreshOrders}
            onRefreshProducts={handleRefreshProducts}
            onCloseAdmin={() => {
              window.history.pushState(null, '', '/');
              setActivePage('home');
            }}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* 4. Footer (shown on public and ordering pages) */}
      {activePage !== 'admin' && activePage !== 'admin-login' && activePage !== 'checkout' && activePage !== 'success' && (
        <Footer
          outlets={outlets}
          onNavigate={handleNavigate}
          onOrderClick={() => {
            setIsOutletSelectorModalOpen(true);
          }}
          onAdminClick={() => {
            if (adminSession && currentProfile) {
              window.history.pushState(null, '', '/admin');
              setActivePage('admin');
              setAdminTab('dashboard');
            } else {
              window.history.pushState(null, '', '/admin/login');
              setActivePage('admin-login');
            }
          }}
          onOpenAdmin={() => {
            if (adminSession && currentProfile) {
              window.history.pushState(null, '', '/admin');
              setActivePage('admin');
              setAdminTab('dashboard');
            } else {
              window.history.pushState(null, '', '/admin/login');
              setActivePage('admin-login');
            }
          }}
        />
      )}

      {/* 5. Customization Modal */}
      {customizingProduct && (
        <ProductCustomizationModal
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onAddToCart={handleConfirmAddToCart}
        />
      )}

      {/* 6. Slide-out Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        subtotal={cartSubtotal}
        pb1Tax={cartPb1Tax}
        ecoDiscount={cartEcoDiscount}
        total={cartTotal}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={() => {
          setIsCartOpen(false);
          window.history.pushState(null, '', '/checkout');
          setActivePage('checkout');
        }}
        outletName={currentOutlet?.name || 'Leton Coffee — Sudirman'}
      />

      {/* 7. Outlet Selection Modal for ORDER ONLINE (Sudirman & Kelakap 7 only; MPP / LET'GO removed) */}
      {isOutletSelectorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-surface-container-lowest p-space-lg sm:p-space-xl rounded-2xl shadow-2xl border border-surface-container space-y-space-md">
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">storefront</span>
                  <h3 className="font-headline-sm font-bold text-on-surface">
                    Pilih Outlet Order Online
                  </h3>
                </div>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                  Pilih outlet Leton Coffee untuk pemesanan online:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOutletSelectorModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {onlineOrderOutlets.map((outlet) => {
                const isSelected = outlet?.id === selectedOutletId;
                const isSudirman = outlet.id.includes('sudirman');
                const displayName = isSudirman
                  ? 'Leton Coffee Sudirman'
                  : 'Leton Coffee Kelakap 7';

                return (
                  <div
                    key={outlet?.id || Math.random().toString()}
                    onClick={() => {
                      if (outlet?.id) setSelectedOutletId(outlet.id);
                      setIsOutletSelectorModalOpen(false);
                      window.history.pushState(null, '', '/menu');
                      setActivePage('ordering');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`p-5 rounded-xl cursor-pointer transition-all border text-left flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-primary-container/10 border-primary shadow-md ring-2 ring-primary/20'
                        : 'bg-surface-container-lowest border-surface-container hover:border-primary/50 hover:bg-surface-container-low/50 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-label-sm text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider">
                          {outlet?.chapter_label || (isSudirman ? 'CHAPTER 05' : 'CHAPTER 06')}
                        </span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-primary text-[18px]">
                            check_circle
                          </span>
                        )}
                      </div>
                      <h4 className="font-headline-sm text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                        {displayName}
                      </h4>
                      <p className="font-body-sm text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                        {outlet?.address || ''}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-surface-container/60 flex items-center justify-between">
                      <span className="font-label-sm text-[11px] text-primary flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {outlet?.opening_hours || '07:00 – 23:00 WIB'}
                      </span>
                      <span className="text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Pilih & Order <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
