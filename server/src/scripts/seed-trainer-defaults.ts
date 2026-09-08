import { prisma } from '../lib/prisma.js';

export const INITIAL_TRACKS = [
  { name: 'Business', slug: 'business', description: 'Business strategy, scaling, corporate development, and commerce.', icon: 'Briefcase', order: 1 },
  { name: 'Operations', slug: 'operations', description: 'Process optimization, supply chain, systems, and operational excellence.', icon: 'Settings', order: 2 },
  { name: 'Management', slug: 'management', description: 'Executive leadership, team administration, and organizational culture.', icon: 'Users', order: 3 },
  { name: 'Sales', slug: 'sales', description: 'B2B/B2C sales methodologies, closing strategies, and revenue growth.', icon: 'TrendingUp', order: 4 },
  { name: 'Marketing', slug: 'marketing', description: 'Digital marketing, brand storytelling, performance ads, and acquisition.', icon: 'Target', order: 5 },
  { name: 'HR', slug: 'hr', description: 'Talent recruitment, employee engagement, HR operations, and culture building.', icon: 'UserCheck', order: 6 },
  { name: 'Finance', slug: 'finance', description: 'Financial modeling, investment analysis, accounting, and budgeting.', icon: 'DollarSign', order: 7 },
  { name: 'Entrepreneurship', slug: 'entrepreneurship', description: 'Startup creation, venture fundraising, MVP building, and product-market fit.', icon: 'Rocket', order: 8 },
  { name: 'Automation', slug: 'automation', description: 'No-code workflows, Zapier, Make, robotic process automation, and integration.', icon: 'Zap', order: 9 },
  { name: 'AI', slug: 'ai', description: 'Generative AI, prompt engineering, LLM implementation, and applied machine learning.', icon: 'Cpu', order: 10 },
  { name: 'Technology', slug: 'technology', description: 'Software engineering, cloud architecture, system design, and IT infrastructure.', icon: 'Code', order: 11 },
  { name: 'Data Analysis', slug: 'data-analysis', description: 'Data science, SQL, Power BI, business intelligence, and predictive analytics.', icon: 'BarChart3', order: 12 },
];

export const DEFAULT_TRAINER_POLICY = `# Scalora Trainer & Academic Standards Policy

Welcome to the Scalora Teaching Community. As a Scalora Instructor, you represent our standard of high-impact, zero-fluff, production-grade education.

---

### 1. Academic & Content Quality
- **Practical & Actionable:** Every course must focus on real-world practical outcomes rather than purely abstract theory.
- **Original Content:** All submitted materials, slide decks, code repositories, and recorded media must be your original intellectual work or properly licensed.
- **Production Audio/Video Standards:** Video recordings must have clear 1080p+ visual fidelity and crisp, noise-free audio.

---

### 2. Course Structure & Delivery
- **Session Hierarchy:** Courses must be divided into well-structured, logical sessions.
- **Supporting Resources:** Whenever applicable, include actionable blueprints, project templates, or code repositories.
- **Commitment to Updates:** Instructors agree to review and keep course materials updated as industry tools evolve.

---

### 3. Professional Conduct & Community Standards
- **Integrity & Respect:** Trainers must maintain the highest standards of professional conduct in all community channels and direct student interactions.
- **Non-Solicitation:** Instructors may not solicit Scalora students for private off-platform transactions or unauthorized external services.
- **Platform Confidentiality:** Proprietary LMS tools, student contact lists, and internal Scalora operational data remain strictly confidential.

---

### 4. Review & Approval SLA
- Scalora's Academic Review Board reviews all submitted courses within **48 hours**.
- If revisions are requested, the instructor will receive detailed, actionable feedback to bring the course to production standards.
- Once approved, the course is automatically published to the Scalora catalog and the trainer is credited as official course faculty.

---

*By submitting your course, you confirm that you have read, understood, and agreed to uphold all principles outlined in this Trainer Agreement.*`;

export async function seedTrainerDefaults() {
  console.log('🌱 Checking and seeding default Teaching Tracks...');
  for (const track of INITIAL_TRACKS) {
    const existing = await prisma.teachingTrack.findUnique({
      where: { slug: track.slug },
    });
    if (!existing) {
      await prisma.teachingTrack.create({
        data: track,
      });
      console.log(`  + Created track: ${track.name}`);
    }
  }

  console.log('📜 Checking and seeding default Trainer Policy...');
  const existingPolicy = await prisma.trainerPolicy.findFirst({
    where: { isActive: true },
  });

  if (!existingPolicy) {
    const policy = await prisma.trainerPolicy.create({
      data: {
        title: 'Scalora Trainer & Academic Standards Policy',
        content: DEFAULT_TRAINER_POLICY,
        version: 1,
        isActive: true,
        publishedAt: new Date(),
        lastUpdatedBy: 'System',
      },
    });

    await prisma.trainerPolicyRevision.create({
      data: {
        policyId: policy.id,
        version: 1,
        title: policy.title,
        content: policy.content,
        note: 'Initial standard trainer policy',
        author: 'System',
      },
    });
    console.log('  + Created default Trainer Policy v1');
  } else {
    console.log(`  ✓ Trainer policy already exists (v${existingPolicy.version})`);
  }

  console.log('✅ Trainer defaults verified!');
}

if (process.argv[1]?.includes('seed-trainer-defaults')) {
  seedTrainerDefaults()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
