"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMedia = exports.updateMedia = exports.uploadMedia = exports.getMediaLibrary = exports.resetAdminToDefaults = exports.restoreAdminRevision = exports.revertAdminDraft = exports.publishAdminDraft = exports.saveAdminDraft = exports.getAdminDocumentByKey = exports.getAdminDocuments = exports.getSitemapXml = exports.getTheme = exports.getAllPublished = exports.getPublishedDocument = exports.DEFAULT_CMS_DATA = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_js_1 = require("../lib/prisma.js");
// ============================================================================
// RICH ENTERPRISE CMS DEFAULT DATA (BUILT-IN FALLBACKS)
// ============================================================================
exports.DEFAULT_CMS_DATA = {
    page_home: {
        hero: {
            pillBadge: 'Enterprise Operations Consulting & Technical Academy',
            pillPing: true,
            headline: 'Elevate Enterprise Excellence with Scalora',
            headlineGradientWord: 'Scalora',
            subheadline: 'We empower modern organizations through two unified pillars: high-impact Operations Consulting that structures business systems, and a premier Community & Academy for engineers and operators.',
            cta1Text: 'Explore Courses',
            cta1Link: '#featured-courses',
            cta2Text: 'Explore Consulting',
            cta2Link: '/services',
            heroImageUrl: '',
            backgroundImageUrl: '',
            videoUrl: '',
            showVideo: false,
        },
        stats: {
            visible: true,
            studentsCount: '15,000+',
            studentsLabel: 'Active Operators & Engineers',
            coursesCount: '25+',
            coursesLabel: 'Production Masterclasses',
            certificatesCount: '9,800+',
            certificatesLabel: 'Official Verified Certs',
            communityCount: '45,000+',
            communityLabel: 'Community Members',
        },
        features: [
            {
                id: 'feat_1',
                icon: 'Cpu',
                title: 'Production Systems Architecture',
                description: 'Directly applicable designs taken from high-scale real-world production deployments.',
                order: 1,
            },
            {
                id: 'feat_2',
                icon: 'Award',
                title: 'Cryptographic Credentials',
                description: 'Earn tamper-proof certificates verifying your practical engineering accomplishments.',
                order: 2,
            },
            {
                id: 'feat_3',
                icon: 'Workflow',
                title: 'Zero-Touch Automations',
                description: 'Automate business and development workflows with n8n, Make, and autonomous AI agents.',
                order: 3,
            },
            {
                id: 'feat_4',
                icon: 'ShieldCheck',
                title: 'Enterprise SLAs & Security',
                description: 'Battle-tested practices built for enterprise compliance, privacy, and resilience.',
                order: 4,
            },
        ],
        whyScalora: {
            title: 'Why Global Tech Leaders Choose Scalora',
            description: 'Engineered for measurable business ROI and permanent engineering capability.',
            cards: [
                {
                    id: 'why_1',
                    icon: 'Code2',
                    title: 'Enterprise-Grade Curriculum',
                    description: 'No synthetic or toy tutorials. Every module is derived from production client engagements.',
                    order: 1,
                },
                {
                    id: 'why_2',
                    icon: 'Users',
                    title: 'Senior Practitioner Mentors',
                    description: 'Direct 1-on-1 code reviews and architecture guidance from veterans with 10+ years experience.',
                    order: 2,
                },
                {
                    id: 'why_3',
                    icon: 'Zap',
                    title: 'Offline PWA Ecosystem',
                    description: 'Study and review materials seamlessly anywhere with our installable progressive web app.',
                    order: 3,
                },
            ],
        },
        testimonials: [
            {
                id: 'test_1',
                name: 'Alexandre Meyer',
                role: 'VP of Engineering',
                company: 'FinTech Cloud Labs',
                photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                review: 'Scalora transformed our devops engineering pipeline in under 6 weeks. The course depth is unmatched.',
                rating: 5,
                order: 1,
            },
            {
                id: 'test_2',
                name: 'Sarah Jenkins',
                role: 'Operations Director',
                company: 'Veloce Logistics',
                photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
                review: 'Their consulting team automated 70% of our manual ticketing workflows. Highly recommend Scalora.',
                rating: 5,
                order: 2,
            },
            {
                id: 'test_3',
                name: 'Tarek Mansour',
                role: 'Lead Cloud Architect',
                company: 'Apex Telecom',
                photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                review: 'The Kubernetes and AI Agent labs provided real production code templates that we put directly into staging.',
                rating: 5,
                order: 3,
            },
        ],
        faq: [
            {
                id: 'faq_1',
                question: 'Are Scalora courses self-paced or cohort-based?',
                answer: 'All Scalora courses offer lifetime self-paced video lessons with structured milestones, combined with live cohort Q&A sessions and real-time community channels.',
                order: 1,
            },
            {
                id: 'faq_2',
                question: 'Can my company purchase enterprise team seats?',
                answer: 'Yes! We offer bulk team licensing, custom learning dashboards, and dedicated private workshops for corporate teams.',
                order: 2,
            },
            {
                id: 'faq_3',
                question: 'How do I verify a student certificate?',
                answer: 'Every certificate issued has a unique cryptographic verification number and public URL that can be checked instantly on our certificate verification page.',
                order: 3,
            },
        ],
    },
    page_courses: {
        headerTitle: 'Mastery Catalog',
        headerHeadline: 'Master Real-World Engineering & Operations',
        headerDescription: 'Hands-on, project-driven engineering and operational masterclasses taught by senior industry practitioners.',
        featuredSectionTitle: 'Featured Masterclasses',
        upcomingSectionTitle: 'Coming Soon Masterclasses',
        comingSoonCourses: [
            {
                id: 'cs_1',
                title: 'Enterprise AI Agent Orchestration (LangGraph & n8n)',
                thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
                description: 'Architect resilient multi-agent automation systems with automated human-in-the-loop validation.',
                launchDate: '2026-10-15',
                notifyButtonText: 'Join Priority Waitlist',
                category: 'AI & Automation',
                featured: true,
                order: 1,
            },
            {
                id: 'cs_2',
                title: 'Kubernetes Multi-Cluster GitOps at Scale',
                thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80',
                description: 'Deploy ArgoCD, Cilium eBPF, and automated zero-downtime canary rollouts across hybrid clouds.',
                launchDate: '2026-11-01',
                notifyButtonText: 'Register Interest',
                category: 'DevOps & Cloud',
                featured: true,
                order: 2,
            },
        ],
        featuredCourseSlugs: [],
        customBadges: {
            'kubernetes-mastery': 'Bestseller',
            'ai-systems': 'Hot',
        },
    },
    page_community: {
        heroBadge: 'Global Scalora Ecosystem',
        heroTitle: 'Join 45,000+ Engineers, Founders & Operators',
        heroDescription: 'Connect directly with peers, get code reviews from veteran architects, access live masterclasses, and explore high-tier tech opportunities.',
        heroImageUrl: '',
        cta1Text: 'Enter Community',
        cta1Link: '/dashboard',
        cta2Text: 'Browse Channels',
        cta2Link: '#channels',
        benefits: [
            {
                id: 'ben_1',
                icon: 'MessageSquare',
                title: 'Real-Time Architecture Discussions',
                description: 'Get immediate feedback on your system diagrams, deployment YAMLs, and workflow pipelines.',
                order: 1,
            },
            {
                id: 'ben_2',
                icon: 'Calendar',
                title: 'Bi-Weekly Live Masterclasses',
                description: 'Attend deep-dive engineering livestreams and ask direct questions in open office hours.',
                order: 2,
            },
            {
                id: 'ben_3',
                icon: 'Briefcase',
                title: 'Exclusive Job & Project Board',
                description: 'High-paying remote roles, contract consulting gigs, and startup co-founder opportunities.',
                order: 3,
            },
        ],
    },
    page_about: {
        heroBadge: 'The Scalora Vision',
        heroTitle: 'Bridging Operational Systems & Technical Mastery',
        heroDescription: 'Scalora was engineered to resolve the two greatest obstacles to business scale: chaotic operational infrastructure and the technical skill gap.',
        storyTitle: 'Our Story & Philosophy',
        storyContent: 'Founded by veteran cloud engineers and operations directors, Scalora combines enterprise-grade consulting methodologies with world-class hands-on technical education.',
        mission: 'To democratize production-grade engineering excellence and build reliable, automated operating infrastructure for companies worldwide.',
        vision: 'To be the standard of excellence for modern operational architecture and professional engineering credentials.',
        founder: {
            name: 'Eslam Salah',
            title: 'Founder & Principal Architect',
            bio: 'Enterprise systems architect with over a decade of experience designing mission-critical cloud pipelines and operational ERP engines for multinational organizations.',
            photoUrl: '',
            quote: 'True engineering excellence is measured by the durability and clarity of the systems you leave behind.',
        },
        team: [
            {
                id: 'team_1',
                name: 'Sherief El-Sayed',
                role: 'Head of Cloud Education',
                bio: 'Former Senior DevOps Lead specializing in distributed Kubernetes systems and multi-cloud resilience.',
                photoUrl: '',
                linkedin: 'https://linkedin.com',
                order: 1,
            },
            {
                id: 'team_2',
                name: 'Khaled Mansour',
                role: 'Director of AI Engineering',
                bio: 'Pioneered enterprise LLM agent architectures and zero-touch automation workflows.',
                photoUrl: '',
                linkedin: 'https://linkedin.com',
                order: 2,
            },
        ],
        milestones: [
            {
                id: 'mile_1',
                year: '2024',
                title: 'Platform Genesis',
                description: 'Scalora launched initial cloud masterclasses and enterprise consulting sprints.',
                order: 1,
            },
            {
                id: 'mile_2',
                year: '2025',
                title: '10,000 Verified Certifications',
                description: 'Expanded into global community learning and real-time student mentorship.',
                order: 2,
            },
            {
                id: 'mile_3',
                year: '2026',
                title: 'Unified Enterprise LMS & PWA',
                description: 'Launched full offline PWA, AI study planner, and enterprise consulting ecosystem.',
                order: 3,
            },
        ],
    },
    trainers: {
        sectionTitle: 'Senior Practitioner Faculty',
        sectionDescription: 'Learn directly from architects who build and maintain multi-million dollar production systems every day.',
        trainersList: [
            {
                id: 'tr_1',
                name: 'Eslam Salah',
                title: 'Lead Systems Architect & Founder',
                bio: '12+ years building distributed cloud platforms, high-throughput microservices, and enterprise ERP architectures.',
                photoUrl: '',
                specialties: ['Cloud Architecture', 'Distributed Systems', 'Go & TypeScript'],
                linkedin: 'https://linkedin.com',
                twitter: '',
                github: '',
                website: '',
                featured: true,
                order: 1,
            },
            {
                id: 'tr_2',
                name: 'Sherief El-Sayed',
                title: 'Senior DevOps & SRE Specialist',
                bio: 'Expert in Kubernetes orchestration, GitOps automation, and zero-downtime continuous deployment.',
                photoUrl: '',
                specialties: ['Kubernetes', 'Terraform', 'CI/CD Pipelines'],
                linkedin: 'https://linkedin.com',
                twitter: '',
                github: '',
                website: '',
                featured: true,
                order: 2,
            },
        ],
    },
    partners: {
        sectionTitle: 'Trusted by Innovative Engineering Teams',
        sectionDescription: 'Empowering engineering and operations departments at high-growth startups and global enterprises.',
        partnersList: [
            {
                id: 'part_1',
                name: 'CloudScale Technologies',
                logoUrl: '',
                websiteUrl: 'https://cloudscale.io',
                order: 1,
                active: true,
            },
            {
                id: 'part_2',
                name: 'Nexus Automation Labs',
                logoUrl: '',
                websiteUrl: 'https://nexuslabs.com',
                order: 2,
                active: true,
            },
            {
                id: 'part_3',
                name: 'Apex Telecom Systems',
                logoUrl: '',
                websiteUrl: 'https://apextelecom.com',
                order: 3,
                active: true,
            },
        ],
    },
    navigation: {
        headerLinks: [
            { id: 'nav_1', label: 'Services', url: '/services', order: 1, visible: true, newTab: false },
            { id: 'nav_2', label: 'Courses', url: '/courses', order: 2, visible: true, newTab: false },
            { id: 'nav_3', label: 'Community', url: '/community', order: 3, visible: true, newTab: false },
            { id: 'nav_4', label: 'About', url: '/about', order: 4, visible: true, newTab: false },
            { id: 'nav_5', label: 'Contact', url: '/contact', order: 5, visible: true, newTab: false },
        ],
        footerColumns: [
            {
                id: 'col_1',
                title: 'Platform',
                order: 1,
                links: [
                    { id: 'fl_1', label: 'Masterclasses', url: '/courses', order: 1, visible: true },
                    { id: 'fl_2', label: 'Consulting Services', url: '/services', order: 2, visible: true },
                    { id: 'fl_3', label: 'Community Hub', url: '/community', order: 3, visible: true },
                    { id: 'fl_4', label: 'Study Planner', url: '/study-plan', order: 4, visible: true },
                ],
            },
            {
                id: 'col_2',
                title: 'Company',
                order: 2,
                links: [
                    { id: 'fl_5', label: 'About Scalora', url: '/about', order: 1, visible: true },
                    { id: 'fl_6', label: 'Consulting Inquiries', url: '/contact', order: 2, visible: true },
                    { id: 'fl_7', label: 'Terms of Service', url: '#', order: 3, visible: true },
                    { id: 'fl_8', label: 'Privacy Policy', url: '#', order: 4, visible: true },
                ],
            },
        ],
        ctaButton: {
            text: 'Get Started',
            url: '/courses',
            visible: true,
        },
    },
    theme: {
        primaryColor: '#2563EB', // Scalora Blue
        secondaryColor: '#4F46E5', // Indigo
        accentColor: '#38BDF8', // Sky Blue
        backgroundColor: '#FFFFFF', // Clean White
        secondaryBgColor: '#F8FAFC', // Slate 50
        textColor: '#0F172A', // Slate 900
        logoUrl: '/scalora-icon-transparent.png',
        faviconUrl: '/favicon.ico',
        footerLogoUrl: '/scalora-icon-transparent.png',
        headingFont: 'Plus Jakarta Sans',
        bodyFont: 'Plus Jakarta Sans',
    },
    seo: {
        globalSiteName: 'Scalora LMS & Enterprise Consulting',
        globalMetaDescription: 'Enterprise Operations Consulting & Technical Academy. High-impact business systems and production-grade engineering courses.',
        globalOgImage: '',
        canonicalDomain: 'https://scalora.com',
        pages: {
            home: {
                title: 'Scalora — Enterprise Operations Consulting & Technical Academy',
                description: 'Empowering modern organizations through Operations Consulting and high-impact engineering masterclasses.',
                keywords: 'lms, enterprise consulting, kubernetes, cloud architecture, ai agents, business operations',
                ogImage: '',
                canonicalUrl: 'https://scalora.com',
            },
            courses: {
                title: 'Courses & Masterclasses — Scalora Academy',
                description: 'Explore production-grade engineering and operational courses taught by senior architects.',
                keywords: 'online courses, coding masterclasses, cloud architecture, devops courses',
                ogImage: '',
                canonicalUrl: 'https://scalora.com/courses',
            },
            community: {
                title: 'Global Engineering Community — Scalora',
                description: 'Join 45,000+ engineers, founders, and operators in real-time technical channels and livestreams.',
                keywords: 'developer community, cloud engineers, tech network, study groups',
                ogImage: '',
                canonicalUrl: 'https://scalora.com/community',
            },
            about: {
                title: 'About Scalora — The Vision & Team',
                description: 'Learn how Scalora is bridging operational systems architecture with technical engineering mastery.',
                keywords: 'about scalora, engineering founders, operations consulting',
                ogImage: '',
                canonicalUrl: 'https://scalora.com/about',
            },
            services: {
                title: 'Enterprise Operations Consulting — Scalora',
                description: 'Custom ERP architectures, AI workflow automations, and operational system playbooks.',
                keywords: 'operations consulting, workflow automation, custom erp, systems engineering',
                ogImage: '',
                canonicalUrl: 'https://scalora.com/services',
            },
            contact: {
                title: 'Contact Scalora — Book a Consulting Sprint',
                description: 'Get in touch with our leadership team for custom consulting sprints and corporate academy training.',
                keywords: 'contact scalora, enterprise inquiry, book consulting',
                ogImage: '',
                canonicalUrl: 'https://scalora.com/contact',
            },
        },
    },
};
// Helper to safely extract string param
const getParam = (param) => {
    if (typeof param === 'string')
        return param;
    if (Array.isArray(param))
        return String(param[0] || '');
    return '';
};
// ============================================================================
// PUBLIC READ ENDPOINTS (FAST & CACHED WITH DEFAULT FALLBACK)
// ============================================================================
const getPublishedDocument = async (req, res) => {
    const key = getParam(req.params.key);
    try {
        const defaultData = exports.DEFAULT_CMS_DATA[key] || {};
        const doc = await prisma_js_1.prisma.cmsDocument.findUnique({
            where: { key },
        });
        if (!doc || !doc.publishedData) {
            res.json({
                success: true,
                key,
                data: defaultData,
                isDefault: true,
                publishedAt: null,
            });
            return;
        }
        try {
            const parsed = JSON.parse(doc.publishedData);
            res.json({
                success: true,
                key,
                data: { ...defaultData, ...parsed },
                isDefault: false,
                publishedAt: doc.publishedAt,
            });
        }
        catch {
            res.json({
                success: true,
                key,
                data: defaultData,
                isDefault: true,
            });
        }
    }
    catch (error) {
        console.error(`[CMS] Error fetching published document '${key}':`, error);
        res.json({
            success: true,
            key,
            data: exports.DEFAULT_CMS_DATA[key] || {},
            isDefault: true,
        });
    }
};
exports.getPublishedDocument = getPublishedDocument;
const getAllPublished = async (_req, res) => {
    try {
        const docs = await prisma_js_1.prisma.cmsDocument.findMany();
        const result = { ...exports.DEFAULT_CMS_DATA };
        for (const doc of docs) {
            if (doc.publishedData) {
                try {
                    const parsed = JSON.parse(doc.publishedData);
                    result[doc.key] = { ...(result[doc.key] || {}), ...parsed };
                }
                catch {
                    // ignore corrupted json and keep fallback
                }
            }
        }
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error('[CMS] Error fetching all published CMS documents:', error);
        res.json({
            success: true,
            data: exports.DEFAULT_CMS_DATA,
        });
    }
};
exports.getAllPublished = getAllPublished;
const getTheme = async (_req, res) => {
    try {
        const doc = await prisma_js_1.prisma.cmsDocument.findUnique({
            where: { key: 'theme' },
        });
        let themeData = exports.DEFAULT_CMS_DATA.theme;
        if (doc?.publishedData) {
            try {
                themeData = { ...themeData, ...JSON.parse(doc.publishedData) };
            }
            catch { }
        }
        res.json({
            success: true,
            theme: themeData,
        });
    }
    catch (error) {
        res.json({
            success: true,
            theme: exports.DEFAULT_CMS_DATA.theme,
        });
    }
};
exports.getTheme = getTheme;
const getSitemapXml = async (_req, res) => {
    try {
        const seoDoc = await prisma_js_1.prisma.cmsDocument.findUnique({ where: { key: 'seo' } });
        let canonicalDomain = 'https://scalora.com';
        const pagesList = ['/', '/courses', '/community', '/about', '/services', '/contact'];
        if (seoDoc?.publishedData) {
            try {
                const parsed = JSON.parse(seoDoc.publishedData);
                if (parsed.canonicalDomain)
                    canonicalDomain = parsed.canonicalDomain.replace(/\/$/, '');
            }
            catch { }
        }
        // Include published courses dynamically
        const courses = await prisma_js_1.prisma.course.findMany({
            where: { deletedAt: null, isPublished: true },
            select: { slug: true, updatedAt: true },
        });
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        pagesList.forEach((p) => {
            xml += `  <url>\n`;
            xml += `    <loc>${canonicalDomain}${p}</loc>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>${p === '/' ? '1.0' : '0.8'}</priority>\n`;
            xml += `  </url>\n`;
        });
        courses.forEach((c) => {
            xml += `  <url>\n`;
            xml += `    <loc>${canonicalDomain}/courses/${c.slug}</loc>\n`;
            xml += `    <lastmod>${new Date(c.updatedAt).toISOString().split('T')[0]}</lastmod>\n`;
            xml += `    <changefreq>daily</changefreq>\n`;
            xml += `    <priority>0.9</priority>\n`;
            xml += `  </url>\n`;
        });
        xml += `</urlset>`;
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    }
    catch (error) {
        console.error('[CMS] Error generating sitemap.xml:', error);
        res.status(500).send('<error>Failed to generate sitemap</error>');
    }
};
exports.getSitemapXml = getSitemapXml;
// ============================================================================
// ADMIN CMS MANAGEMENT ENDPOINTS (PROTECTED BY AUTH & ADMIN ROLE)
// ============================================================================
const getAdminDocuments = async (_req, res) => {
    try {
        const docs = await prisma_js_1.prisma.cmsDocument.findMany({
            include: {
                revisions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
            orderBy: { key: 'asc' },
        });
        // Merge with keys in DEFAULT_CMS_DATA
        const keys = Object.keys(exports.DEFAULT_CMS_DATA);
        const existingMap = new Map(docs.map((d) => [d.key, d]));
        const result = keys.map((k) => {
            const existing = existingMap.get(k);
            return {
                key: k,
                id: existing?.id || null,
                isPublished: existing?.isPublished || false,
                publishedAt: existing?.publishedAt || null,
                updatedAt: existing?.updatedAt || null,
                hasDraftChanges: Boolean(existing && existing.publishedData && existing.draftData !== existing.publishedData),
                lastUpdatedBy: existing?.lastUpdatedBy || null,
                revisionsCount: existing?.revisions?.length || 0,
            };
        });
        res.json({
            success: true,
            documents: result,
        });
    }
    catch (error) {
        console.error('[CMS] Error listing admin documents:', error);
        res.status(500).json({ success: false, message: error.message || 'Error fetching CMS documents' });
    }
};
exports.getAdminDocuments = getAdminDocuments;
const getAdminDocumentByKey = async (req, res) => {
    const key = getParam(req.params.key);
    try {
        const defaultData = exports.DEFAULT_CMS_DATA[key] || {};
        let doc = await prisma_js_1.prisma.cmsDocument.findUnique({
            where: { key },
            include: {
                revisions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        });
        // If document record doesn't exist yet, create initial draft record from defaults
        if (!doc) {
            doc = await prisma_js_1.prisma.cmsDocument.create({
                data: {
                    key,
                    draftData: JSON.stringify(defaultData),
                    publishedData: JSON.stringify(defaultData),
                    isPublished: true,
                    publishedAt: new Date(),
                    lastUpdatedBy: req.user?.name || 'System Initializer',
                },
                include: {
                    revisions: true,
                },
            });
        }
        let draftData = defaultData;
        let publishedData = defaultData;
        try {
            draftData = JSON.parse(doc.draftData);
        }
        catch { }
        try {
            if (doc.publishedData)
                publishedData = JSON.parse(doc.publishedData);
        }
        catch { }
        res.json({
            success: true,
            key,
            id: doc.id,
            draftData,
            publishedData,
            isPublished: doc.isPublished,
            publishedAt: doc.publishedAt,
            updatedAt: doc.updatedAt,
            lastUpdatedBy: doc.lastUpdatedBy,
            revisions: doc.revisions || [],
        });
    }
    catch (error) {
        console.error(`[CMS] Error getting document '${key}':`, error);
        res.status(500).json({ success: false, message: error.message || 'Error fetching document' });
    }
};
exports.getAdminDocumentByKey = getAdminDocumentByKey;
const saveAdminDraft = async (req, res) => {
    const key = getParam(req.params.key);
    try {
        const { data } = req.body;
        if (!data || typeof data !== 'object') {
            res.status(400).json({ success: false, message: 'Invalid CMS data payload' });
            return;
        }
        const draftDataString = JSON.stringify(data);
        const userName = req.user?.name || 'Admin';
        const doc = await prisma_js_1.prisma.cmsDocument.upsert({
            where: { key },
            update: {
                draftData: draftDataString,
                lastUpdatedBy: userName,
                updatedAt: new Date(),
            },
            create: {
                key,
                draftData: draftDataString,
                publishedData: JSON.stringify(exports.DEFAULT_CMS_DATA[key] || data),
                isPublished: false,
                lastUpdatedBy: userName,
            },
        });
        res.json({
            success: true,
            message: 'Draft saved successfully',
            key: doc.key,
            updatedAt: doc.updatedAt,
        });
    }
    catch (error) {
        console.error(`[CMS] Error saving draft for '${key}':`, error);
        res.status(500).json({ success: false, message: error.message || 'Error saving CMS draft' });
    }
};
exports.saveAdminDraft = saveAdminDraft;
const publishAdminDraft = async (req, res) => {
    const key = getParam(req.params.key);
    try {
        const { note } = req.body;
        const userName = req.user?.name || 'Admin';
        const doc = await prisma_js_1.prisma.cmsDocument.findUnique({
            where: { key },
            include: {
                revisions: {
                    orderBy: { version: 'desc' },
                    take: 1,
                },
            },
        });
        if (!doc) {
            res.status(404).json({ success: false, message: 'Document not found' });
            return;
        }
        const nextVersion = (doc.revisions?.[0]?.version || 0) + 1;
        // Update document publishedData and insert new revision in transaction
        const [updatedDoc, newRevision] = await prisma_js_1.prisma.$transaction([
            prisma_js_1.prisma.cmsDocument.update({
                where: { key },
                data: {
                    publishedData: doc.draftData,
                    isPublished: true,
                    publishedAt: new Date(),
                    lastUpdatedBy: userName,
                    updatedAt: new Date(),
                },
            }),
            prisma_js_1.prisma.cmsRevision.create({
                data: {
                    documentId: doc.id,
                    version: nextVersion,
                    data: doc.draftData,
                    note: note || `Published version ${nextVersion}`,
                    author: userName,
                },
            }),
        ]);
        res.json({
            success: true,
            message: `Published version ${nextVersion} live to website successfully`,
            document: updatedDoc,
            revision: newRevision,
        });
    }
    catch (error) {
        console.error(`[CMS] Error publishing document '${key}':`, error);
        res.status(500).json({ success: false, message: error.message || 'Error publishing CMS draft' });
    }
};
exports.publishAdminDraft = publishAdminDraft;
const revertAdminDraft = async (req, res) => {
    const key = getParam(req.params.key);
    try {
        const doc = await prisma_js_1.prisma.cmsDocument.findUnique({
            where: { key },
        });
        if (!doc || !doc.publishedData) {
            res.status(400).json({ success: false, message: 'No published version available to revert to' });
            return;
        }
        const updated = await prisma_js_1.prisma.cmsDocument.update({
            where: { key },
            data: {
                draftData: doc.publishedData,
                lastUpdatedBy: req.user?.name || 'Admin',
            },
        });
        res.json({
            success: true,
            message: 'Draft reverted to current live published state',
            data: JSON.parse(updated.draftData),
        });
    }
    catch (error) {
        console.error(`[CMS] Error reverting draft for '${key}':`, error);
        res.status(500).json({ success: false, message: error.message || 'Error reverting draft' });
    }
};
exports.revertAdminDraft = revertAdminDraft;
const restoreAdminRevision = async (req, res) => {
    const key = getParam(req.params.key);
    try {
        const { revisionId } = req.body;
        if (!revisionId || typeof revisionId !== 'string') {
            res.status(400).json({ success: false, message: 'Revision ID is required' });
            return;
        }
        const revision = await prisma_js_1.prisma.cmsRevision.findUnique({
            where: { id: revisionId },
        });
        if (!revision) {
            res.status(404).json({ success: false, message: 'Revision not found' });
            return;
        }
        const updated = await prisma_js_1.prisma.cmsDocument.update({
            where: { key },
            data: {
                draftData: revision.data,
                lastUpdatedBy: req.user?.name || 'Admin',
            },
        });
        res.json({
            success: true,
            message: `Draft restored from revision v${revision.version}. Review and click Publish to make live.`,
            data: JSON.parse(updated.draftData),
        });
    }
    catch (error) {
        console.error(`[CMS] Error restoring revision for '${key}':`, error);
        res.status(500).json({ success: false, message: error.message || 'Error restoring revision' });
    }
};
exports.restoreAdminRevision = restoreAdminRevision;
const resetAdminToDefaults = async (req, res) => {
    const key = getParam(req.params.key);
    try {
        const defaultData = exports.DEFAULT_CMS_DATA[key];
        if (!defaultData) {
            res.status(400).json({ success: false, message: 'No default template defined for this key' });
            return;
        }
        const updated = await prisma_js_1.prisma.cmsDocument.upsert({
            where: { key },
            update: {
                draftData: JSON.stringify(defaultData),
                lastUpdatedBy: req.user?.name || 'Admin',
            },
            create: {
                key,
                draftData: JSON.stringify(defaultData),
                publishedData: JSON.stringify(defaultData),
                isPublished: false,
                lastUpdatedBy: req.user?.name || 'Admin',
            },
        });
        res.json({
            success: true,
            message: 'Draft reset to default high-impact template',
            data: JSON.parse(updated.draftData),
        });
    }
    catch (error) {
        console.error(`[CMS] Error resetting defaults for '${key}':`, error);
        res.status(500).json({ success: false, message: error.message || 'Error resetting defaults' });
    }
};
exports.resetAdminToDefaults = resetAdminToDefaults;
// ============================================================================
// GLOBAL MEDIA LIBRARY (CENTRALIZED ASSETS & STORAGE READY)
// ============================================================================
const getMediaLibrary = async (req, res) => {
    try {
        const { folder, search, type } = req.query;
        const where = {
            deletedAt: null,
        };
        if (folder && folder !== 'all') {
            where.folder = String(folder);
        }
        if (type && type !== 'ALL') {
            where.fileType = String(type);
        }
        if (search && typeof search === 'string' && search.trim()) {
            where.OR = [
                { name: { contains: search.trim(), mode: 'insensitive' } },
                { fileName: { contains: search.trim(), mode: 'insensitive' } },
                { altText: { contains: search.trim(), mode: 'insensitive' } },
            ];
        }
        const mediaList = await prisma_js_1.prisma.cmsMedia.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        res.json({
            success: true,
            media: mediaList,
        });
    }
    catch (error) {
        console.error('[CMS] Error listing media library:', error);
        res.status(500).json({ success: false, message: error.message || 'Error fetching media files' });
    }
};
exports.getMediaLibrary = getMediaLibrary;
const uploadMedia = async (req, res) => {
    try {
        const { fileBase64, fileName, folder, altText } = req.body;
        if (!fileBase64 || typeof fileBase64 !== 'string') {
            res.status(400).json({ success: false, message: 'No file data provided' });
            return;
        }
        const base64Content = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
        const sizeInBytes = Math.round((base64Content.length * 3) / 4);
        const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
        if (sizeInBytes > MAX_SIZE) {
            res.status(400).json({
                success: false,
                message: 'File exceeds the 25 MB maximum upload limit.',
            });
            return;
        }
        // Determine MIME and file extension
        let ext = 'jpg';
        let mimeType = 'image/jpeg';
        let fileType = 'IMAGE';
        const mimeMatch = fileBase64.match(/^data:([A-Za-z-+\/0-9.]+);base64,/);
        if (mimeMatch && mimeMatch[1]) {
            mimeType = mimeMatch[1].toLowerCase();
            if (mimeType.includes('svg')) {
                ext = 'svg';
                fileType = 'SVG';
            }
            else if (mimeType.includes('png')) {
                ext = 'png';
                fileType = 'IMAGE';
            }
            else if (mimeType.includes('webp')) {
                ext = 'webp';
                fileType = 'IMAGE';
            }
            else if (mimeType.includes('gif')) {
                ext = 'gif';
                fileType = 'IMAGE';
            }
            else if (mimeType.includes('pdf')) {
                ext = 'pdf';
                fileType = 'PDF';
            }
            else if (mimeType.includes('mp4') || mimeType.includes('webm') || mimeType.includes('video')) {
                ext = mimeType.includes('webm') ? 'webm' : 'mp4';
                fileType = 'VIDEO';
            }
            else {
                ext = 'jpg';
                fileType = 'IMAGE';
            }
        }
        else if (fileName && typeof fileName === 'string') {
            const parsedExt = fileName.split('.').pop()?.toLowerCase();
            if (parsedExt) {
                ext = parsedExt;
                if (['svg'].includes(parsedExt))
                    fileType = 'SVG';
                else if (['pdf'].includes(parsedExt))
                    fileType = 'PDF';
                else if (['mp4', 'webm', 'mov'].includes(parsedExt))
                    fileType = 'VIDEO';
            }
        }
        const buffer = Buffer.from(base64Content, 'base64');
        const targetFolder = (folder && typeof folder === 'string' ? folder.toLowerCase().replace(/[^a-z0-9_-]/g, '') : 'general') || 'general';
        // Create uploads directory
        const uploadsDir = path_1.default.join(process.cwd(), 'uploads', 'cms', targetFolder);
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        const safeFileName = `cms_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const filePath = path_1.default.join(uploadsDir, safeFileName);
        fs_1.default.writeFileSync(filePath, buffer);
        const publicUrl = `/uploads/cms/${targetFolder}/${safeFileName}`;
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.get('host') || 'localhost:5000';
        const absoluteUrl = `${protocol}://${host}${publicUrl}`;
        // Format human readable size
        const sizeFormatted = sizeInBytes > 1024 * 1024
            ? `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
            : `${Math.round(sizeInBytes / 1024)} KB`;
        // Save record to DB
        const media = await prisma_js_1.prisma.cmsMedia.create({
            data: {
                name: (fileName || safeFileName).replace(/\.[^/.]+$/, ''),
                fileName: safeFileName,
                fileUrl: absoluteUrl,
                fileType,
                mimeType,
                fileSize: sizeFormatted,
                folder: targetFolder,
                altText: altText || '',
                uploadedBy: req.user?.name || 'Admin',
            },
        });
        res.json({
            success: true,
            message: 'File uploaded successfully to media library',
            media,
            url: absoluteUrl,
        });
    }
    catch (error) {
        console.error('[CMS] Error uploading media file:', error);
        res.status(500).json({ success: false, message: error.message || 'Error processing uploaded file' });
    }
};
exports.uploadMedia = uploadMedia;
const updateMedia = async (req, res) => {
    const id = getParam(req.params.id);
    try {
        const { name, altText, folder } = req.body;
        const media = await prisma_js_1.prisma.cmsMedia.update({
            where: { id },
            data: {
                name: name !== undefined ? name : undefined,
                altText: altText !== undefined ? altText : undefined,
                folder: folder !== undefined ? folder : undefined,
            },
        });
        res.json({
            success: true,
            message: 'Media details updated',
            media,
        });
    }
    catch (error) {
        console.error(`[CMS] Error updating media '${id}':`, error);
        res.status(500).json({ success: false, message: error.message || 'Error updating media' });
    }
};
exports.updateMedia = updateMedia;
const deleteMedia = async (req, res) => {
    const id = getParam(req.params.id);
    try {
        await prisma_js_1.prisma.cmsMedia.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
        res.json({
            success: true,
            message: 'Media file removed from library',
        });
    }
    catch (error) {
        console.error(`[CMS] Error deleting media '${id}':`, error);
        res.status(500).json({ success: false, message: error.message || 'Error deleting media' });
    }
};
exports.deleteMedia = deleteMedia;
