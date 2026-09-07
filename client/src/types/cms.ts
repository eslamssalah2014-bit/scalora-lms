// ============================================================================
// SCALORA ENTERPRISE CMS TYPE DEFINITIONS
// ============================================================================

export interface CmsHero {
  pillBadge: string;
  pillPing: boolean;
  headline: string;
  headlineGradientWord: string;
  subheadline: string;
  cta1Text: string;
  cta1Link: string;
  cta2Text: string;
  cta2Link: string;
  heroImageUrl: string;
  backgroundImageUrl: string;
  videoUrl: string;
  showVideo: boolean;
}

export interface CmsStats {
  visible: boolean;
  studentsCount: string;
  studentsLabel: string;
  coursesCount: string;
  coursesLabel: string;
  certificatesCount: string;
  certificatesLabel: string;
  communityCount: string;
  communityLabel: string;
}

export interface CmsFeatureCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  order: number;
}

export interface CmsWhyScaloraCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  order: number;
}

export interface CmsWhyScalora {
  title: string;
  description: string;
  cards: CmsWhyScaloraCard[];
}

export interface CmsTestimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  photoUrl: string;
  review: string;
  rating: number; // 1 to 5
  order: number;
}

export interface CmsFaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface CmsHomePageData {
  hero: CmsHero;
  stats: CmsStats;
  features: CmsFeatureCard[];
  whyScalora: CmsWhyScalora;
  testimonials: CmsTestimonial[];
  faq: CmsFaqItem[];
}

export interface CmsComingSoonCourse {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  launchDate: string;
  notifyButtonText: string;
  category: string;
  featured: boolean;
  order: number;
}

export interface CmsCoursesPageData {
  headerTitle: string;
  headerHeadline: string;
  headerDescription: string;
  featuredSectionTitle: string;
  upcomingSectionTitle: string;
  comingSoonCourses: CmsComingSoonCourse[];
  featuredCourseSlugs: string[];
  customBadges: Record<string, string>;
}

export interface CmsCommunityBenefit {
  id: string;
  icon: string;
  title: string;
  description: string;
  order: number;
}

export interface CmsCommunityPageData {
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  heroImageUrl: string;
  cta1Text: string;
  cta1Link: string;
  cta2Text: string;
  cta2Link: string;
  benefits: CmsCommunityBenefit[];
}

export interface CmsTeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  linkedin?: string;
  order: number;
}

export interface CmsMilestone {
  id: string;
  year: string;
  title: string;
  description: string;
  order: number;
}

export interface CmsFounder {
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  quote: string;
}

export interface CmsAboutPageData {
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  storyTitle: string;
  storyContent: string;
  mission: string;
  vision: string;
  founder: CmsFounder;
  team: CmsTeamMember[];
  milestones: CmsMilestone[];
}

export interface CmsTrainerItem {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  specialties: string[];
  linkedin?: string;
  twitter?: string;
  github?: string;
  website?: string;
  featured: boolean;
  order: number;
}

export interface CmsTrainersData {
  sectionTitle: string;
  sectionDescription: string;
  trainersList: CmsTrainerItem[];
}

export interface CmsPartnerItem {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
  order: number;
  active: boolean;
}

export interface CmsPartnersData {
  sectionTitle: string;
  sectionDescription: string;
  partnersList: CmsPartnerItem[];
}

export interface CmsNavigationLink {
  id: string;
  label: string;
  url: string;
  order: number;
  visible: boolean;
  newTab?: boolean;
}

export interface CmsFooterColumn {
  id: string;
  title: string;
  order: number;
  links: {
    id: string;
    label: string;
    url: string;
    order: number;
    visible: boolean;
  }[];
}

export interface CmsNavigationData {
  headerLinks: CmsNavigationLink[];
  footerColumns: CmsFooterColumn[];
  ctaButton: {
    text: string;
    url: string;
    visible: boolean;
  };
}

export interface CmsThemeData {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  secondaryBgColor: string;
  textColor: string;
  logoUrl: string;
  faviconUrl: string;
  footerLogoUrl: string;
  headingFont: string;
  bodyFont: string;
}

export interface CmsPageSeo {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  canonicalUrl: string;
}

export interface CmsSeoData {
  globalSiteName: string;
  globalMetaDescription: string;
  globalOgImage: string;
  canonicalDomain: string;
  pages: {
    home: CmsPageSeo;
    courses: CmsPageSeo;
    community: CmsPageSeo;
    about: CmsPageSeo;
    services: CmsPageSeo;
    contact: CmsPageSeo;
    [key: string]: CmsPageSeo;
  };
}

export interface CmsMediaItem {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  fileType: 'IMAGE' | 'SVG' | 'VIDEO' | 'PDF' | 'OTHER';
  mimeType: string;
  fileSize: string;
  folder: string;
  altText?: string;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsRevisionItem {
  id: string;
  documentId: string;
  version: number;
  data: string;
  note?: string;
  author?: string;
  createdAt: string;
}

export interface CmsDocumentSummary {
  key: string;
  id: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string | null;
  hasDraftChanges: boolean;
  lastUpdatedBy: string | null;
  revisionsCount: number;
}

export interface CmsFullDocument<T = any> {
  key: string;
  id: string;
  draftData: T;
  publishedData: T;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
  lastUpdatedBy: string | null;
  revisions: CmsRevisionItem[];
}
