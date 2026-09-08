import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
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
} from '../types/cms';
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
  DEFAULT_ALL_CMS,
} from '../data/defaultCmsData';

export const CACHE_KEY = 'scalora_cms_cache_v2';

interface CmsContextType {
  home: CmsHomePageData;
  courses: CmsCoursesPageData;
  community: CmsCommunityPageData;
  about: CmsAboutPageData;
  trainers: CmsTrainersData;
  partners: CmsPartnersData;
  navigation: CmsNavigationData;
  theme: CmsThemeData;
  seo: CmsSeoData;
  cmsData: Record<string, any>;
  loading: boolean;
  hasCache: boolean;
  refreshCms: () => Promise<void>;
  getPageSeo: (pageKey: string) => { title: string; description: string; keywords: string; ogImage: string; canonicalUrl: string };
}

const CmsContext = createContext<CmsContextType | undefined>(undefined);

// Helper to broadcast CMS updates across tabs
export const broadcastCmsUpdate = (payload?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    if ('BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('scalora_cms_sync');
        channel.postMessage({ type: 'CMS_UPDATED', payload, timestamp: Date.now() });
        channel.close();
      } catch {}
    }
    if (payload) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      } catch {}
    }
  }
};

const getInitialCmsData = (): { data: Record<string, any>; hasCache: boolean } => {
  if (typeof window === 'undefined') {
    return { data: DEFAULT_ALL_CMS, hasCache: false };
  }
  try {
    const cachedStr = localStorage.getItem(CACHE_KEY);
    if (cachedStr) {
      const parsed = JSON.parse(cachedStr);
      if (parsed && typeof parsed === 'object') {
        return {
          data: { ...DEFAULT_ALL_CMS, ...parsed },
          hasCache: true,
        };
      }
    }
  } catch (e) {
    console.warn('[CMS Cache] Failed to parse cached CMS data:', e);
  }
  return { data: DEFAULT_ALL_CMS, hasCache: false };
};

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = getInitialCmsData();
  const [cmsData, setCmsData] = useState<Record<string, any>>(initial.data);
  const [hasCache, setHasCache] = useState<boolean>(initial.hasCache);
  const [loading, setLoading] = useState<boolean>(!initial.hasCache);

  const fetchPublishedCms = useCallback(async (isBackground = false) => {
    if (!isBackground && !hasCache) {
      setLoading(true);
    }
    try {
      const res = await api.get<{ success: boolean; data: Record<string, any> }>(
        `/cms/published-all?_t=${Date.now()}`
      );
      if (res.success && res.data) {
        setCmsData((prev) => ({
          ...prev,
          ...res.data,
        }));
        setHasCache(true);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(res.data));
        } catch (e) {
          console.warn('[CMS Cache] Storage write failed:', e);
        }
      }
    } catch (err) {
      console.warn('[CMS] Using cached/built-in fallback defaults:', err);
    } finally {
      setLoading(false);
    }
  }, [hasCache]);

  useEffect(() => {
    fetchPublishedCms(hasCache);
  }, [fetchPublishedCms, hasCache]);

  // Listen for Cross-Tab Real-time CMS Broadcasts & Storage Events
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('scalora_cms_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'CMS_UPDATED') {
          if (event.data?.payload) {
            setCmsData((prev) => ({ ...prev, ...event.data.payload }));
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify(event.data.payload));
            } catch {}
          } else {
            fetchPublishedCms(true);
          }
        }
      };
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CACHE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            setCmsData((prev) => ({ ...prev, ...parsed }));
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      channel?.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchPublishedCms]);

  // Inject Dynamic Theme Variables into :root immediately
  useEffect(() => {
    const theme: CmsThemeData = { ...DEFAULT_THEME_CMS, ...(cmsData.theme || {}) };
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme.primaryColor) root.style.setProperty('--color-primary', theme.primaryColor);
      if (theme.secondaryColor) root.style.setProperty('--color-secondary', theme.secondaryColor);
      if (theme.accentColor) root.style.setProperty('--color-accent', theme.accentColor);
    }
  }, [cmsData.theme]);

  const getPageSeo = (pageKey: string) => {
    const seoData: CmsSeoData = { ...DEFAULT_SEO_CMS, ...(cmsData.seo || {}) };
    const pageSeo = seoData.pages?.[pageKey] || DEFAULT_SEO_CMS.pages[pageKey] || {
      title: seoData.globalSiteName,
      description: seoData.globalMetaDescription,
      keywords: '',
      ogImage: seoData.globalOgImage,
      canonicalUrl: seoData.canonicalDomain,
    };
    return pageSeo;
  };

  const value: CmsContextType = {
    home: { ...DEFAULT_HOME_CMS, ...(cmsData.page_home || {}) },
    courses: { ...DEFAULT_COURSES_CMS, ...(cmsData.page_courses || {}) },
    community: { ...DEFAULT_COMMUNITY_CMS, ...(cmsData.page_community || {}) },
    about: { ...DEFAULT_ABOUT_CMS, ...(cmsData.page_about || {}) },
    trainers: { ...DEFAULT_TRAINERS_CMS, ...(cmsData.trainers || {}) },
    partners: { ...DEFAULT_PARTNERS_CMS, ...(cmsData.partners || {}) },
    navigation: { ...DEFAULT_NAVIGATION_CMS, ...(cmsData.navigation || {}) },
    theme: { ...DEFAULT_THEME_CMS, ...(cmsData.theme || {}) },
    seo: { ...DEFAULT_SEO_CMS, ...(cmsData.seo || {}) },
    cmsData,
    loading,
    hasCache,
    refreshCms: () => fetchPublishedCms(false),
    getPageSeo,
  };

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) {
    throw new Error('useCms must be used within a CmsProvider');
  }
  return context;
};
