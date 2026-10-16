import { adminHeaders } from '../utils/adminAuth';
import { toast } from 'sonner';
import React, { useState } from 'react';
import { 
  Users, 
  Headphones, 
  MessageCircle, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Upload, 
  Youtube, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  ArrowUpRight,
  ChevronLeft,
  X,
  Settings,
  Download,
  FileSpreadsheet,
  Database,
  Phone,
  Check,
  AlertCircle,
  Layers,
  FolderPlus
} from 'lucide-react';
import { Track, OrderRequest, KPIData, ThemeMode, RhythmType, CategoryId, Category } from '../types/index';
import { 
  formatCommas, 
  formatNumberK, 
  validateWhatsAppNumber, 
  exportOrdersToCSV, 
  exportFullBackupJSON 
} from '../utils/trackLogic';
import { ImageUploader } from './ImageUploader';

interface AdminDashboardProps {
  tracks: Track[];
  orders: OrderRequest[];
  categories: Category[];
  kpi: KPIData;
  whatsappNumber: string;
  onUpdateWhatsAppNumber: (newNumber: string) => void;
  onAddTrack: (newTrack: Track) => void;
  onDeleteTrack: (id: string) => void;
  onToggleTrend: (id: string) => void;
  onAddCategory: (newCategory: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onReorderCategories: (fromId: string, toId: string) => void;
  theme: ThemeMode;
  csrfToken: string;
  onLogout: () => void;
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  tracks,
  orders,
  categories,
  kpi,
  whatsappNumber,
  onUpdateWhatsAppNumber,
  onAddTrack,
  onDeleteTrack,
  onToggleTrend,
  onAddCategory,
  onDeleteCategory,
  onReorderCategories,
  theme,
  csrfToken,
  onLogout,
  onBackToStore,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tracks' | 'categories' | 'orders' | 'analytics' | 'settings'>('tracks');
  const [searchTerm, setSearchTerm] = useState('');

  // Settings & WhatsApp State
  const [inputWhatsApp, setInputWhatsApp] = useState(whatsappNumber);
  const [whatsAppSaveSuccess, setWhatsAppSaveSuccess] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState(() => {
    return localStorage.getItem('orchest_last_backup') || '2026-10-15 14:00';
  });

  // Validation for WhatsApp
  const phoneValidation = validateWhatsAppNumber(inputWhatsApp);

  const handleSaveWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneValidation.isValid) return;

    onUpdateWhatsAppNumber(phoneValidation.sanitized);
    setWhatsAppSaveSuccess(true);
    setTimeout(() => setWhatsAppSaveSuccess(false), 4000);
  };

  const handleDownloadBackupJSON = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      studioName: 'أوركست ستوديو | Orchest Studio',
      settings: {
        whatsappNumber,
        currency: 'SAR',
        platformStatus: 'active',
      },
      tracks,
      categories,
      orders,
    };

    const jsonString = exportFullBackupJSON(backupData);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.href = url;
    link.setAttribute('download', `orchest_backup_${nowStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const nowFormatted = new Date().toLocaleString('ar-SA');
    setLastBackupDate(nowFormatted);
    localStorage.setItem('orchest_last_backup', nowFormatted);
  };

  const handleDownloadOrdersCSV = () => {
    const csvContent = exportOrdersToCSV(orders);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.href = url;
    link.setAttribute('download', `orchest_orders_${nowStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const nowFormatted = new Date().toLocaleString('ar-SA');
    setLastBackupDate(nowFormatted);
    localStorage.setItem('orchest_last_backup', nowFormatted);
  };

  // New track form state
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newCode, setNewCode] = useState(`#ORC-${Math.floor(100 + Math.random() * 900)}`);
  const [newCategory, setNewCategory] = useState<CategoryId>('zaffat-bride');
  const [newRhythm, setNewRhythm] = useState<RhythmType>('بدون موسيقى');
  const [newDuration, setNewDuration] = useState('04:30');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isNewTrend, setIsNewTrend] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generatedSeo, setGeneratedSeo] = useState<any>(null);

  const isDark = theme === 'dark';

  // Categories management state
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatImage, setNewCatImage] = useState('');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error('يرجى إدخال اسم التصنيف');
      return;
    }

    const slug = `cat-${Date.now()}`;
    const newCat: Category = {
      id: slug,
      name: newCatName.trim(),
      description: newCatDescription.trim() || 'تصنيف مخصص تم إنشاؤه عبر لوحة تحكم الاستوديو',
      image: newCatImage.trim() || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
      count: 0,
    };

    onAddCategory(newCat);
    setIsAddCategoryModalOpen(false);
    setNewCatName('');
    setNewCatDescription('');
    setNewCatImage('');
  };

  const handleCreateTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArtist.trim()) {
      toast.error('يرجى إدخال اسم العمل واسم المنشد');
      return;
    }

    const durationSec = 270;
    const matchingCat = categories.find((c) => c.id === newCategory);
    const categoryLabel = matchingCat ? matchingCat.name : 'زفات';

    const created: Track = {
      id: `orc-${Date.now()}`,
      title: newTitle.trim(),
      artist: newArtist.trim(),
      code: newCode.trim(),
      duration: durationSec,
      durationFormatted: newDuration,
      playsCount: 1,
      likesCount: 1,
      rhythm: newRhythm,
      categoryId: newCategory,
      categoryLabel,
      coverUrl: newCoverUrl.trim() || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
      isTrend: isNewTrend,
      isExclusive: true,
      executionDays: '1-3 أيام',
      suitableFor: ['زفاف', 'مناسبة خاصة'],
      createdAt: new Date().toISOString().substring(0, 10),
      description: newDescription.trim() || 'عمل صوتي تم إنشاؤه وتوزيعه عبر استوديو أوركست الخليجي',
      audioFreq: 261.63,
    };

    onAddTrack(created);
    setIsAddModalOpen(false);
    // Reset form
    setNewTitle('');
    setNewArtist('');
    setNewDescription('');
    setGeneratedSeo(null);
    setNewCoverUrl('');
    setNewCode(`#ORC-${Math.floor(100 + Math.random() * 900)}`);
  };

  const filteredTracks = tracks.filter(
    (t) =>
      t.title.includes(searchTerm) ||
      t.artist.includes(searchTerm) ||
      t.code.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={onBackToStore}
              className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>العودة للمنصة</span>
            </button>
            <span className="text-gray-500">•</span>
            <span className="text-xs text-gray-400">لوحة تحكم الاستوديو (Studio Admin)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <span>لوحة التحكم والإحصائيات</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
              Live
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 cursor-pointer active:scale-95 transition-all"
          >
            <FolderPlus className="w-4 h-4 text-[#D4AF37]" />
            <span>إضافة تصنيف جديد</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#D4AF37] hover:bg-[#c29f2f] text-black shadow-lg cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عمل جديد</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-red-300 border border-red-400/30 hover:bg-red-500/10 cursor-pointer"
          >
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards matching Screenshot 1 & 3 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: إجمالي الزيارات */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-[#16161C] border-white/10' : 'bg-white border-black/10 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-3">
            <span>إجمالي الزيارات</span>
            <Users className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {formatCommas(kpi.totalVisits)}
          </div>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12% عن الشهر السابق</span>
          </div>
        </div>

        {/* Card 2: الاستماعات */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-[#16161C] border-white/10' : 'bg-white border-black/10 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-3">
            <span>الاستماعات الصوتية</span>
            <Headphones className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {formatCommas(kpi.totalStreams)}
          </div>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18% تفاعل نشط</span>
          </div>
        </div>

        {/* Card 3: طلبات واتساب */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-[#16161C] border-white/10' : 'bg-white border-black/10 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-3">
            <span>طلبات واتساب المحولة</span>
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-[#25D366]">
            {formatCommas(kpi.whatsappLeads)}
          </div>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+34% طلبات جديدة</span>
          </div>
        </div>

        {/* Card 4: نسبة التحويل */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-[#16161C] border-white/10' : 'bg-white border-black/10 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-3">
            <span>نسبة التحويل (Conversion)</span>
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-[#D4AF37]">
            {kpi.conversionRate}%
          </div>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+22% أداء قياسي</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-6">
        <button
          onClick={() => setActiveTab('tracks')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'tracks'
              ? 'bg-[#D4AF37] text-black shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          إدارة الأعمال الصوتية ({tracks.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'bg-[#D4AF37] text-black shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>إدارة التصنيفات ({categories.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-[#D4AF37] text-black shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          سجل طلبات واتساب ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#D4AF37] text-black shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          التحليلات والمخططات
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-[#D4AF37] text-black shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>الإعدادات والنسخ الاحتياطي</span>
        </button>
      </div>

      {/* Tab 1: Media Manager Table */}
      {activeTab === 'tracks' && (
        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-[#16161C] border-white/10' : 'bg-white border-black/10 shadow-sm'
          }`}
        >
          {/* Table Search & Controls */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث في الأعمال..."
                className={`w-full pr-9 pl-4 py-2 text-sm rounded-xl border outline-none ${
                  isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-black'
                }`}
              />
            </div>
            <span className="text-xs text-gray-400">{filteredTracks.length} عمل معروض</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead
                className={`text-xs uppercase font-medium border-b ${
                  isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-black/10 text-gray-600'
                }`}
              >
                <tr>
                  <th className="p-4">العمل الصوتي</th>
                  <th className="p-4">التصنيف</th>
                  <th className="p-4">الإيقاع</th>
                  <th className="p-4">الاستماعات</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">ترند</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTracks.map((tr) => (
                  <tr
                    key={tr.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={tr.coverUrl}
                        alt={tr.title}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-bold text-sm">{tr.title}</div>
                        <div className="text-xs text-gray-400">
                          {tr.artist} • <span dir="ltr" className="font-mono text-[#D4AF37]">{tr.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs">{tr.categoryLabel}</td>
                    <td className="p-4 text-xs font-semibold">{tr.rhythm}</td>
                    <td className="p-4 font-mono text-xs">{formatNumberK(tr.playsCount)}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        نشط
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => onToggleTrend(tr.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          tr.isTrend
                            ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                            : 'bg-black/5 dark:bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {tr.isTrend ? (
                          <>
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>مميز ترند</span>
                          </>
                        ) : (
                          <span>عادي</span>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onDeleteTrack(tr.id)}
                          aria-label={`حذف ${tr.title}`}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Categories Management (إدارة التصنيفات) */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#D4AF37]" />
                <span>تصنيفات المنصة والأقسام الصوتية</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                إدارة أقسام الزفات والشيلات، وتحديد أغلفة الأقسام من ملفاتك المحلية أو معرض الاستوديو
              </p>
            </div>
            <button
              onClick={() => setIsAddCategoryModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c29f2f] text-black font-bold text-xs sm:text-sm cursor-pointer shadow-md transition-all flex items-center gap-1.5"
            >
              <FolderPlus className="w-4 h-4" />
              <span>إضافة تصنيف جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const catTracksCount = tracks.filter((t) => t.categoryId === cat.id).length;
              const isDefaultSystemCategory = ['zaffat-bride', 'zaffat-dufoof', 'sheilat-enthusiastic', 'welcoming', 'babies'].includes(cat.id);

              return (
                <div
                  key={cat.id}
                  draggable
                  onDragStart={() => setDraggedCategoryId(cat.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedCategoryId) onReorderCategories(draggedCategoryId, cat.id);
                    setDraggedCategoryId(null);
                  }}
                  onDragEnd={() => setDraggedCategoryId(null)}
                  title="اسحب لإعادة الترتيب"
                  className={`${draggedCategoryId === cat.id ? 'opacity-50' : ''} cursor-grab active:cursor-grabbing group relative rounded-3xl border overflow-hidden flex flex-col justify-between transition-all duration-300 ${
                    isDark ? 'bg-[#16161C] border-white/10 hover:border-[#D4AF37]/50' : 'bg-white border-black/10 hover:border-[#B89728]/50 shadow-sm'
                  }`}
                >
                  <div className="relative aspect-video w-full overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/30">
                      {catTracksCount} عمل صوتي
                    </span>
                    <h4 className="absolute bottom-3 right-3 text-lg font-bold text-white">
                      {cat.name}
                    </h4>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">
                      {cat.description}
                    </p>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-gray-500">ID: {cat.id}</span>
                      {!isDefaultSystemCategory ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف تصنيف "${cat.name}"؟`)) {
                              onDeleteCategory(cat.id);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف التصنيف</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-500">تصنيف أساسي</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: WhatsApp Order Logs matching Screenshot 1 & 3 */}
      {activeTab === 'orders' && (
        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-[#16161C] border-white/10' : 'bg-white border-black/10 shadow-sm'
          }`}
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>سجل طلبات واتساب الواردة من الزوار</span>
            </h3>
            <span className="text-xs text-gray-400">{orders.length} طلب مسجل</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead
                className={`text-xs uppercase font-medium border-b ${
                  isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-black/10 text-gray-600'
                }`}
              >
                <tr>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">الاسم / العروسين</th>
                  <th className="p-4">العمل الصوتي</th>
                  <th className="p-4">نوع التعديل</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">تواصل سريع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((ord) => (
                  <tr
                    key={ord.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="p-4 text-xs font-mono text-gray-400">{ord.timestamp}</td>
                    <td className="p-4 font-bold">{ord.clientNames}</td>
                    <td className="p-4">
                      <span className="font-semibold">{ord.trackTitle}</span>
                      <span className="text-xs font-mono text-[#D4AF37] mr-1.5">{ord.trackCode}</span>
                    </td>
                    <td className="p-4 text-xs">{ord.modificationType}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          ord.status === 'مكتمل'
                            ? 'bg-blue-500/20 text-blue-400'
                            : ord.status === 'قيد التنفيذ'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`مرحباً أستاذ ${ord.clientNames}، بخصوص طلبكم لـ ${ord.trackTitle}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 text-xs font-bold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>فتح واتساب</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Analytics & Visual Insights matching Screenshot 1 & 3 */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: الأعمال الأكثر طلباً */}
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#16161C] border-white/10' : 'bg-white border-black/10 shadow-sm'
            }`}
          >
            <h3 className="font-bold text-lg mb-6 flex items-center justify-between">
              <span>الأعمال الأكثر طلباً وتأثيراً</span>
              <span className="text-xs text-gray-400 font-normal">آخر 30 يوم</span>
            </h3>

            <div className="space-y-4">
              {[
                { name: 'زفات الدفوف الملكية', count: 1284, percent: 85 },
                { name: 'الشيلات الحماسية الفاخرة', count: 962, percent: 65 },
                { name: 'زفات العروس الكلاسيكية', count: 856, percent: 58 },
                { name: 'زفات الدفوف السريعة', count: 612, percent: 42 },
                { name: 'مواليد واستقبال', count: 241, percent: 20 },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs sm:text-sm font-semibold mb-1.5">
                    <span>{item.name}</span>
                    <span className="font-mono text-[#D4AF37]">{item.count.toLocaleString()} طلب</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] rounded-full transition-all duration-700"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: الأقسام الأكثر زيارة (نسب مئوية) */}
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#16161C] border-white/10' : 'bg-white border-black/10 shadow-sm'
            }`}
          >
            <h3 className="font-bold text-lg mb-6 flex items-center justify-between">
              <span>الأقسام الأكثر زيارة وتفاعلاً</span>
              <span className="text-xs text-gray-400 font-normal">توزيع الحصص</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'زفات عروس', share: 34, color: 'bg-[#D4AF37]' },
                { label: 'شيلات حماسية', share: 25, color: 'bg-amber-400' },
                { label: 'ترحيبية', share: 18, color: 'bg-emerald-400' },
                { label: 'زفات الدفوف', share: 14, color: 'bg-blue-400' },
                { label: 'أخرى ومواليد', share: 9, color: 'bg-purple-400' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-black/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-xs sm:text-sm font-semibold">{item.label}</span>
                  </div>
                  <span className="font-mono font-bold text-sm">{item.share}%</span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-xs leading-relaxed text-[#D4AF37]">
              💡 <strong>رؤية تسويقية:</strong> الطلب على زفات الدفوف بدون موسيقى ارتفع بنسبة 45% خلال هذا الشهر. يُوصى بإضافة 5 أعمال جديدة بالدفوف على الصفحة الرئيسية.
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Settings & System Backups matching user specification */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: بطاقة رقم الواتساب المعتمد للطلبات */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border ${
              isDark ? 'bg-[#16161C] border-white/10' : 'bg-white border-black/10 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center text-[#25D366]">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">رقم الواتساب المعتمد للطلبات</h3>
                <p className="text-xs text-gray-400">
                  الرقم الذي يستقبل رسائل الطلبات وتخصيص الأسماء من زوار المنصة
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveWhatsApp} className="space-y-5 mt-6">
              <div>
                <label className="block text-xs font-semibold mb-2">
                  رقم الواتساب بالصيغة الدولية (مع أو بدون +)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={inputWhatsApp}
                    onChange={(e) => {
                      setInputWhatsApp(e.target.value);
                      setWhatsAppSaveSuccess(false);
                    }}
                    placeholder="+966500000000 أو 967770000000"
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-mono tracking-wider outline-none transition-all ${
                      isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-black'
                    } ${
                      phoneValidation.isValid
                        ? 'focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]'
                        : 'focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {phoneValidation.isValid ? (
                      <Check className="w-5 h-5 text-[#25D366]" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                    )}
                  </div>
                </div>

                {/* Validation alert / note */}
                <div className="mt-2.5 flex items-center gap-2 text-xs">
                  {phoneValidation.isValid ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>صيغة دولية صالحة: {phoneValidation.formatted}</span>
                    </span>
                  ) : (
                    <span className="text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{phoneValidation.error}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Success Notification */}
              {whatsAppSaveSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>
                    تم حفظ رقم الواتساب بنجاح! تم تحديث كافة روابط الطلب المباشر في المنصة فوراً.
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!phoneValidation.isValid}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التغييرات (Save Settings)</span>
                </button>

                <a
                  href={`https://wa.me/${phoneValidation.sanitized}?text=${encodeURIComponent('تجربة رابط الواتساب من لوحة تحكم أوركست')}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full sm:w-auto px-4 py-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    isDark ? 'border-white/10 hover:bg-white/5 text-gray-300' : 'border-black/10 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  اختبار فتح الرقم 💬
                </a>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-[11px] leading-relaxed text-gray-400">
                🔒 يتم حفظ الرقم في إعدادات المنصة العامة (Settings)، وتتغير روابط الطلبات في كل بطاقة عمل وصفحة التفاصيل ونموذج الطلب الذكي في نفس اللحظة بدون الحاجة لإعادة نشر التطبيق.
              </div>
            </form>
          </div>

          {/* Card 2: بطاقة النسخ الاحتياطي وتصدير البيانات (System Backups) */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between ${
              isDark ? 'bg-[#16161C] border-white/10' : 'bg-white border-black/10 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">النسخ الاحتياطي وتصدير البيانات</h3>
                  <p className="text-xs text-gray-400">
                    تصدير الكتالوج وسجل الطلبات للحفظ أو المتابعة المحاسبية
                  </p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 my-6">
                <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-black/5'}`}>
                  <div className="text-xs text-gray-400 mb-1">الأعمال الصوتية</div>
                  <div className="font-bold font-mono text-base text-[#D4AF37]">{tracks.length}</div>
                </div>
                <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-black/5'}`}>
                  <div className="text-xs text-gray-400 mb-1">طلبات العملاء</div>
                  <div className="font-bold font-mono text-base text-[#25D366]">{orders.length}</div>
                </div>
                <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-black/30 border-white/5' : 'bg-gray-50 border-black/5'}`}>
                  <div className="text-xs text-gray-400 mb-1">التصنيفات</div>
                  <div className="font-bold font-mono text-base">{categories.length}</div>
                </div>
              </div>

              {/* Action Buttons matching specification */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleDownloadBackupJSON}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل نسخة احتياطية كاملة (JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadOrdersCSV}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير سجل الطلبات (Excel / CSV)</span>
                </button>
              </div>
            </div>

            {/* Last Backup Timestamp Footer */}
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>تاريخ آخر نسخة احتياطية:</span>
              </span>
              <span className="font-mono text-gray-300 font-semibold">{lastBackupDate}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Track (إضافة عمل جديد) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsAddModalOpen(false)} className="fixed inset-0 bg-black/75 backdrop-blur-sm" />

          <div
            className={`relative w-full max-w-lg rounded-3xl border p-6 sm:p-8 z-10 shadow-2xl ${
              isDark ? 'bg-[#16161C] border-white/10 text-white' : 'bg-white border-black/10 text-black'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h3 className="font-bold text-lg">إضافة عمل صوتي جديد إلى أوركست</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                aria-label="إغلاق النافذة"
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrack} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">اسم الزفة أو الشيلة</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: زفة مسك العروس"
                  className={`w-full px-3 py-2 text-sm rounded-xl border outline-none ${
                    isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-black'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">المنشد</label>
                  <input
                    type="text"
                    required
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    placeholder="مثال: محمد العتيبي"
                    className={`w-full px-3 py-2 text-sm rounded-xl border outline-none ${
                      isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-black'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">كود العمل</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-xl border font-mono outline-none ${
                      isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-black'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">التصنيف</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as CategoryId)}
                    className={`w-full px-3 py-2 text-sm rounded-xl border outline-none cursor-pointer ${
                      isDark ? 'bg-[#16161C] border-white/10 text-white' : 'bg-gray-50 border-black/10 text-black'
                    }`}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">نوع الإيقاع</label>
                  <select
                    value={newRhythm}
                    onChange={(e) => setNewRhythm(e.target.value as RhythmType)}
                    className={`w-full px-3 py-2 text-sm rounded-xl border outline-none cursor-pointer ${
                      isDark ? 'bg-[#16161C] border-white/10 text-white' : 'bg-gray-50 border-black/10 text-black'
                    }`}
                  >
                    <option value="بدون موسيقى">بدون موسيقى</option>
                    <option value="دفوف">دفوف</option>
                    <option value="أوركسترا">أوركسترا</option>
                  </select>
                </div>
              </div>

              <div>
                <ImageUploader
                  currentImage={newCoverUrl}
                  onSelectImage={setNewCoverUrl}
                  theme={theme}
                  label="صورة غلاف العمل (رفع ملف محلي أو اختيار من المعرض)"
                  recommendedAspect="موصى به: 800×800 بكسل"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="trendCheck"
                  checked={isNewTrend}
                  onChange={(e) => setIsNewTrend(e.target.checked)}
                  className="accent-[#D4AF37]"
                />
                <label htmlFor="trendCheck" className="text-xs cursor-pointer">
                  تمييز هذا العمل كـ "ترند" على الصفحة الرئيسية
                </label>
              </div>

              {/* AI SEO & Description Generator Action */}
              <div className="p-3.5 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#D4AF37]">
                    <Sparkles className="w-4 h-4" />
                    <span>توليد الوصف والـ SEO بالذكاء الاصطناعي (Gemini AI)</span>
                  </div>
                  <button
                    type="button"
                    disabled={!newTitle.trim() || isGeneratingAi}
                    onClick={async () => {
                      setIsGeneratingAi(true);
                      try {
                        const res = await fetch('/api/ai/generate-seo', {
                          method: 'POST',
                          credentials: 'include',
                          headers: adminHeaders({
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': csrfToken,
                          }),
                          body: JSON.stringify({
                            title: newTitle,
                            artist: newArtist,
                            category: newCategory,
                            rhythm: newRhythm,
                          }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setGeneratedSeo(data);
                          if (data.marketingDescription) {
                            setNewDescription(data.marketingDescription);
                          }
                        }
                      } catch (err) {
                        console.error('Failed to generate SEO', err);
                      } finally {
                        setIsGeneratingAi(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#c29f2f] text-black text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    {isGeneratingAi ? 'جاري التوليد...' : 'توليد تلقائي ✨'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  يولد لك وصفاً تسويقياً ملكياً مع Meta Title & Description جاهزة لمحركات البحث
                </p>

                {/* Display generated preview */}
                {generatedSeo && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#D4AF37] block font-mono">Meta SEO Title:</span>
                      <p className="text-gray-300 font-semibold">{generatedSeo.metaTitle}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#D4AF37] block font-mono">Meta Description:</span>
                      <p className="text-gray-400 text-[11px]">{generatedSeo.metaDescription}</p>
                    </div>
                    {generatedSeo.recommendedTags && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {generatedSeo.recommendedTags.map((tag: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-gray-300">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">الوصف التسويقي للعمل</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="الوصف التسويقي يظهر في صفحة تفاصيل العمل..."
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none resize-none ${
                    isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-black'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#D4AF37] text-black font-bold text-sm shadow-lg hover:bg-[#c29f2f] cursor-pointer mt-4"
              >
                حفظ وإضافة العمل
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Category (إضافة تصنيف جديد) */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsAddCategoryModalOpen(false)} className="fixed inset-0 bg-black/75 backdrop-blur-sm" />

          <div
            className={`relative w-full max-w-lg rounded-3xl border p-6 sm:p-8 z-10 shadow-2xl ${
              isDark ? 'bg-[#16161C] border-white/10 text-white' : 'bg-white border-black/10 text-black'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-bold text-lg">إضافة تصنيف صوتي جديد</h3>
              </div>
              <button
                onClick={() => setIsAddCategoryModalOpen(false)}
                aria-label="إغلاق النافذة"
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">اسم التصنيف (مثل: زفات ملكة، تخرج، استقبال VIP)</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="مثال: زفات استقبال ملكية"
                  className={`w-full px-3 py-2 text-sm rounded-xl border outline-none ${
                    isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-black'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">وصف موجز للتصنيف</label>
                <textarea
                  rows={2}
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  placeholder="وصف تسويقي للتصنيف يظهر في الصفحة الرئيسية وصفحة الكتالوج..."
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none resize-none ${
                    isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-black/10 text-black'
                  }`}
                />
              </div>

              <div>
                <ImageUploader
                  currentImage={newCatImage}
                  onSelectImage={setNewCatImage}
                  theme={theme}
                  label="صورة غلاف التصنيف (رفع ملف محلي أو اختيار من المعرض)"
                  recommendedAspect="موصى به: 800×600 بكسل"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#c29f2f] text-black font-bold text-sm shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وإضافة التصنيف</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
