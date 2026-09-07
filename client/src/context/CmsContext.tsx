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
  refreshCms: () => Promise<void>;
  getPageSeo: (pageKey: string) => { title: string; description: string; keywords: string; ogImage: string; canonicalUrl: string };
}

const CmsContext = createContext<CmsContextType | undefined>(undefined);

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cmsData, setCmsData] = useState<Record<string, any>>(DEFAULT_ALL_CMS);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPublishedCms = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: Record<string, any> }>('/cms/published-all');
      if (res.success && res.data) {
        setCmsData((prev) => ({
          ...prev,
          ...res.data,
        }));
      }
    } catch (err) {
      console.warn('[CMS] Using built-in high-converting fallback defaults:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublishedCms();
  }, [fetchPublishedCms]);

  // Inject Dynamic Theme Variables into :root
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
    refreshCms: fetchPublishedCms,
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
