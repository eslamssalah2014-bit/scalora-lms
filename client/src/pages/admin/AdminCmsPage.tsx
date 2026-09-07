import React, { useState, useEffect, useCallback } from 'react';
import { api, resolveMediaUrl } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Globe,
  Save,
  Send,
  RotateCcw,
  History,
  Eye,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  BookOpen,
  Users,
  Info,
  Shield,
  Briefcase,
  FolderOpen,
  Compass,
  Search,
  Palette,
  Copy,
  Check,
  ExternalLink,
  X,
  Star,
  FileText,
  Video,
  FileCode,
  File,
} from 'lucide-react';
import {
  CmsHomePageData,
  CmsCoursesPageData,
  CmsCommunityPageData,
  CmsAboutPageData,
  CmsTrainersData,
  CmsPartnersData,
  CmsNavigationData,
  CmsThemeData,
  CmsSeoData,
  CmsMediaItem,
  CmsRevisionItem,
} from '../../types/cms';
import {
  DEFAULT_HOME_CMS,
  DEFAULT_COURSES_CMS,
  DEFAULT_COMMUNITY_CMS,
  DEFAULT_ABOUT_CMS,
  DEFAULT_TRAINERS_CMS,
  DEFAULT_PARTNERS_CMS,
  DEFAULT_NAVIGATION_CMS,
  DEFAULT_THEME_CMS,
  DEFAULT_SEO_CMS,
} from '../../data/defaultCmsData';

type CmsTab =
  | 'home'
  | 'courses'
  | 'community'
  | 'about'
  | 'trainers'
  | 'partners'
  | 'media'
  | 'navigation'
  | 'seo'
  | 'theme';

export const AdminCmsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<CmsTab>('home');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // CMS Documents State
  const [homeData, setHomeData] = useState<CmsHomePageData>(DEFAULT_HOME_CMS);
  const [coursesData, setCoursesData] = useState<CmsCoursesPageData>(DEFAULT_COURSES_CMS);
  const [communityData, setCommunityData] = useState<CmsCommunityPageData>(DEFAULT_COMMUNITY_CMS);
  const [aboutData, setAboutData] = useState<CmsAboutPageData>(DEFAULT_ABOUT_CMS);
  const [trainersData, setTrainersData] = useState<CmsTrainersData>(DEFAULT_TRAINERS_CMS);
  const [partnersData, setPartnersData] = useState<CmsPartnersData>(DEFAULT_PARTNERS_CMS);
  const [navigationData, setNavigationData] = useState<CmsNavigationData>(DEFAULT_NAVIGATION_CMS);
  const [themeData, setThemeData] = useState<CmsThemeData>(DEFAULT_THEME_CMS);
  const [seoData, setSeoData] = useState<CmsSeoData>(DEFAULT_SEO_CMS);

  // Status & Revisions per document
  const [docMeta, setDocMeta] = useState<{
    id?: string;
    isPublished?: boolean;
    publishedAt?: string | null;
    updatedAt?: string | null;
    lastUpdatedBy?: string | null;
    revisions: CmsRevisionItem[];
  }>({ revisions: [] });

  // Media Library State
  const [mediaList, setMediaList] = useState<CmsMediaItem[]>([]);
  const [mediaFolder, setMediaFolder] = useState<string>('all');
  const [mediaSearch, setMediaSearch] = useState<string>('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('ALL');
  const [uploadingMedia, setUploadingMedia] = useState<boolean>(false);
  const [copiedMediaUrl, setCopiedMediaUrl] = useState<string | null>(null);

  // Modals
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [publishNote, setPublishNote] = useState<string>('');
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [showMediaPickerModal, setShowMediaPickerModal] = useState<boolean>(false);
  const [mediaPickerCallback, setMediaPickerCallback] = useState<((url: string) => void) | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Map Active Tab to Backend Key
  const getDocumentKey = (tab: CmsTab): string => {
    switch (tab) {
      case 'home':
        return 'page_home';
      case 'courses':
        return 'page_courses';
      case 'community':
        return 'page_community';
      case 'about':
        return 'page_about';
      case 'trainers':
        return 'trainers';
      case 'partners':
        return 'partners';
      case 'navigation':
        return 'navigation';
      case 'theme':
        return 'theme';
      case 'seo':
        return 'seo';
      default:
        return 'page_home';
    }
  };

  // Get current state object for active tab
  const getCurrentTabData = useCallback((): any => {
    switch (activeTab) {
      case 'home':
        return homeData;
      case 'courses':
        return coursesData;
      case 'community':
        return communityData;
      case 'about':
        return aboutData;
      case 'trainers':
        return trainersData;
      case 'partners':
        return partnersData;
      case 'navigation':
        return navigationData;
      case 'theme':
        return themeData;
      case 'seo':
        return seoData;
      default:
        return homeData;
    }
  }, [
    activeTab,
    homeData,
    coursesData,
    communityData,
    aboutData,
    trainersData,
    partnersData,
    navigationData,
    themeData,
    seoData,
  ]);

  // Load Document for Active Tab
  const loadActiveDocument = useCallback(async () => {
    if (activeTab === 'media') {
      loadMediaLibrary();
      setLoading(false);
      return;
    }

    setLoading(true);
    const key = getDocumentKey(activeTab);

    try {
      const res = await api.get<{
        success: boolean;
        draftData: any;
        publishedData: any;
        isPublished: boolean;
        publishedAt: string | null;
        updatedAt: string | null;
        lastUpdatedBy: string | null;
        revisions: CmsRevisionItem[];
      }>(`/cms/admin/document/${key}`);

      if (res.success && res.draftData) {
        switch (activeTab) {
          case 'home':
            setHomeData({ ...DEFAULT_HOME_CMS, ...res.draftData });
            break;
          case 'courses':
            setCoursesData({ ...DEFAULT_COURSES_CMS, ...res.draftData });
            break;
          case 'community':
            setCommunityData({ ...DEFAULT_COMMUNITY_CMS, ...res.draftData });
            break;
          case 'about':
            setAboutData({ ...DEFAULT_ABOUT_CMS, ...res.draftData });
            break;
          case 'trainers':
            setTrainersData({ ...DEFAULT_TRAINERS_CMS, ...res.draftData });
            break;
          case 'partners':
            setPartnersData({ ...DEFAULT_PARTNERS_CMS, ...res.draftData });
            break;
          case 'navigation':
            setNavigationData({ ...DEFAULT_NAVIGATION_CMS, ...res.draftData });
            break;
          case 'theme':
            setThemeData({ ...DEFAULT_THEME_CMS, ...res.draftData });
            break;
          case 'seo':
            setSeoData({ ...DEFAULT_SEO_CMS, ...res.draftData });
            break;
        }

        setDocMeta({
          isPublished: res.isPublished,
          publishedAt: res.publishedAt,
          updatedAt: res.updatedAt,
          lastUpdatedBy: res.lastUpdatedBy,
          revisions: res.revisions || [],
        });
      }
    } catch (err: any) {
      console.error(`Failed to load CMS document '${key}':`, err);
      showStatus('error', err.message || 'Failed to load CMS document');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadActiveDocument();
  }, [loadActiveDocument]);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (activeTab === 'media') return;
    setSaving(true);
    const key = getDocumentKey(activeTab);
    const data = getCurrentTabData();

    try {
      const res = await api.put<{ success: boolean; message: string; updatedAt: string }>(
        `/cms/admin/document/${key}`,
        { data }
      );
      if (res.success) {
        showStatus('success', 'Draft saved successfully! (Not yet live on website)');
        setDocMeta((prev) => ({
          ...prev,
          updatedAt: res.updatedAt,
          lastUpdatedBy: user?.name || 'Admin',
        }));
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Error saving draft');
    } finally {
      setSaving(false);
    }
  };

  // Publish Draft Live
  const handlePublishLive = async () => {
    setPublishing(true);
    const key = getDocumentKey(activeTab);

    // Save draft first
    try {
      await api.put(`/cms/admin/document/${key}`, { data: getCurrentTabData() });
      const res = await api.post<{
        success: boolean;
        message: string;
        revision: CmsRevisionItem;
      }>(`/cms/admin/document/${key}/publish`, { note: publishNote });

      if (res.success) {
        showStatus('success', '🎉 Published LIVE to website successfully!');
        setShowPublishModal(false);
        setPublishNote('');
        loadActiveDocument();
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Error publishing CMS document');
    } finally {
      setPublishing(false);
    }
  };

  // Discard / Revert to published version
  const handleRevertDraft = async () => {
    if (!window.confirm('Are you sure you want to discard your draft and revert to the currently published version?')) {
      return;
    }
    const key = getDocumentKey(activeTab);
    try {
      const res = await api.post<{ success: boolean; data: any }>(`/cms/admin/document/${key}/revert`);
      if (res.success && res.data) {
        showStatus('success', 'Draft reverted to published state');
        loadActiveDocument();
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Error reverting draft');
    }
  };

  // Restore Revision
  const handleRestoreRevision = async (revisionId: string, version: number) => {
    if (!window.confirm(`Restore draft from version v${version}?`)) return;
    const key = getDocumentKey(activeTab);
    try {
      const res = await api.post<{ success: boolean; message: string }>(
        `/cms/admin/document/${key}/restore-revision`,
        { revisionId }
      );
      if (res.success) {
        showStatus('success', `Restored draft to revision v${version}. Click Publish when ready!`);
        setShowHistoryDrawer(false);
        loadActiveDocument();
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Error restoring revision');
    }
  };

  // Reset to Built-in Defaults
  const handleResetDefaults = async () => {
    if (!window.confirm('Reset this section to default high-impact Scalora templates?')) return;
    const key = getDocumentKey(activeTab);
    try {
      const res = await api.post<{ success: boolean; message: string }>(
        `/cms/admin/document/${key}/reset-defaults`
      );
      if (res.success) {
        showStatus('success', 'Section draft reset to default template');
        loadActiveDocument();
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Error resetting defaults');
    }
  };

  // Media Library Operations
  const loadMediaLibrary = async () => {
    try {
      const params = new URLSearchParams();
      if (mediaFolder && mediaFolder !== 'all') params.append('folder', mediaFolder);
      if (mediaTypeFilter && mediaTypeFilter !== 'ALL') params.append('type', mediaTypeFilter);
      if (mediaSearch) params.append('search', mediaSearch);

      const res = await api.get<{ success: boolean; media: CmsMediaItem[] }>(
        `/cms/admin/media?${params.toString()}`
      );
      if (res.success && Array.isArray(res.media)) {
        setMediaList(res.media);
      }
    } catch (err) {
      console.error('Failed to load media library:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'media' || showMediaPickerModal) {
      loadMediaLibrary();
    }
  }, [mediaFolder, mediaTypeFilter, mediaSearch, activeTab, showMediaPickerModal]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetFolder = 'general') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('File exceeds 25 MB maximum limit.');
      return;
    }

    setUploadingMedia(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileBase64 = event.target?.result as string;
        const res = await api.post<{ success: boolean; url: string; media: CmsMediaItem }>(
          '/cms/admin/media/upload',
          {
            fileBase64,
            fileName: file.name,
            folder: targetFolder,
          }
        );

        if (res.success) {
          showStatus('success', 'Media file uploaded successfully!');
          loadMediaLibrary();
          if (mediaPickerCallback) {
            mediaPickerCallback(res.url);
            setShowMediaPickerModal(false);
            setMediaPickerCallback(null);
          }
        }
      } catch (err: any) {
        showStatus('error', err.message || 'Failed to upload media file');
      } finally {
        setUploadingMedia(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMedia = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this file from the library?')) return;
    try {
      const res = await api.delete<{ success: boolean }>(`/cms/admin/media/${id}`);
      if (res.success) {
        showStatus('success', 'File deleted from media library');
        loadMediaLibrary();
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Error deleting media');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedMediaUrl(url);
    setTimeout(() => setCopiedMediaUrl(null), 2500);
  };

  const openMediaPicker = (callback: (url: string) => void) => {
    setMediaPickerCallback(() => callback);
    setShowMediaPickerModal(true);
  };

  // Reordering helpers
  const moveItem = (list: any[], index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return list;
    const updated = [...list];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    return updated.map((item, idx) => ({ ...item, order: idx + 1 }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 text-slate-100">
      {/* ===================================================================== */}
      {/* 1. MASTER CMS TOP BAR & PUBLISHING ACTIONS                             */}
      {/* ===================================================================== */}
      <div className="p-6 rounded-3xl bg-[#04152D] border border-scalora-blue/20 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5" />
            <span>Enterprise Website CMS Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Manage Public Website Content
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Edit, reorder, preview, and publish public website sections and theme settings without editing code.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab !== 'media' && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-700 flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4 text-blue-400" />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>

              <button
                onClick={() => setShowPreviewModal(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 flex items-center gap-2 transition-all"
              >
                <Eye className="w-4 h-4 text-indigo-400" />
                <span>Preview</span>
              </button>

              <button
                onClick={() => setShowHistoryDrawer(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 flex items-center gap-2 transition-all"
              >
                <History className="w-4 h-4 text-amber-400" />
                <span>History ({docMeta.revisions?.length || 0})</span>
              </button>

              <button
                onClick={() => setShowPublishModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Publish Live</span>
              </button>
            </>
          )}

          {activeTab === 'media' && (
            <label className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              <span>{uploadingMedia ? 'Uploading...' : 'Upload File'}</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFileUpload(e, mediaFolder === 'all' ? 'general' : mediaFolder)}
                accept="image/*,.svg,.pdf,video/*"
              />
            </label>
          )}
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. TAB NAVIGATION STRIP                                               */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {[
          { id: 'home', label: 'Home Page', icon: Sparkles },
          { id: 'courses', label: 'Courses Page', icon: BookOpen },
          { id: 'community', label: 'Community Page', icon: Users },
          { id: 'about', label: 'About Us', icon: Info },
          { id: 'trainers', label: 'Trainers CMS', icon: Shield },
          { id: 'partners', label: 'Partners & Clients', icon: Briefcase },
          { id: 'media', label: 'Global Media Library', icon: FolderOpen },
          { id: 'navigation', label: 'Navigation Manager', icon: Compass },
          { id: 'seo', label: 'SEO CMS & Sitemap', icon: Search },
          { id: 'theme', label: 'Theme & Branding', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CmsTab)}
              className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-[#04152D] text-slate-400 hover:text-white hover:bg-slate-800 border border-scalora-blue/15'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section Sub-actions (Revert, Reset) */}
      {activeTab !== 'media' && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Last Updated: {docMeta.updatedAt ? new Date(docMeta.updatedAt).toLocaleString() : 'Default'}</span>
            {docMeta.lastUpdatedBy && <span>by {docMeta.lastUpdatedBy}</span>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRevertDraft}
              className="hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard Changes</span>
            </button>
            <button
              onClick={handleResetDefaults}
              className="hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Reset to Default Template</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. ACTIVE TAB EDITOR PANEL                                            */}
      {/* ===================================================================== */}
      {loading ? (
        <div className="p-16 text-center bg-[#04152D] rounded-3xl border border-scalora-blue/20">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-3 font-semibold">Loading CMS Module Data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ----------------------------------------------------------------- */}
          {/* TAB 1: HOME PAGE CMS                                              */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'home' && (
            <div className="space-y-8">
              {/* Hero Section Editor */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">Hero Section</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Announcement Pill Badge</label>
                    <input
                      type="text"
                      value={homeData.hero.pillBadge}
                      onChange={(e) =>
                        setHomeData({ ...homeData, hero: { ...homeData.hero, pillBadge: e.target.value } })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Main Headline</label>
                    <input
                      type="text"
                      value={homeData.hero.headline}
                      onChange={(e) =>
                        setHomeData({ ...homeData, hero: { ...homeData.hero, headline: e.target.value } })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Gradient Highlight Word</label>
                    <input
                      type="text"
                      value={homeData.hero.headlineGradientWord}
                      onChange={(e) =>
                        setHomeData({
                          ...homeData,
                          hero: { ...homeData.hero, headlineGradientWord: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Subheadline Description</label>
                    <textarea
                      rows={3}
                      value={homeData.hero.subheadline}
                      onChange={(e) =>
                        setHomeData({ ...homeData, hero: { ...homeData.hero, subheadline: e.target.value } })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">CTA Button 1 Text</label>
                    <input
                      type="text"
                      value={homeData.hero.cta1Text}
                      onChange={(e) =>
                        setHomeData({ ...homeData, hero: { ...homeData.hero, cta1Text: e.target.value } })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">CTA Button 1 Link</label>
                    <input
                      type="text"
                      value={homeData.hero.cta1Link}
                      onChange={(e) =>
                        setHomeData({ ...homeData, hero: { ...homeData.hero, cta1Link: e.target.value } })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">CTA Button 2 Text</label>
                    <input
                      type="text"
                      value={homeData.hero.cta2Text}
                      onChange={(e) =>
                        setHomeData({ ...homeData, hero: { ...homeData.hero, cta2Text: e.target.value } })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">CTA Button 2 Link</label>
                    <input
                      type="text"
                      value={homeData.hero.cta2Link}
                      onChange={(e) =>
                        setHomeData({ ...homeData, hero: { ...homeData.hero, cta2Link: e.target.value } })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Hero Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={homeData.hero.heroImageUrl}
                        onChange={(e) =>
                          setHomeData({ ...homeData, hero: { ...homeData.hero, heroImageUrl: e.target.value } })
                        }
                        placeholder="https://... or select from library"
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          openMediaPicker((url) =>
                            setHomeData({ ...homeData, hero: { ...homeData.hero, heroImageUrl: url } })
                          )
                        }
                        className="px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Optional Video URL</label>
                    <input
                      type="text"
                      value={homeData.hero.videoUrl}
                      onChange={(e) =>
                        setHomeData({ ...homeData, hero: { ...homeData.hero, videoUrl: e.target.value } })
                      }
                      placeholder="YouTube Embed URL or MP4 URL"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Statistics Counters Editor */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-lg font-bold text-white">Platform Statistics Counters</h2>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={homeData.stats.visible}
                      onChange={(e) =>
                        setHomeData({ ...homeData, stats: { ...homeData.stats, visible: e.target.checked } })
                      }
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>Show Statistics Banner</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Students Count</label>
                    <input
                      type="text"
                      value={homeData.stats.studentsCount}
                      onChange={(e) =>
                        setHomeData({
                          ...homeData,
                          stats: { ...homeData.stats, studentsCount: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                    <input
                      type="text"
                      value={homeData.stats.studentsLabel}
                      onChange={(e) =>
                        setHomeData({
                          ...homeData,
                          stats: { ...homeData.stats, studentsLabel: e.target.value },
                        })
                      }
                      placeholder="Label"
                      className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Courses Count</label>
                    <input
                      type="text"
                      value={homeData.stats.coursesCount}
                      onChange={(e) =>
                        setHomeData({
                          ...homeData,
                          stats: { ...homeData.stats, coursesCount: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                    <input
                      type="text"
                      value={homeData.stats.coursesLabel}
                      onChange={(e) =>
                        setHomeData({
                          ...homeData,
                          stats: { ...homeData.stats, coursesLabel: e.target.value },
                        })
                      }
                      placeholder="Label"
                      className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Certificates Count</label>
                    <input
                      type="text"
                      value={homeData.stats.certificatesCount}
                      onChange={(e) =>
                        setHomeData({
                          ...homeData,
                          stats: { ...homeData.stats, certificatesCount: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                    <input
                      type="text"
                      value={homeData.stats.certificatesLabel}
                      onChange={(e) =>
                        setHomeData({
                          ...homeData,
                          stats: { ...homeData.stats, certificatesLabel: e.target.value },
                        })
                      }
                      placeholder="Label"
                      className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Community Count</label>
                    <input
                      type="text"
                      value={homeData.stats.communityCount}
                      onChange={(e) =>
                        setHomeData({
                          ...homeData,
                          stats: { ...homeData.stats, communityCount: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                    <input
                      type="text"
                      value={homeData.stats.communityLabel}
                      onChange={(e) =>
                        setHomeData({
                          ...homeData,
                          stats: { ...homeData.stats, communityLabel: e.target.value },
                        })
                      }
                      placeholder="Label"
                      className="w-full px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Cards Editor (Reorderable) */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-white">Platform Features Cards</h2>
                    <p className="text-xs text-slate-400">Add, edit, and reorder feature highlight cards</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newCard = {
                        id: `feat_${Date.now()}`,
                        icon: 'Cpu',
                        title: 'New Feature Highlight',
                        description: 'Feature card description and technical takeaways.',
                        order: homeData.features.length + 1,
                      };
                      setHomeData({ ...homeData, features: [...homeData.features, newCard] });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Feature Card</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {homeData.features.map((feat, idx) => (
                    <div
                      key={feat.id}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() =>
                              setHomeData({
                                ...homeData,
                                features: moveItem(homeData.features, idx, 'up'),
                              })
                            }
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === homeData.features.length - 1}
                            onClick={() =>
                              setHomeData({
                                ...homeData,
                                features: moveItem(homeData.features, idx, 'down'),
                              })
                            }
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={feat.icon}
                          onChange={(e) => {
                            const updated = [...homeData.features];
                            updated[idx].icon = e.target.value;
                            setHomeData({ ...homeData, features: updated });
                          }}
                          placeholder="Icon (e.g. Cpu)"
                          className="w-24 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-center"
                        />
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                        <input
                          type="text"
                          value={feat.title}
                          onChange={(e) => {
                            const updated = [...homeData.features];
                            updated[idx].title = e.target.value;
                            setHomeData({ ...homeData, features: updated });
                          }}
                          placeholder="Card Title"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white"
                        />
                        <input
                          type="text"
                          value={feat.description}
                          onChange={(e) => {
                            const updated = [...homeData.features];
                            updated[idx].description = e.target.value;
                            setHomeData({ ...homeData, features: updated });
                          }}
                          placeholder="Description"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-slate-300"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = homeData.features.filter((_, i) => i !== idx);
                          setHomeData({ ...homeData, features: updated });
                        }}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonials Editor */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-white">Student & Client Testimonials</h2>
                    <p className="text-xs text-slate-400">Manage real customer reviews and star ratings</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newTestimonial = {
                        id: `test_${Date.now()}`,
                        name: 'New Reviewer',
                        role: 'Job Title',
                        company: 'Company Name',
                        photoUrl: '',
                        review: 'Scalora transformed our engineering workflow completely.',
                        rating: 5,
                        order: homeData.testimonials.length + 1,
                      };
                      setHomeData({
                        ...homeData,
                        testimonials: [...homeData.testimonials, newTestimonial],
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Review</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {homeData.testimonials.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                          <div className="flex items-center gap-1 text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 cursor-pointer ${
                                  star <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                                }`}
                                onClick={() => {
                                  const updated = [...homeData.testimonials];
                                  updated[idx].rating = star;
                                  setHomeData({ ...homeData, testimonials: updated });
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() =>
                              setHomeData({
                                ...homeData,
                                testimonials: moveItem(homeData.testimonials, idx, 'up'),
                              })
                            }
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === homeData.testimonials.length - 1}
                            onClick={() =>
                              setHomeData({
                                ...homeData,
                                testimonials: moveItem(homeData.testimonials, idx, 'down'),
                              })
                            }
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = homeData.testimonials.filter((_, i) => i !== idx);
                              setHomeData({ ...homeData, testimonials: updated });
                            }}
                            className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => {
                            const updated = [...homeData.testimonials];
                            updated[idx].name = e.target.value;
                            setHomeData({ ...homeData, testimonials: updated });
                          }}
                          placeholder="Student / Client Name"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={t.role}
                          onChange={(e) => {
                            const updated = [...homeData.testimonials];
                            updated[idx].role = e.target.value;
                            setHomeData({ ...homeData, testimonials: updated });
                          }}
                          placeholder="Job Title (e.g. VP Engineering)"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={t.company}
                          onChange={(e) => {
                            const updated = [...homeData.testimonials];
                            updated[idx].company = e.target.value;
                            setHomeData({ ...homeData, testimonials: updated });
                          }}
                          placeholder="Company (e.g. Google Labs)"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={t.photoUrl}
                          onChange={(e) => {
                            const updated = [...homeData.testimonials];
                            updated[idx].photoUrl = e.target.value;
                            setHomeData({ ...homeData, testimonials: updated });
                          }}
                          placeholder="Photo URL or pick from library"
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            openMediaPicker((url) => {
                              const updated = [...homeData.testimonials];
                              updated[idx].photoUrl = url;
                              setHomeData({ ...homeData, testimonials: updated });
                            })
                          }
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={t.review}
                        onChange={(e) => {
                          const updated = [...homeData.testimonials];
                          updated[idx].review = e.target.value;
                          setHomeData({ ...homeData, testimonials: updated });
                        }}
                        placeholder="Review text"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Editor */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-white">Frequently Asked Questions (FAQ)</h2>
                    <p className="text-xs text-slate-400">Answer visitor questions before they enroll</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newFaq = {
                        id: `faq_${Date.now()}`,
                        question: 'New Question?',
                        answer: 'Answer to the question goes here.',
                        order: homeData.faq.length + 1,
                      };
                      setHomeData({ ...homeData, faq: [...homeData.faq, newFaq] });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add FAQ</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {homeData.faq.map((f, idx) => (
                    <div
                      key={f.id}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() =>
                              setHomeData({
                                ...homeData,
                                faq: moveItem(homeData.faq, idx, 'up'),
                              })
                            }
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === homeData.faq.length - 1}
                            onClick={() =>
                              setHomeData({
                                ...homeData,
                                faq: moveItem(homeData.faq, idx, 'down'),
                              })
                            }
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={f.question}
                          onChange={(e) => {
                            const updated = [...homeData.faq];
                            updated[idx].question = e.target.value;
                            setHomeData({ ...homeData, faq: updated });
                          }}
                          placeholder="Question"
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm font-semibold text-white"
                        />

                        <button
                          type="button"
                          onClick={() => {
                            const updated = homeData.faq.filter((_, i) => i !== idx);
                            setHomeData({ ...homeData, faq: updated });
                          }}
                          className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={f.answer}
                        onChange={(e) => {
                          const updated = [...homeData.faq];
                          updated[idx].answer = e.target.value;
                          setHomeData({ ...homeData, faq: updated });
                        }}
                        placeholder="Answer"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 2: COURSES PAGE CMS                                           */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'courses' && (
            <div className="space-y-8">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">Courses Catalog Header</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Catalog Eyebrow Title</label>
                    <input
                      type="text"
                      value={coursesData.headerTitle}
                      onChange={(e) => setCoursesData({ ...coursesData, headerTitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Main Headline</label>
                    <input
                      type="text"
                      value={coursesData.headerHeadline}
                      onChange={(e) => setCoursesData({ ...coursesData, headerHeadline: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Header Description</label>
                    <textarea
                      rows={2}
                      value={coursesData.headerDescription}
                      onChange={(e) => setCoursesData({ ...coursesData, headerDescription: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Featured Section Title</label>
                    <input
                      type="text"
                      value={coursesData.featuredSectionTitle}
                      onChange={(e) =>
                        setCoursesData({ ...coursesData, featuredSectionTitle: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Coming Soon Section Title</label>
                    <input
                      type="text"
                      value={coursesData.upcomingSectionTitle}
                      onChange={(e) =>
                        setCoursesData({ ...coursesData, upcomingSectionTitle: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Coming Soon Courses Manager */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-white">Coming Soon Courses Manager</h2>
                    <p className="text-xs text-slate-400">Showcase pipeline courses before launch to gather leads</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newCs = {
                        id: `cs_${Date.now()}`,
                        title: 'New Upcoming Masterclass',
                        thumbnail: '',
                        description: 'Detailed description of this masterclass curriculum.',
                        launchDate: '2026-12-01',
                        notifyButtonText: 'Join Waitlist',
                        category: 'Cloud Architecture',
                        featured: true,
                        order: coursesData.comingSoonCourses.length + 1,
                      };
                      setCoursesData({
                        ...coursesData,
                        comingSoonCourses: [...coursesData.comingSoonCourses, newCs],
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Coming Soon Course</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {coursesData.comingSoonCourses.map((cs, idx) => (
                    <div
                      key={cs.id}
                      className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() =>
                              setCoursesData({
                                ...coursesData,
                                comingSoonCourses: moveItem(coursesData.comingSoonCourses, idx, 'up'),
                              })
                            }
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === coursesData.comingSoonCourses.length - 1}
                            onClick={() =>
                              setCoursesData({
                                ...coursesData,
                                comingSoonCourses: moveItem(coursesData.comingSoonCourses, idx, 'down'),
                              })
                            }
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-blue-400">#{idx + 1}</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cs.featured}
                              onChange={(e) => {
                                const updated = [...coursesData.comingSoonCourses];
                                updated[idx].featured = e.target.checked;
                                setCoursesData({ ...coursesData, comingSoonCourses: updated });
                              }}
                              className="w-4 h-4 rounded text-blue-600"
                            />
                            <span>Featured on Homepage</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = coursesData.comingSoonCourses.filter((_, i) => i !== idx);
                              setCoursesData({ ...coursesData, comingSoonCourses: updated });
                            }}
                            className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={cs.title}
                          onChange={(e) => {
                            const updated = [...coursesData.comingSoonCourses];
                            updated[idx].title = e.target.value;
                            setCoursesData({ ...coursesData, comingSoonCourses: updated });
                          }}
                          placeholder="Course Title"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white font-bold"
                        />
                        <input
                          type="text"
                          value={cs.category}
                          onChange={(e) => {
                            const updated = [...coursesData.comingSoonCourses];
                            updated[idx].category = e.target.value;
                            setCoursesData({ ...coursesData, comingSoonCourses: updated });
                          }}
                          placeholder="Category"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                        <input
                          type="date"
                          value={cs.launchDate}
                          onChange={(e) => {
                            const updated = [...coursesData.comingSoonCourses];
                            updated[idx].launchDate = e.target.value;
                            setCoursesData({ ...coursesData, comingSoonCourses: updated });
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cs.thumbnail}
                          onChange={(e) => {
                            const updated = [...coursesData.comingSoonCourses];
                            updated[idx].thumbnail = e.target.value;
                            setCoursesData({ ...coursesData, comingSoonCourses: updated });
                          }}
                          placeholder="Thumbnail URL (4:5 or 16:9)"
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            openMediaPicker((url) => {
                              const updated = [...coursesData.comingSoonCourses];
                              updated[idx].thumbnail = url;
                              setCoursesData({ ...coursesData, comingSoonCourses: updated });
                            })
                          }
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <textarea
                          rows={2}
                          value={cs.description}
                          onChange={(e) => {
                            const updated = [...coursesData.comingSoonCourses];
                            updated[idx].description = e.target.value;
                            setCoursesData({ ...coursesData, comingSoonCourses: updated });
                          }}
                          placeholder="Course description"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300"
                        />
                        <input
                          type="text"
                          value={cs.notifyButtonText}
                          onChange={(e) => {
                            const updated = [...coursesData.comingSoonCourses];
                            updated[idx].notifyButtonText = e.target.value;
                            setCoursesData({ ...coursesData, comingSoonCourses: updated });
                          }}
                          placeholder="Waitlist Button Text (e.g. Join Waitlist)"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 h-10"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 3: COMMUNITY PAGE CMS                                         */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'community' && (
            <div className="space-y-8">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
                  <Users className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">Community Hero & Overview</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Hero Eyebrow Badge</label>
                    <input
                      type="text"
                      value={communityData.heroBadge}
                      onChange={(e) =>
                        setCommunityData({ ...communityData, heroBadge: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Hero Main Title</label>
                    <input
                      type="text"
                      value={communityData.heroTitle}
                      onChange={(e) =>
                        setCommunityData({ ...communityData, heroTitle: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Hero Description</label>
                    <textarea
                      rows={3}
                      value={communityData.heroDescription}
                      onChange={(e) =>
                        setCommunityData({ ...communityData, heroDescription: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">CTA 1 Text & Link</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={communityData.cta1Text}
                        onChange={(e) =>
                          setCommunityData({ ...communityData, cta1Text: e.target.value })
                        }
                        placeholder="Text"
                        className="px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={communityData.cta1Link}
                        onChange={(e) =>
                          setCommunityData({ ...communityData, cta1Link: e.target.value })
                        }
                        placeholder="Link"
                        className="px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">CTA 2 Text & Link</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={communityData.cta2Text}
                        onChange={(e) =>
                          setCommunityData({ ...communityData, cta2Text: e.target.value })
                        }
                        placeholder="Text"
                        className="px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={communityData.cta2Link}
                        onChange={(e) =>
                          setCommunityData({ ...communityData, cta2Link: e.target.value })
                        }
                        placeholder="Link"
                        className="px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Community Benefits List */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-white">Community Benefits & Pillars</h2>
                    <p className="text-xs text-slate-400">Manage value cards shown to prospective members</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newBen = {
                        id: `ben_${Date.now()}`,
                        icon: 'MessageSquare',
                        title: 'New Community Benefit',
                        description: 'Description of what members receive.',
                        order: communityData.benefits.length + 1,
                      };
                      setCommunityData({
                        ...communityData,
                        benefits: [...communityData.benefits, newBen],
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Benefit</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {communityData.benefits.map((ben, idx) => (
                    <div
                      key={ben.id}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() =>
                              setCommunityData({
                                ...communityData,
                                benefits: moveItem(communityData.benefits, idx, 'up'),
                              })
                            }
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === communityData.benefits.length - 1}
                            onClick={() =>
                              setCommunityData({
                                ...communityData,
                                benefits: moveItem(communityData.benefits, idx, 'down'),
                              })
                            }
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={ben.icon}
                          onChange={(e) => {
                            const updated = [...communityData.benefits];
                            updated[idx].icon = e.target.value;
                            setCommunityData({ ...communityData, benefits: updated });
                          }}
                          placeholder="Icon"
                          className="w-24 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-center"
                        />
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                        <input
                          type="text"
                          value={ben.title}
                          onChange={(e) => {
                            const updated = [...communityData.benefits];
                            updated[idx].title = e.target.value;
                            setCommunityData({ ...communityData, benefits: updated });
                          }}
                          placeholder="Benefit Title"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white font-bold"
                        />
                        <input
                          type="text"
                          value={ben.description}
                          onChange={(e) => {
                            const updated = [...communityData.benefits];
                            updated[idx].description = e.target.value;
                            setCommunityData({ ...communityData, benefits: updated });
                          }}
                          placeholder="Description"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-slate-300"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = communityData.benefits.filter((_, i) => i !== idx);
                          setCommunityData({ ...communityData, benefits: updated });
                        }}
                        className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 4: ABOUT US CMS                                               */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'about' && (
            <div className="space-y-8">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
                  <Info className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">Vision, Mission & Story</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Hero Eyebrow Badge</label>
                    <input
                      type="text"
                      value={aboutData.heroBadge}
                      onChange={(e) => setAboutData({ ...aboutData, heroBadge: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Hero Headline</label>
                    <input
                      type="text"
                      value={aboutData.heroTitle}
                      onChange={(e) => setAboutData({ ...aboutData, heroTitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Mission Statement</label>
                    <textarea
                      rows={2}
                      value={aboutData.mission}
                      onChange={(e) => setAboutData({ ...aboutData, mission: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Vision Statement</label>
                    <textarea
                      rows={2}
                      value={aboutData.vision}
                      onChange={(e) => setAboutData({ ...aboutData, vision: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Company Story Content</label>
                    <textarea
                      rows={3}
                      value={aboutData.storyContent}
                      onChange={(e) => setAboutData({ ...aboutData, storyContent: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Founder Section */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-white">Founder & Leadership Spotlight</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Founder Name</label>
                    <input
                      type="text"
                      value={aboutData.founder.name}
                      onChange={(e) =>
                        setAboutData({
                          ...aboutData,
                          founder: { ...aboutData.founder, name: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Title / Role</label>
                    <input
                      type="text"
                      value={aboutData.founder.title}
                      onChange={(e) =>
                        setAboutData({
                          ...aboutData,
                          founder: { ...aboutData.founder, title: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Founder Bio</label>
                    <textarea
                      rows={2}
                      value={aboutData.founder.bio}
                      onChange={(e) =>
                        setAboutData({
                          ...aboutData,
                          founder: { ...aboutData.founder, bio: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Founder Quote</label>
                    <input
                      type="text"
                      value={aboutData.founder.quote}
                      onChange={(e) =>
                        setAboutData({
                          ...aboutData,
                          founder: { ...aboutData.founder, quote: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-white">Team Directory</h2>
                    <p className="text-xs text-slate-400">Leadership and department leads</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newMember = {
                        id: `team_${Date.now()}`,
                        name: 'New Member',
                        role: 'Role Title',
                        bio: 'Member biography.',
                        photoUrl: '',
                        linkedin: 'https://linkedin.com',
                        order: aboutData.team.length + 1,
                      };
                      setAboutData({ ...aboutData, team: [...aboutData.team, newMember] });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {aboutData.team.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() =>
                              setAboutData({
                                ...aboutData,
                                team: moveItem(aboutData.team, idx, 'up'),
                              })
                            }
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === aboutData.team.length - 1}
                            onClick={() =>
                              setAboutData({
                                ...aboutData,
                                team: moveItem(aboutData.team, idx, 'down'),
                              })
                            }
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-slate-300">#{idx + 1}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = aboutData.team.filter((_, i) => i !== idx);
                            setAboutData({ ...aboutData, team: updated });
                          }}
                          className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={m.name}
                          onChange={(e) => {
                            const updated = [...aboutData.team];
                            updated[idx].name = e.target.value;
                            setAboutData({ ...aboutData, team: updated });
                          }}
                          placeholder="Full Name"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={m.role}
                          onChange={(e) => {
                            const updated = [...aboutData.team];
                            updated[idx].role = e.target.value;
                            setAboutData({ ...aboutData, team: updated });
                          }}
                          placeholder="Role"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={m.linkedin || ''}
                          onChange={(e) => {
                            const updated = [...aboutData.team];
                            updated[idx].linkedin = e.target.value;
                            setAboutData({ ...aboutData, team: updated });
                          }}
                          placeholder="LinkedIn URL"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 5: TRAINERS CMS                                               */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'trainers' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white">Faculty & Trainers Showcase</h2>
                  <p className="text-xs text-slate-400">Manage instructor bios, photos, social profiles, and display order</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newTr = {
                      id: `tr_${Date.now()}`,
                      name: 'Instructor Name',
                      title: 'Senior Cloud Specialist',
                      bio: 'Instructor biography and technical background.',
                      photoUrl: '',
                      specialties: ['Kubernetes', 'Cloud'],
                      linkedin: 'https://linkedin.com',
                      featured: true,
                      order: trainersData.trainersList.length + 1,
                    };
                    setTrainersData({
                      ...trainersData,
                      trainersList: [...trainersData.trainersList, newTr],
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Trainer</span>
                </button>
              </div>

              <div className="space-y-4">
                {trainersData.trainersList.map((tr, idx) => (
                  <div
                    key={tr.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() =>
                            setTrainersData({
                              ...trainersData,
                              trainersList: moveItem(trainersData.trainersList, idx, 'up'),
                            })
                          }
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === trainersData.trainersList.length - 1}
                          onClick={() =>
                            setTrainersData({
                              ...trainersData,
                              trainersList: moveItem(trainersData.trainersList, idx, 'down'),
                            })
                          }
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-blue-400">#{idx + 1}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tr.featured}
                            onChange={(e) => {
                              const updated = [...trainersData.trainersList];
                              updated[idx].featured = e.target.checked;
                              setTrainersData({ ...trainersData, trainersList: updated });
                            }}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <span>Featured Instructor</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = trainersData.trainersList.filter((_, i) => i !== idx);
                            setTrainersData({ ...trainersData, trainersList: updated });
                          }}
                          className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={tr.name}
                        onChange={(e) => {
                          const updated = [...trainersData.trainersList];
                          updated[idx].name = e.target.value;
                          setTrainersData({ ...trainersData, trainersList: updated });
                        }}
                        placeholder="Instructor Full Name"
                        className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white font-bold"
                      />
                      <input
                        type="text"
                        value={tr.title}
                        onChange={(e) => {
                          const updated = [...trainersData.trainersList];
                          updated[idx].title = e.target.value;
                          setTrainersData({ ...trainersData, trainersList: updated });
                        }}
                        placeholder="Title (e.g. Lead Systems Architect)"
                        className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white"
                      />
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tr.photoUrl}
                        onChange={(e) => {
                          const updated = [...trainersData.trainersList];
                          updated[idx].photoUrl = e.target.value;
                          setTrainersData({ ...trainersData, trainersList: updated });
                        }}
                        placeholder="Photo URL or pick from library"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          openMediaPicker((url) => {
                            const updated = [...trainersData.trainersList];
                            updated[idx].photoUrl = url;
                            setTrainersData({ ...trainersData, trainersList: updated });
                          })
                        }
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={tr.bio}
                      onChange={(e) => {
                        const updated = [...trainersData.trainersList];
                        updated[idx].bio = e.target.value;
                        setTrainersData({ ...trainersData, trainersList: updated });
                      }}
                      placeholder="Biography"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={tr.linkedin || ''}
                        onChange={(e) => {
                          const updated = [...trainersData.trainersList];
                          updated[idx].linkedin = e.target.value;
                          setTrainersData({ ...trainersData, trainersList: updated });
                        }}
                        placeholder="LinkedIn Profile URL"
                        className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={(tr.specialties || []).join(', ')}
                        onChange={(e) => {
                          const updated = [...trainersData.trainersList];
                          updated[idx].specialties = e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                          setTrainersData({ ...trainersData, trainersList: updated });
                        }}
                        placeholder="Specialties (comma separated e.g. Cloud, Go, Docker)"
                        className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 6: PARTNERS & CLIENTS CMS                                     */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'partners' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white">Client & Partner Logos</h2>
                  <p className="text-xs text-slate-400">Manage client logos displayed on the public landing page</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newP = {
                      id: `part_${Date.now()}`,
                      name: 'Company Name',
                      logoUrl: '',
                      websiteUrl: 'https://',
                      order: partnersData.partnersList.length + 1,
                      active: true,
                    };
                    setPartnersData({
                      ...partnersData,
                      partnersList: [...partnersData.partnersList, newP],
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Partner</span>
                </button>
              </div>

              <div className="space-y-4">
                {partnersData.partnersList.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() =>
                          setPartnersData({
                            ...partnersData,
                            partnersList: moveItem(partnersData.partnersList, idx, 'up'),
                          })
                        }
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === partnersData.partnersList.length - 1}
                        onClick={() =>
                          setPartnersData({
                            ...partnersData,
                            partnersList: moveItem(partnersData.partnersList, idx, 'down'),
                          })
                        }
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const updated = [...partnersData.partnersList];
                          updated[idx].name = e.target.value;
                          setPartnersData({ ...partnersData, partnersList: updated });
                        }}
                        placeholder="Company Name"
                        className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white font-bold"
                      />
                      <input
                        type="text"
                        value={p.websiteUrl}
                        onChange={(e) => {
                          const updated = [...partnersData.partnersList];
                          updated[idx].websiteUrl = e.target.value;
                          setPartnersData({ ...partnersData, partnersList: updated });
                        }}
                        placeholder="Website URL"
                        className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={p.logoUrl}
                          onChange={(e) => {
                            const updated = [...partnersData.partnersList];
                            updated[idx].logoUrl = e.target.value;
                            setPartnersData({ ...partnersData, partnersList: updated });
                          }}
                          placeholder="Logo URL"
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            openMediaPicker((url) => {
                              const updated = [...partnersData.partnersList];
                              updated[idx].logoUrl = url;
                              setPartnersData({ ...partnersData, partnersList: updated });
                            })
                          }
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.active}
                          onChange={(e) => {
                            const updated = [...partnersData.partnersList];
                            updated[idx].active = e.target.checked;
                            setPartnersData({ ...partnersData, partnersList: updated });
                          }}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span>Active</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = partnersData.partnersList.filter((_, i) => i !== idx);
                          setPartnersData({ ...partnersData, partnersList: updated });
                        }}
                        className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 7: GLOBAL MEDIA LIBRARY                                       */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'media' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white">Centralized Media Library</h2>
                  <p className="text-xs text-slate-400">Upload and manage images, SVGs, documents, and videos</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Folder & Type filter tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {['all', 'general', 'heroes', 'courses', 'trainers', 'testimonials', 'logos', 'documents'].map(
                    (folder) => (
                      <button
                        key={folder}
                        onClick={() => setMediaFolder(folder)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                          mediaFolder === folder
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {folder}
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {['ALL', 'IMAGE', 'SVG', 'VIDEO', 'PDF'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setMediaTypeFilter(type)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        mediaTypeFilter === type
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Cards Grid */}
              {mediaList.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-slate-800 rounded-3xl space-y-3">
                  <FolderOpen className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-400">No media assets found in this folder</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Upload your first asset</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, mediaFolder === 'all' ? 'general' : mediaFolder)}
                      accept="image/*,.svg,.pdf,video/*"
                    />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {mediaList.map((m) => (
                    <div
                      key={m.id}
                      className="group relative rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-blue-500/50 transition-all"
                    >
                      {/* Thumbnail view */}
                      <div className="h-32 bg-slate-950 flex items-center justify-center overflow-hidden relative">
                        {m.fileType === 'IMAGE' || m.fileType === 'SVG' ? (
                          <img
                            src={resolveMediaUrl(m.fileUrl)}
                            alt={m.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : m.fileType === 'VIDEO' ? (
                          <Video className="w-10 h-10 text-indigo-400" />
                        ) : m.fileType === 'PDF' ? (
                          <FileText className="w-10 h-10 text-rose-400" />
                        ) : (
                          <File className="w-10 h-10 text-slate-500" />
                        )}

                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white uppercase">
                          {m.fileType}
                        </span>
                      </div>

                      {/* Info & Actions */}
                      <div className="p-3 space-y-1.5">
                        <div className="text-xs font-bold text-white truncate" title={m.name}>
                          {m.name}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>{m.fileSize}</span>
                          <span className="capitalize">{m.folder}</span>
                        </div>

                        <div className="flex items-center gap-1 pt-1 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(m.fileUrl)}
                            className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                          >
                            {copiedMediaUrl === m.fileUrl ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Copy URL</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMedia(m.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                            title="Delete file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 8: NAVIGATION MANAGER                                         */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'navigation' && (
            <div className="space-y-8">
              {/* Header Navigation Links */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-white">Header Navigation Links</h2>
                    <p className="text-xs text-slate-400">Manage links shown in the top navigation bar</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newNav = {
                        id: `nav_${Date.now()}`,
                        label: 'New Link',
                        url: '/link',
                        order: navigationData.headerLinks.length + 1,
                        visible: true,
                        newTab: false,
                      };
                      setNavigationData({
                        ...navigationData,
                        headerLinks: [...navigationData.headerLinks, newNav],
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Link</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {navigationData.headerLinks.map((nl, idx) => (
                    <div
                      key={nl.id}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() =>
                            setNavigationData({
                              ...navigationData,
                              headerLinks: moveItem(navigationData.headerLinks, idx, 'up'),
                            })
                          }
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === navigationData.headerLinks.length - 1}
                          onClick={() =>
                            setNavigationData({
                              ...navigationData,
                              headerLinks: moveItem(navigationData.headerLinks, idx, 'down'),
                            })
                          }
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                        <input
                          type="text"
                          value={nl.label}
                          onChange={(e) => {
                            const updated = [...navigationData.headerLinks];
                            updated[idx].label = e.target.value;
                            setNavigationData({ ...navigationData, headerLinks: updated });
                          }}
                          placeholder="Link Label"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white font-bold"
                        />
                        <input
                          type="text"
                          value={nl.url}
                          onChange={(e) => {
                            const updated = [...navigationData.headerLinks];
                            updated[idx].url = e.target.value;
                            setNavigationData({ ...navigationData, headerLinks: updated });
                          }}
                          placeholder="URL (e.g. /courses or https://...)"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-slate-300"
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={nl.visible}
                            onChange={(e) => {
                              const updated = [...navigationData.headerLinks];
                              updated[idx].visible = e.target.checked;
                              setNavigationData({ ...navigationData, headerLinks: updated });
                            }}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <span>Visible</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = navigationData.headerLinks.filter((_, i) => i !== idx);
                            setNavigationData({ ...navigationData, headerLinks: updated });
                          }}
                          className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Header CTA Button */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-4">
                <h2 className="text-lg font-bold text-white pb-3 border-b border-slate-800">
                  Header Action CTA Button
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Button Text</label>
                    <input
                      type="text"
                      value={navigationData.ctaButton?.text || ''}
                      onChange={(e) =>
                        setNavigationData({
                          ...navigationData,
                          ctaButton: { ...navigationData.ctaButton, text: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Button URL</label>
                    <input
                      type="text"
                      value={navigationData.ctaButton?.url || ''}
                      onChange={(e) =>
                        setNavigationData({
                          ...navigationData,
                          ctaButton: { ...navigationData.ctaButton, url: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 9: SEO CMS                                                    */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'seo' && (
            <div className="space-y-8">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-white">Global SEO & Canonical Settings</h2>
                    <p className="text-xs text-slate-400">Configure global metadata and dynamic XML sitemap</p>
                  </div>
                  <a
                    href="/api/cms/sitemap.xml"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                  >
                    <span>View Sitemap.xml</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Global Site Name</label>
                    <input
                      type="text"
                      value={seoData.globalSiteName}
                      onChange={(e) => setSeoData({ ...seoData, globalSiteName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Canonical Domain</label>
                    <input
                      type="text"
                      value={seoData.canonicalDomain}
                      onChange={(e) => setSeoData({ ...seoData, canonicalDomain: e.target.value })}
                      placeholder="https://scalora.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Global Meta Description</label>
                    <textarea
                      rows={2}
                      value={seoData.globalMetaDescription}
                      onChange={(e) => setSeoData({ ...seoData, globalMetaDescription: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Per-Page SEO Settings */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <h2 className="text-lg font-bold text-white pb-3 border-b border-slate-800">
                  Per-Page Meta Tags
                </h2>

                <div className="space-y-6">
                  {Object.entries(seoData.pages || {}).map(([pKey, pSeo]) => (
                    <div key={pKey} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold uppercase">
                          /{pKey}
                        </span>
                        <span className="text-xs font-bold text-slate-300">Page Meta</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-400">Page Title</label>
                          <input
                            type="text"
                            value={pSeo.title}
                            onChange={(e) => {
                              const updated = { ...seoData.pages };
                              updated[pKey].title = e.target.value;
                              setSeoData({ ...seoData, pages: updated });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-400">Keywords (Comma separated)</label>
                          <input
                            type="text"
                            value={pSeo.keywords}
                            onChange={(e) => {
                              const updated = { ...seoData.pages };
                              updated[pKey].keywords = e.target.value;
                              setSeoData({ ...seoData, pages: updated });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-slate-400">Meta Description</label>
                          <textarea
                            rows={2}
                            value={pSeo.description}
                            onChange={(e) => {
                              const updated = { ...seoData.pages };
                              updated[pKey].description = e.target.value;
                              setSeoData({ ...seoData, pages: updated });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 10: THEME & BRANDING MANAGER                                  */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'theme' && (
            <div className="space-y-8">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
                  <Palette className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">Color System & Brand Tokens</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Primary Color */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <label className="text-xs font-bold text-slate-300">Primary Brand Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={themeData.primaryColor}
                        onChange={(e) => setThemeData({ ...themeData, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={themeData.primaryColor}
                        onChange={(e) => setThemeData({ ...themeData, primaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <label className="text-xs font-bold text-slate-300">Secondary Accent</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={themeData.secondaryColor}
                        onChange={(e) => setThemeData({ ...themeData, secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={themeData.secondaryColor}
                        onChange={(e) => setThemeData({ ...themeData, secondaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  {/* Accent Highlight */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <label className="text-xs font-bold text-slate-300">Sky Accent Highlight</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={themeData.accentColor}
                        onChange={(e) => setThemeData({ ...themeData, accentColor: e.target.value })}
                        className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={themeData.accentColor}
                        onChange={(e) => setThemeData({ ...themeData, accentColor: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Branding Logos */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#04152D] border border-scalora-blue/20 space-y-6">
                <h2 className="text-lg font-bold text-white pb-3 border-b border-slate-800">
                  Logo & Favicon Assets
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">Header Logo URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={themeData.logoUrl}
                        onChange={(e) => setThemeData({ ...themeData, logoUrl: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => openMediaPicker((url) => setThemeData({ ...themeData, logoUrl: url }))}
                        className="px-3 py-2 rounded-xl bg-slate-800 text-blue-400"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">Favicon URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={themeData.faviconUrl}
                        onChange={(e) => setThemeData({ ...themeData, faviconUrl: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          openMediaPicker((url) => setThemeData({ ...themeData, faviconUrl: url }))
                        }
                        className="px-3 py-2 rounded-xl bg-slate-800 text-blue-400"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">Footer Logo URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={themeData.footerLogoUrl}
                        onChange={(e) => setThemeData({ ...themeData, footerLogoUrl: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          openMediaPicker((url) => setThemeData({ ...themeData, footerLogoUrl: url }))
                        }
                        className="px-3 py-2 rounded-xl bg-slate-800 text-blue-400"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. MODALS & DRAWERS                                                   */}
      {/* ===================================================================== */}

      {/* PUBLISH CONFIRMATION MODAL */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#04152D] border border-scalora-blue/30 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Publish Live to Website</h3>
              </div>
              <button
                onClick={() => setShowPublishModal(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will commit your draft changes for <strong className="text-white capitalize">{activeTab}</strong> directly to the public live website. A version history revision snapshot will be created automatically.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Revision Release Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Updated hero CTA and headline"
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishLive}
                disabled={publishing}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{publishing ? 'Publishing...' : 'Confirm Publish'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERSION HISTORY DRAWER */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#04152D] border-l border-scalora-blue/20 h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Version History</h3>
                </div>
                <button
                  onClick={() => setShowHistoryDrawer(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {(!docMeta.revisions || docMeta.revisions.length === 0) ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No historical revisions found yet. Publish a change to record version 1!
                  </div>
                ) : (
                  docMeta.revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                          v{rev.version}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(rev.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-medium">{rev.note || `Version ${rev.version}`}</p>
                      {rev.author && <div className="text-[11px] text-slate-500">Author: {rev.author}</div>}

                      <button
                        type="button"
                        onClick={() => handleRestoreRevision(rev.id, rev.version)}
                        className="w-full mt-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore This Version</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHistoryDrawer(false)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold mt-4"
            >
              Close History
            </button>
          </div>
        </div>
      )}

      {/* MEDIA PICKER MODAL */}
      {showMediaPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl bg-[#04152D] border border-scalora-blue/30 rounded-3xl p-6 space-y-5 shadow-2xl max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Select Media Asset</h3>
              </div>
              <button
                onClick={() => {
                  setShowMediaPickerModal(false);
                  setMediaPickerCallback(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Search media..."
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
              />

              <label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer">
                <span>Upload New</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'general')}
                  accept="image/*,.svg,.pdf,video/*"
                />
              </label>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
              {mediaList.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    if (mediaPickerCallback) {
                      mediaPickerCallback(m.fileUrl);
                    }
                    setShowMediaPickerModal(false);
                    setMediaPickerCallback(null);
                  }}
                  className="group cursor-pointer rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500 p-2 space-y-2 transition-all"
                >
                  <div className="h-24 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center">
                    {m.fileType === 'IMAGE' || m.fileType === 'SVG' ? (
                      <img
                        src={resolveMediaUrl(m.fileUrl)}
                        alt={m.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <File className="w-8 h-8 text-slate-500" />
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-white truncate">{m.name}</div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowMediaPickerModal(false);
                setMediaPickerCallback(null);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* LIVE PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-5xl bg-[#04152D] border border-scalora-blue/30 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Live Visual Preview (Draft Data)</h3>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-white text-slate-900 space-y-6">
              {activeTab === 'home' && (
                <div className="space-y-6">
                  <div className="p-8 rounded-2xl bg-gradient-to-b from-blue-50 via-white to-white text-center space-y-4">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                      {homeData.hero.pillBadge}
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
                      {homeData.hero.headline}
                    </h1>
                    <p className="text-sm text-slate-600 max-w-2xl mx-auto">{homeData.hero.subheadline}</p>
                    <div className="flex justify-center gap-3 pt-2">
                      <span className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs">
                        {homeData.hero.cta1Text}
                      </span>
                      <span className="px-6 py-3 rounded-xl bg-white border border-slate-300 font-bold text-xs">
                        {homeData.hero.cta2Text}
                      </span>
                    </div>
                  </div>

                  {homeData.stats.visible && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-2xl text-center">
                      <div>
                        <div className="text-xl font-bold text-blue-600">{homeData.stats.studentsCount}</div>
                        <div className="text-xs text-slate-600">{homeData.stats.studentsLabel}</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-600">{homeData.stats.coursesCount}</div>
                        <div className="text-xs text-slate-600">{homeData.stats.coursesLabel}</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-600">{homeData.stats.certificatesCount}</div>
                        <div className="text-xs text-slate-600">{homeData.stats.certificatesLabel}</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-600">{homeData.stats.communityCount}</div>
                        <div className="text-xs text-slate-600">{homeData.stats.communityLabel}</div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {homeData.features.map((f) => (
                      <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                        <div className="text-sm font-bold text-slate-900">{f.title}</div>
                        <p className="text-xs text-slate-600">{f.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab !== 'home' && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Visual preview active for {activeTab}. Draft settings are ready to be published!
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminCmsPage;
