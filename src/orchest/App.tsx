import React, { Suspense, lazy, useState, useEffect, useCallback, useRef } from "react";
import { adminHeaders, clearAdminToken } from "./utils/adminAuth";
import {
  Track,
  CategoryId,
  RhythmType,
  ThemeMode,
  AppView,
  OrderRequest,
  KPIData,
  Category,
  Artist,
  AppThemeSettings,
  OfferPackage,
} from "./types/index";
import { audioEngine } from "./services/audioEngine";
import { trackGa4Event } from "./services/ga4";
import { loadPublicTrackPage } from "./services/seoCatalog";
import {
  loadCatalog,
  saveOrder,
  adminMutate,
  adminLoadConfig,
  adminLoadEntities,
  adminLoadTracks,
  adminLoadOrders,
  type AdminOrdersQuery,
  loadCatalogTrackPage,
  recordVisit,
  recordTrackPlay,
} from "./services/catalogDb";
import { filterTracks, calculateConversionRate, generateWhatsAppUrl } from "./utils/trackLogic";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { CategoryGrid } from "./components/CategoryGrid";
import { TrackCard } from "./components/TrackCard";
import { TrackComparisonPanel } from "./components/TrackComparisonPanel";
import { TrackDetailsView } from "./components/TrackDetailsView";
import { StickyAudioPlayer } from "./components/StickyAudioPlayer";
import { OrderModal } from "./components/OrderModal";
import { AnalyticsConsentBanner } from "./components/AnalyticsConsentBanner";
const AdminDashboard = lazy(() =>
  import("./components/AdminDashboard").then((module) => ({
    default: module.AdminDashboard,
  })),
);
import { SearchModal } from "./components/SearchModal";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { AiConciergeModal } from "./components/AiConciergeModal";
import { ArtistsSection } from "./components/ArtistsSection";
import { ArtistDetailsView } from "./components/ArtistDetailsView";
import { AdminLogin } from "./components/AdminLogin";
import { OffersSection } from "./components/OffersSection";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Sparkles,
  MessageCircle,
  ShieldCheck,
  Headphones,
  CheckCircle,
  Star,
  ChevronLeft,
  Music,
  Heart,
} from "lucide-react";

export default function App() {
  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("orchest_theme");
    return saved === "light" || saved === "dark" ? saved : "light";
  });

  // App navigation state
  const [currentView, setCurrentView] = useState<AppView>(() => {
    try {
      const requestedView = new URLSearchParams(window.location.search).get("view");
      return requestedView === "admin" || sessionStorage.getItem("orchest_view") === "admin"
        ? "admin"
        : "home";
    } catch {
      return "home";
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem("orchest_view", currentView);
    } catch {
      /* ignore */
    }
  }, [currentView]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminCsrfToken, setAdminCsrfToken] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksTotal, setTracksTotal] = useState(0);
  const [isLoadingMoreTracks, setIsLoadingMoreTracks] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const adminOrdersRequestId = useRef(0);
  const [kpi, setKpi] = useState<KPIData>({
    totalVisits: 0,
    totalStreams: 0,
    whatsappLeads: 0,
    conversionRate: 0,
  });
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [offers, setOffers] = useState<OfferPackage[]>([]);
  const [adminOffers, setAdminOffers] = useState<OfferPackage[]>([]);
  const [themeSettings, setThemeSettings] = useState<AppThemeSettings>({
    activeTheme: "default",
    forceThemeOverride: false,
    enableTimeGreetings: true,
    enableOffersSection: true,
  });
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Load everything from the database (shared by all visitors).
  const refreshCatalog = async () => {
    try {
      const c = await loadCatalog();
      setTracks(c.tracks);
      setTracksTotal(c.tracksTotal);
      setCategories(c.categories);
      setArtists(c.artists);
      setOffers(c.offers);
      setThemeSettings(c.themeSettings);
      setWhatsappNumber(c.whatsappNumber ?? "");
      setSelectedTrack((prev) => prev ?? c.tracks[0] ?? null);
      setSelectedArtist((prev) => prev ?? c.artists[0] ?? null);
      setCatalogError(null);
    } catch (e) {
      console.error("Catalog load failed", e);
      setCatalogError("تعذر تحميل المحتوى حالياً. يرجى تحديث الصفحة.");
    }
  };
  useEffect(() => {
    void refreshCatalog();
  }, []);

  // Admin-only save; on failure show the reason and reload the real data.
  const persist = async (body: Record<string, unknown>, success?: string): Promise<boolean> => {
    if (!adminCsrfToken) {
      toast.error("يلزم تسجيل دخول المدير");
      return false;
    }
    try {
      await adminMutate(adminCsrfToken, body);
      if (success) toast.success(success);
      return true;
    } catch (e) {
      toast.error("لم يتم الحفظ", { description: e instanceof Error ? e.message : undefined });
      void refreshCatalog();
      return false;
    }
  };

  const refreshAdminConfig = useCallback(async () => {
    if (!adminCsrfToken) return;
    const data = await adminLoadConfig(adminCsrfToken);
    const mappedOffers: OfferPackage[] = (data.offers ?? []).map((row) => ({
      id: String(row["id"] ?? ""),
      title: String(row["title"] ?? ""),
      ...(row["badge"] != null ? { badge: String(row["badge"]) } : {}),
      ...(row["description"] != null ? { description: String(row["description"]) } : {}),
      type: row["type"] === "banner_image" ? "banner_image" : "text_card",
      ...(row["banner_url"] != null ? { bannerUrl: String(row["banner_url"]) } : {}),
      features: Array.isArray(row["features"]) ? row["features"].map(String) : [],
      ...(row["price_original"] != null ? { priceOriginal: Number(row["price_original"]) } : {}),
      ...(row["price_current"] != null ? { priceCurrent: Number(row["price_current"]) } : {}),
      currency: String(row["currency"] ?? "ر.س"),
      ctaText: String(row["cta_text"] ?? "طلب الباقة عبر واتساب"),
      whatsappMessageTemplate: String(row["whatsapp_message_template"] ?? ""),
      isActive: row["is_active"] === true,
      displayOrder: Number(row["display_order"] ?? 0),
      ...(row["start_date"] != null ? { startDate: String(row["start_date"]) } : {}),
      ...(row["end_date"] != null ? { endDate: String(row["end_date"]) } : {}),
      createdAt: String(row["created_at"] ?? ""),
    }));
    setAdminOffers(mappedOffers);
    setOffers(mappedOffers);

    const row = data.theme;
    if (row) {
      const customGreetings = row["custom_greetings_override"];
      const customGreetingsOverride =
        customGreetings && typeof customGreetings === "object" && !Array.isArray(customGreetings)
          ? Object.fromEntries(
              Object.entries(customGreetings).map(([key, value]) => [key, String(value)]),
            )
          : null;
      setThemeSettings({
        activeTheme: String(row["active_theme"] ?? "default") as AppThemeSettings["activeTheme"],
        forceThemeOverride: row["force_theme_override"] === true,
        enableTimeGreetings: row["enable_time_greetings"] !== false,
        enableOffersSection: row["enable_offers_section"] !== false,
        ...(customGreetingsOverride ? { customGreetingsOverride } : {}),
      });
    }
  }, [adminCsrfToken]);

  const loadAdminOrders = useCallback(
    async (query: AdminOrdersQuery) => {
      if (!adminCsrfToken) {
        return { orders: [], total: 0, visits: 0, plays: 0, whatsappLeads: 0 };
      }
      const requestId = ++adminOrdersRequestId.current;
      const result = await adminLoadOrders(adminCsrfToken, query);
      if (requestId === adminOrdersRequestId.current) {
        setOrders(result.orders);
        setTotalOrders(result.total);
        if (query.includeMetrics) {
          setKpi((prev) => ({
            ...prev,
            totalVisits: result.visits,
            totalStreams: result.plays,
            whatsappLeads: result.whatsappLeads,
            conversionRate: calculateConversionRate(result.whatsappLeads, result.visits),
          }));
        }
      }
      return result;
    },
    [adminCsrfToken],
  );

  useEffect(() => {
    if (!adminCsrfToken) return;
    void loadAdminOrders({ offset: 0, limit: 25, includeMetrics: true }).catch((e) =>
      console.error("Orders load failed", e),
    );
  }, [adminCsrfToken, loadAdminOrders]);

  useEffect(() => {
    if (!adminCsrfToken) return;
    void adminLoadEntities(adminCsrfToken)
      .then(async (entities) => {
        setCategories(entities.categories);
        setArtists(entities.artists);
        const adminTracks = await adminLoadTracks(adminCsrfToken, entities.categories);
        setTracks(adminTracks);
        setTracksTotal(adminTracks.length);
      })
      .catch((e) => console.error("Admin catalog load failed", e));
  }, [adminCsrfToken]);

  const handleLoadMoreTracks = async () => {
    if (isLoadingMoreTracks || tracks.length >= tracksTotal || isAdminAuthenticated) return;
    setIsLoadingMoreTracks(true);
    try {
      const nextTracks = await loadCatalogTrackPage(tracks.length, categories);
      setTracks((current) => {
        const ids = new Set(current.map((track) => track.id));
        return [...current, ...nextTracks.filter((track) => !ids.has(track.id))];
      });
    } catch (error) {
      toast.error("تعذر تحميل المزيد من الأعمال", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsLoadingMoreTracks(false);
    }
  };

  useEffect(() => {
    if (!adminCsrfToken) return;
    void refreshAdminConfig().catch((e) => console.error("Admin config load failed", e));
  }, [adminCsrfToken, refreshAdminConfig]);

  const handleUpdateOrderStatus = (id: string, status: OrderRequest["status"]) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    void persist({ action: "setOrderStatus", id, status }, `تم تغيير الحالة إلى: ${status}`);
  };

  // Count one visit per browser session.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("orchest_visit")) return;
      sessionStorage.setItem("orchest_visit", "1");
    } catch {
      /* ignore */
    }
    recordVisit();
  }, []);

  const handleUpdateWhatsAppNumber = (newNumber: string) => {
    setWhatsappNumber(newNumber);
    void persist(
      { action: "setSetting", key: "whatsapp_number", value: newNumber },
      "تم حفظ رقم الواتساب",
    );
  };

  const handleAddCategory = (newCategory: Category) => {
    setCategories((prev) => [...prev, newCategory]);
    void persist({
      action: "addCategory",
      category: newCategory,
      sortOrder: categories.length + 1,
    });
  };

  const handleReorderCategories = (fromId: string, toId: string) => {
    const from = categories.findIndex((c) => c.id === fromId);
    const to = categories.findIndex((c) => c.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    const updated = [...categories];
    const [moved] = updated.splice(from, 1);
    if (moved) updated.splice(to, 0, moved);
    setCategories(updated);
    void persist(
      { action: "reorderCategories", ids: updated.map((c) => c.id) },
      "تم تحديث ترتيب التصنيفات",
    );
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    void persist({ action: "deleteCategory", id: categoryId });
  };

  const handleSelectArtist = (artist: Artist) => {
    setSelectedArtist(artist);
    setCurrentView("artist-details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [selectedRhythm, setSelectedRhythm] = useState<string>("all");

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("orchest_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [comparisonTracks, setComparisonTracks] = useState<Track[]>([]);

  // Audio state synced from AudioEngine
  const [audioState, setAudioState] = useState(audioEngine.getState());

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalTrack, setOrderModalTrack] = useState<Track | null>(null);
  const orderDeepLinkHandled = useRef(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAiConciergeOpen, setIsAiConciergeOpen] = useState(false);

  useEffect(() => {
    if (orderDeepLinkHandled.current) return;
    const code = new URLSearchParams(window.location.search).get("order");
    if (!code) {
      orderDeepLinkHandled.current = true;
      return;
    }
    orderDeepLinkHandled.current = true;
    void loadPublicTrackPage({ data: { code } })
      .then((track) => {
        if (!track) {
          toast.error("العمل المطلوب غير متاح حالياً");
          return;
        }
        setCurrentView("home");
        setSelectedTrack(track);
        setOrderModalTrack(track);
        setIsOrderModalOpen(true);
        trackGa4Event("order_modal_open", { track_id: track.id, track_code: track.code });
        window.history.replaceState({}, "", window.location.pathname);
      })
      .catch(() => toast.error("تعذر فتح نموذج الطلب حالياً"));
  }, []);

  const loadAdminSession = async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
        headers: adminHeaders(),
      });
      const session: unknown = await response.json();
      if (
        session &&
        typeof session === "object" &&
        "authenticated" in session &&
        session.authenticated === true
      ) {
        const csrfToken =
          "csrfToken" in session && typeof session.csrfToken === "string"
            ? session.csrfToken
            : null;
        setIsAdminAuthenticated(Boolean(csrfToken));
        setAdminCsrfToken(csrfToken);
        return;
      }
      clearAdminToken();
    } catch {
      // Treat unavailable sessions as signed out.
    }
    setIsAdminAuthenticated(false);
    setAdminCsrfToken(null);
  };

  useEffect(() => {
    void loadAdminSession();
  }, []);

  const handleAdminLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(
      () => undefined,
    );
    clearAdminToken();
    setIsAdminAuthenticated(false);
    setAdminCsrfToken(null);
    setCurrentView("home");
    void refreshCatalog();
  };

  // Ctrl/⌘K opens instant search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Sync theme to localStorage & body class
  useEffect(() => {
    localStorage.setItem("orchest_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.dataset["theme"] = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.dataset["theme"] = "light";
    }
  }, [theme]);

  // Sync audio engine state
  useEffect(() => {
    const recordedTrackIds = new Set<string>();
    const unsubscribe = audioEngine.subscribe((st) => {
      setAudioState(st);
      if (st.isPlaying && st.trackId && !recordedTrackIds.has(st.trackId)) {
        recordedTrackIds.add(st.trackId);
        recordTrackPlay(st.trackId);
      }
    });
    return unsubscribe;
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("orchest_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const toggleFavorite = (trackId: string) => {
    toast.success(favorites.includes(trackId) ? "أزيل العمل من المفضلة" : "أضيف العمل إلى المفضلة");
    setFavorites((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId],
    );
  };

  const toggleCompareTrack = (track: Track) => {
    if (comparisonTracks.some((item) => item.id === track.id)) {
      setComparisonTracks((current) => current.filter((item) => item.id !== track.id));
      return;
    }
    if (comparisonTracks.length >= 2) {
      toast.error("يمكن مقارنة عملين فقط في كل مرة");
      return;
    }
    setComparisonTracks((current) => [...current, track]);
  };

  // Playback handlers
  const handleTogglePlay = (track: Track) => {
    if (audioState.isPlaying && audioState.trackId === track.id) {
      audioEngine.pause();
    } else {
      trackGa4Event("track_play", {
        track_id: track.id,
        track_code: track.code,
        track_title: track.title,
      });
      setSelectedTrack(track);
      audioEngine.play(track);
    }
  };

  const startComparisonTrack = (track: Track) => {
    setSelectedTrack(track);
    trackGa4Event("track_play", {
      track_id: track.id,
      track_code: track.code,
      track_title: track.title,
      playback_context: "comparison",
    });
    audioEngine.play(track);
  };

  const handleNextTrack = () => {
    if (!selectedTrack) return;
    const currentIndex = tracks.findIndex((t) => t.id === selectedTrack.id);
    const nextTrack = tracks[(currentIndex + 1) % tracks.length];
    if (!nextTrack) return;
    setSelectedTrack(nextTrack);
    audioEngine.play(nextTrack);
  };

  const handlePrevTrack = () => {
    if (!selectedTrack) return;
    const currentIndex = tracks.findIndex((t) => t.id === selectedTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    const prevTrack = tracks[prevIndex];
    if (!prevTrack) return;
    setSelectedTrack(prevTrack);
    audioEngine.play(prevTrack);
  };

  // Order Handlers
  const openOrderModalForTrack = (track: Track) => {
    trackGa4Event("order_modal_open", { track_id: track.id, track_code: track.code });
    setOrderModalTrack(track);
    setIsOrderModalOpen(true);
  };

  const handleSubmitOrder = async (
    order: OrderRequest,
    guard: { formStartedAt: number; website: string },
  ) => {
    if (!whatsappNumber.trim()) {
      throw new Error("رقم واتساب غير مهيأ في إعدادات قاعدة البيانات؛ لم يُسجل الطلب.");
    }
    await saveOrder(order, guard);
    setOrders((prev) => [order, ...prev]);
    if (adminCsrfToken) void loadAdminOrders({ offset: 0, limit: 25, includeMetrics: true });
    toast.success("تم حفظ الطلب", { description: "أكمل التأكيد في محادثة واتساب" });
  };

  // Admin Handlers
  const handleAddTrack = (newTrack: Track) => {
    setTracks((prev) => [newTrack, ...prev]);
    void persist({ action: "addTrack", track: newTrack }, "تم حفظ العمل");
  };

  const handleUpdateTrack = (track: Track) => {
    const previous = tracks.find((current) => current.id === track.id);
    setTracks((prev) => prev.map((t) => (t.id === track.id ? track : t)));
    void (async () => {
      const saved = await persist({ action: "updateTrack", track }, "تم حفظ التعديلات");
      if (saved && previous && previous.isPublished !== track.isPublished) {
        await persist(
          { action: "setTrackPublished", id: track.id, value: track.isPublished !== false },
          track.isPublished === false ? "تم حفظ العمل كمسودة" : "تم نشر العمل",
        );
      }
    })();
  };

  const handleDeleteTrack = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
    void persist({ action: "deleteTrack", id });
  };

  const handleToggleTrackPublished = (id: string) => {
    const track = tracks.find((t) => t.id === id);
    if (!track) return;
    const isPublished = track.isPublished === false;
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, isPublished } : t)));
    void persist(
      { action: "setTrackPublished", id, value: isPublished },
      isPublished ? "تم نشر العمل" : "تم إخفاء العمل مؤقتاً",
    );
  };

  const handleAddArtist = (artist: Artist) => {
    setArtists((prev) => [...prev, artist]);
    void persist({ action: "addArtist", artist }, "تمت إضافة الفنان");
  };

  const handleUpdateArtist = (artist: Artist) => {
    setArtists((prev) => prev.map((current) => (current.id === artist.id ? artist : current)));
    void persist({ action: "updateArtist", artist }, "تم حفظ بيانات الفنان");
  };

  const handleDeleteArtist = (id: string) => {
    setArtists((prev) => prev.filter((artist) => artist.id !== id));
    void persist({ action: "deleteArtist", id }, "تم حذف الفنان");
  };

  const handleToggleTrend = (id: string) => {
    const current = tracks.find((t) => t.id === id);
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, isTrend: !t.isTrend } : t)));
    void persist({ action: "setTrend", id, value: !current?.isTrend });
  };

  // Filtered tracks for catalog and search
  const visibleTracks = filterTracks(tracks, searchQuery, selectedCategory, selectedRhythm);
  const trendingTracks = tracks.filter((t) => t.isTrend);
  const favoriteTracks = tracks.filter((t) => favorites.includes(t.id));

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen flex flex-col font-['Alexandria',sans-serif] transition-colors duration-200 ${
        isDark ? "bg-[#0B0B0E] text-[#F3F4F6]" : "bg-[#F9F9FB] text-[#111827]"
      } pb-36 sm:pb-24`}
    >
      {/* 1. Header (Sticky) */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        currentView={currentView}
        onNavigate={(view, catId) => {
          setCurrentView(view);
          if (catId) {
            setSelectedCategory(catId as CategoryId);
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onQuickOrder={() => {
          const t = selectedTrack ?? tracks[0];
          if (t) openOrderModalForTrack(t);
        }}
        onOpenConcierge={() => setIsAiConciergeOpen(true)}
        favoritesCount={favorites.length}
      />

      {/* Main Content Router */}
      <main
        key={currentView}
        className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        {/* VIEW 1: HOME PAGE */}
        {currentView === "home" && (
          <div>
            {/* Hero Section */}
            <Hero
              theme={theme}
              themeSettings={themeSettings}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={(catId) => {
                setSelectedCategory(catId);
                setCurrentView("catalog");
              }}
              onExploreClick={() => {
                const el = document.getElementById("trending-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            />

            {/* Categories Section (أقسامنا) */}
            <CategoryGrid
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(catId) => {
                setSelectedCategory(catId);
                setCurrentView("catalog");
              }}
              theme={theme}
              onViewAll={() => setCurrentView("catalog")}
            />

            {/* Trending Tracks Section (الأعمال الرائجة) */}
            <section id="trending-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                      الأعمال الرائجة والأكثر طلباً
                    </h2>
                  </div>
                  <p
                    className={`text-xs sm:text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    أحدث الزفات والشيلات المنفذة بأعلى طلب من زبائن استوديو أوركست
                  </p>
                </div>

                <button
                  onClick={() => setCurrentView("catalog")}
                  className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#D4AF37] hover:underline cursor-pointer"
                >
                  <span>عرض الكل ({tracksTotal})</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of Track Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {trendingTracks.slice(0, 4).map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    isCompared={comparisonTracks.some((item) => item.id === track.id)}
                    onToggleCompare={toggleCompareTrack}
                    isPlaying={audioState.isPlaying && audioState.trackId === track.id}
                    onTogglePlay={(e) => {
                      e.stopPropagation();
                      handleTogglePlay(track);
                    }}
                    onOpenDetails={() => {
                      setSelectedTrack(track);
                      setCurrentView("track-details");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onOrderClick={(e) => {
                      e.stopPropagation();
                      openOrderModalForTrack(track);
                    }}
                    isFavorite={favorites.includes(track.id)}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      toggleFavorite(track.id);
                    }}
                    theme={theme}
                  />
                ))}
              </div>
            </section>

            <OffersSection
              offers={offers}
              enabled={themeSettings.enableOffersSection}
              onContact={(message) => {
                window.open(generateWhatsAppUrl(whatsappNumber, message), "_blank");
              }}
            />

            {/* Artists Showcase Section (فنانو أوركست) */}
            <ArtistsSection
              artists={artists}
              onSelectArtist={handleSelectArtist}
              theme={theme}
              onViewAll={() => {
                setCurrentView("artists");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />

            {/* Studio Features / Value Proposition */}
            <section
              className={`py-14 border-y ${isDark ? "bg-[#16161C]/50 border-white/5" : "bg-white border-black/5"}`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                    لماذا يختار العرسان أوركست؟
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black mt-2">
                    فخامة النغمة وهيبة الحضور في ليلتك الكبرى
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div
                    className={`p-6 rounded-3xl border transition-all ${isDark ? "bg-[#16161C] border-white/10" : "bg-[#F9F9FB] border-black/10"}`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center mb-4">
                      <Headphones className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">تسجيل استوديو ماسترينغ نقي</h4>
                    <p
                      className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      أعلى مستويات النقاء الصوتي (Lossless Studio Quality) المصممة خصيصاً لمكبرات
                      صالات الأفراح وقصور الأفراح لضمان عدم وجود أي تشويش.
                    </p>
                  </div>

                  <div
                    className={`p-6 rounded-3xl border transition-all ${isDark ? "bg-[#16161C] border-white/10" : "bg-[#F9F9FB] border-black/10"}`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">تعديل خاص وحصري بالأسماء</h4>
                    <p
                      className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      إمكانية إضافة أسماء العروسين وأهلهم، وتعديل الكلمات، وإضافة أبيات شعرية
                      ترحيبية خاصة بأصوات ألمع منشدي الخليج.
                    </p>
                  </div>

                  <div
                    className={`p-6 rounded-3xl border transition-all ${isDark ? "bg-[#16161C] border-white/10" : "bg-[#F9F9FB] border-black/10"}`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center mb-4">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">طلب مباشر عبر واتساب الاستوديو</h4>
                    <p
                      className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      بضغطة زر واحدة يتم تجهيز كود العمل ورابطه وتفاصيل طلبك، لتتواصل مع مهندس الصوت
                      مباشرة وتبدأ التنفيذ دون تعقيدات.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: FULL CATALOG */}
        {currentView === "catalog" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {/* Header with Title & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  جميع الأعمال الصوتية
                </h1>
                <p
                  className={`text-xs sm:text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  استمع واكتشف الأعمال الصوتية — تم تحميل {tracks.length} من {tracksTotal} عملاً
                </p>
              </div>

              {/* Rhythm Filter Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400">نوع الإيقاع:</span>
                <select
                  value={selectedRhythm}
                  onChange={(e) => setSelectedRhythm(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border outline-none cursor-pointer ${
                    isDark
                      ? "bg-[#16161C] border-white/10 text-white"
                      : "bg-white border-black/10 text-black"
                  }`}
                >
                  <option value="all">جميع الإيقاعات</option>
                  <option value="بدون موسيقى">بدون موسيقى</option>
                  <option value="دفوف">دفوف</option>
                  <option value="أوركسترا">أوركسترا</option>
                </select>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === "all"
                    ? "bg-[#D4AF37] text-black shadow-md"
                    : isDark
                      ? "bg-[#16161C] border border-white/10 text-gray-300 hover:border-[#D4AF37]/50"
                      : "bg-white border border-black/10 text-gray-700 hover:border-[#B89728]/50"
                }`}
              >
                الكل ({tracksTotal})
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    selectedCategory === cat.id
                      ? "bg-[#D4AF37] text-black shadow-md"
                      : isDark
                        ? "bg-[#16161C] border border-white/10 text-gray-300 hover:border-[#D4AF37]/50"
                        : "bg-white border border-black/10 text-gray-700 hover:border-[#B89728]/50"
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>

            {/* Grid of Results */}
            {visibleTracks.length === 0 ? (
              <div className="text-center py-16">
                <Music className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-40" />
                <h3 className="font-bold text-lg mb-1">لا توجد أعمال تطابق الفلاتر المحددة</h3>
                <p className="text-xs text-gray-400">جرب تغيير نوع الإيقاع أو مسح البحث</p>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedRhythm("all");
                    setSearchQuery("");
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#D4AF37] text-black font-semibold text-xs cursor-pointer"
                >
                  إعادة ضبط الفلاتر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {visibleTracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    isCompared={comparisonTracks.some((item) => item.id === track.id)}
                    onToggleCompare={toggleCompareTrack}
                    isPlaying={audioState.isPlaying && audioState.trackId === track.id}
                    onTogglePlay={(e) => {
                      e.stopPropagation();
                      handleTogglePlay(track);
                    }}
                    onOpenDetails={() => {
                      setSelectedTrack(track);
                      setCurrentView("track-details");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onOrderClick={(e) => {
                      e.stopPropagation();
                      openOrderModalForTrack(track);
                    }}
                    isFavorite={favorites.includes(track.id)}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      toggleFavorite(track.id);
                    }}
                    theme={theme}
                  />
                ))}
              </div>
            )}
            {tracks.length < tracksTotal && (
              <div className="mt-8 text-center">
                <p className="mb-3 text-xs text-gray-500">
                  معروض {tracks.length} من {tracksTotal} عملاً
                </p>
                <button
                  type="button"
                  onClick={() => void handleLoadMoreTracks()}
                  disabled={isLoadingMoreTracks}
                  className="rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black transition-opacity disabled:opacity-50"
                >
                  {isLoadingMoreTracks ? "جارٍ تحميل الأعمال…" : "تحميل المزيد من الأعمال"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: TRACK DETAILS VIEW */}
        {currentView === "track-details" && selectedTrack && (
          <TrackDetailsView
            track={selectedTrack}
            allTracks={tracks}
            isPlaying={audioState.isPlaying && audioState.trackId === selectedTrack.id}
            currentTime={audioState.trackId === selectedTrack.id ? audioState.currentTime : 0}
            duration={
              audioState.trackId === selectedTrack.id ? audioState.duration : selectedTrack.duration
            }
            volume={audioState.volume}
            isMuted={audioState.isMuted}
            onTogglePlay={() => handleTogglePlay(selectedTrack)}
            onSeek={(sec) => audioEngine.seek(sec)}
            onSkip={(sec) => audioEngine.skip(sec)}
            onVolumeChange={(vol) => audioEngine.setVolume(vol)}
            onToggleMute={() => audioEngine.toggleMute()}
            onOrderClick={() => openOrderModalForTrack(selectedTrack)}
            onBack={() => setCurrentView("catalog")}
            onSelectTrack={(t) => {
              setSelectedTrack(t);
              handleTogglePlay(t);
            }}
            isFavorite={favorites.includes(selectedTrack.id)}
            onToggleFavorite={() => toggleFavorite(selectedTrack.id)}
            theme={theme}
            onOrderOtherTrack={(t) => openOrderModalForTrack(t)}
            favorites={favorites}
            onToggleFavoriteTrack={(id) => toggleFavorite(id)}
          />
        )}

        {/* VIEW 4: FAVORITES */}
        {currentView === "favorites" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                <span>أعمالك المفضلة</span>
              </h1>
              <p
                className={`text-xs sm:text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                الأعمال التي قمت بحفظها للمقارنة واختيار زفة زفافك أو مناسبتك
              </p>
            </div>

            {favoriteTracks.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-30" />
                <h3 className="font-bold text-lg mb-1">قائمة المفضلة فارغة حالياً</h3>
                <p className="text-xs text-gray-400">
                  انقر على أيقونة القلب على أي زفة لحفظها والرجوع إليها لاحقاً
                </p>
                <button
                  onClick={() => setCurrentView("catalog")}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#D4AF37] text-black font-semibold text-xs cursor-pointer"
                >
                  استعراض الأعمال
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {favoriteTracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    isCompared={comparisonTracks.some((item) => item.id === track.id)}
                    onToggleCompare={toggleCompareTrack}
                    isPlaying={audioState.isPlaying && audioState.trackId === track.id}
                    onTogglePlay={(e) => {
                      e.stopPropagation();
                      handleTogglePlay(track);
                    }}
                    onOpenDetails={() => {
                      setSelectedTrack(track);
                      setCurrentView("track-details");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onOrderClick={(e) => {
                      e.stopPropagation();
                      openOrderModalForTrack(track);
                    }}
                    isFavorite={true}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      toggleFavorite(track.id);
                    }}
                    theme={theme}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: ARTISTS CATALOG (جميع الفنانين) */}
        {currentView === "artists" && (
          <div className="py-8 animate-fade-in">
            <ArtistsSection
              artists={artists}
              onSelectArtist={handleSelectArtist}
              theme={theme}
              isStandalone={true}
            />
          </div>
        )}

        {/* VIEW 6: ARTIST DETAILS VIEW (صفحة أعمال الفنان) */}
        {currentView === "artist-details" && selectedArtist && (
          <ArtistDetailsView
            artist={selectedArtist}
            tracks={tracks}
            onBack={() => {
              setCurrentView("artists");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onSelectTrack={(t) => {
              setSelectedTrack(t);
              setCurrentView("track-details");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onTogglePlay={handleTogglePlay}
            onOrderTrack={(t) => openOrderModalForTrack(t)}
            activeTrackId={selectedTrack?.id || null}
            isPlaying={audioState.isPlaying}
            theme={theme}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            whatsappNumber={whatsappNumber}
          />
        )}

        {/* VIEW 7: ADMIN DASHBOARD */}
        {currentView === "admin" &&
          (isAdminAuthenticated && adminCsrfToken ? (
            <Suspense
              fallback={
                <div
                  className="mx-auto max-w-7xl px-4 py-12 text-center text-sm text-gray-500"
                  role="status"
                >
                  جارٍ تحميل لوحة الإدارة…
                </div>
              }
            >
              <AdminDashboard
                tracks={tracks}
                artists={artists}
                orders={orders}
                totalOrders={totalOrders}
                categories={categories}
                offers={adminOffers}
                themeSettings={themeSettings}
                kpi={kpi}
                whatsappNumber={whatsappNumber}
                onUpdateWhatsAppNumber={handleUpdateWhatsAppNumber}
                onAddTrack={handleAddTrack}
                onUpdateTrack={handleUpdateTrack}
                onDeleteTrack={handleDeleteTrack}
                onToggleTrackPublished={handleToggleTrackPublished}
                onToggleTrend={handleToggleTrend}
                onAddArtist={handleAddArtist}
                onUpdateArtist={handleUpdateArtist}
                onDeleteArtist={handleDeleteArtist}
                onLoadOrders={loadAdminOrders}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onReorderCategories={handleReorderCategories}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                theme={theme}
                csrfToken={adminCsrfToken}
                onLogout={handleAdminLogout}
                onBackToStore={() => setCurrentView("home")}
                onRefreshConfig={refreshAdminConfig}
              />
            </Suspense>
          ) : (
            <AdminLogin
              theme={theme}
              onAuthenticated={() => {
                void loadAdminSession();
              }}
              onCancel={() => setCurrentView("home")}
            />
          ))}
      </main>

      {/* 2. Persistent Floating Sticky Audio Player */}
      {selectedTrack && (
        <StickyAudioPlayer
          track={selectedTrack}
          isPlaying={audioState.isPlaying && audioState.trackId === selectedTrack.id}
          currentTime={audioState.trackId === selectedTrack.id ? audioState.currentTime : 0}
          duration={
            audioState.trackId === selectedTrack.id ? audioState.duration : selectedTrack.duration
          }
          volume={audioState.volume}
          isMuted={audioState.isMuted}
          error={audioState.trackId === selectedTrack.id ? audioState.error : null}
          onTogglePlay={() => handleTogglePlay(selectedTrack)}
          onSeek={(sec) => audioEngine.seek(sec)}
          onSkip={(sec) => audioEngine.skip(sec)}
          onNext={handleNextTrack}
          onPrev={handlePrevTrack}
          onVolumeChange={(vol) => audioEngine.setVolume(vol)}
          onToggleMute={() => audioEngine.toggleMute()}
          onOpenDetails={() => {
            setCurrentView("track-details");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onOrderClick={() => openOrderModalForTrack(selectedTrack)}
          onClose={() => {
            audioEngine.stop();
            setSelectedTrack(null);
          }}
          theme={theme}
        />
      )}

      <TrackComparisonPanel
        tracks={comparisonTracks}
        onRemove={(trackId) =>
          setComparisonTracks((current) => current.filter((track) => track.id !== trackId))
        }
        onStartTrack={startComparisonTrack}
        onPause={() => audioEngine.pause()}
      />

      {/* 3. Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        favoritesCount={favorites.length}
        onWhatsAppContact={() => {
          if (!whatsappNumber.trim()) {
            toast.error("رقم واتساب غير مهيأ في قاعدة البيانات.");
            return;
          }
          window.open(
            generateWhatsAppUrl(
              whatsappNumber,
              "مرحباً استوديو أوركست، أود الاستفسار عن تفاصيل الزفات والشيلات",
            ),
            "_blank",
          );
        }}
        theme={theme}
      />

      {/* 4. Smart WhatsApp Order Modal (and Mobile Bottom Sheet) */}
      {isOrderModalOpen && orderModalTrack && (
        <OrderModal
          track={orderModalTrack}
          isOpen
          onClose={() => setIsOrderModalOpen(false)}
          onSubmitOrder={handleSubmitOrder}
          theme={theme}
          whatsappNumber={whatsappNumber}
        />
      )}

      <Toaster position="top-center" dir="rtl" richColors />

      {/* 5. Instant Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        tracks={tracks}
        onSelectTrack={(t) => {
          setSelectedTrack(t);
          setCurrentView("track-details");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        theme={theme}
      />

      {/* 6. AI Concierge chat modal; its entry point lives in the header to avoid bottom collisions. */}

      <AiConciergeModal
        isOpen={isAiConciergeOpen}
        onClose={() => setIsAiConciergeOpen(false)}
        tracks={tracks}
        onSelectTrack={(t) => {
          setSelectedTrack(t);
          handleTogglePlay(t);
        }}
        onOrderTrack={(t, note) => {
          setIsAiConciergeOpen(false);
          openOrderModalForTrack(t);
        }}
        activeTrackId={selectedTrack?.id || null}
        isPlaying={audioState.isPlaying}
        theme={theme}
      />
      <AnalyticsConsentBanner />
    </div>
  );
}
