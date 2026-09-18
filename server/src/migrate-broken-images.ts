import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { AssetStorageService } from './services/asset-storage.service.js';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🔄 EXECUTING COMPREHENSIVE IMAGE DATA MIGRATION');
  console.log('====================================================\n');

  // 1. Ingest build-your-business-engine.jpg into persistent database storage
  const localBizImagePath = path.join(
    process.cwd(),
    '..',
    'client',
    'public',
    'courses',
    'build-your-business-engine.jpg'
  );

  let bizEngineUrl = '/courses/build-your-business-engine.jpg';
  if (fs.existsSync(localBizImagePath)) {
    try {
      const buffer = fs.readFileSync(localBizImagePath);
      const saved = await AssetStorageService.saveAsset({
        buffer,
        fileName: 'build_your_business_engine.jpg',
        mimeType: 'image/jpeg',
        folder: 'thumbnails',
        host: 'scalora-lms.onrender.com',
      });
      console.log('✅ Ingested build-your-business-engine.jpg into StoredAsset DB:', saved.relativeUrl);
      // We can use the relative path '/courses/build-your-business-engine.jpg' or saved.relativeUrl
      bizEngineUrl = '/courses/build-your-business-engine.jpg';
    } catch (e: any) {
      console.warn('Could not ingest local image into DB:', e.message);
    }
  }

  // 2. Fix Course Thumbnails
  const courseFixes = [
    {
      slug: 'build-your-business-engine',
      newThumbnail: bizEngineUrl,
    },
    {
      slug: 'communication-skills',
      newThumbnail:
        'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1080&auto=format&fit=crop&q=80',
    },
    {
      slug: 'how-to-build-your-lms-by-ai',
      newThumbnail:
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1080&auto=format&fit=crop&q=80',
    },
    {
      slug: 'clickup-course',
      newThumbnail:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&auto=format&fit=crop&q=80',
    },
  ];

  for (const fix of courseFixes) {
    const updated = await prisma.course.updateMany({
      where: {
        slug: fix.slug,
      },
      data: {
        thumbnail: fix.newThumbnail,
      },
    });
    console.log(`Course [${fix.slug}] thumbnail updated: count = ${updated.count}`);
  }

  // Also clean up any remaining scalora-lms-3.onrender.com occurrences in courses
  const staleCourses = await prisma.course.findMany({
    where: {
      thumbnail: {
        contains: 'scalora-lms-3',
      },
    },
  });

  for (const c of staleCourses) {
    const fixedUrl = (c.thumbnail || '').replace('scalora-lms-3.onrender.com', 'scalora-lms.onrender.com');
    await prisma.course.update({
      where: { id: c.id },
      data: { thumbnail: fixedUrl },
    });
    console.log(`Normalized stale host for course [${c.slug}]: ${fixedUrl}`);
  }

  // 3. Normalize Users
  const staleUsers = await prisma.user.findMany({
    where: {
      avatar: {
        contains: 'scalora-lms-3',
      },
    },
  });

  for (const u of staleUsers) {
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0284C7&color=fff`;
    await prisma.user.update({
      where: { id: u.id },
      data: { avatar: fallbackAvatar },
    });
    console.log(`Normalized avatar for user [${u.name}]: ${fallbackAvatar}`);
  }

  // 4. Normalize Community Posts
  const stalePosts = await prisma.communityPost.findMany({
    where: {
      mediaUrl: {
        contains: 'scalora-lms-3',
      },
    },
  });

  for (const p of stalePosts) {
    const fixedMedia = (p.mediaUrl || '').replace('scalora-lms-3.onrender.com', 'scalora-lms.onrender.com');
    await prisma.communityPost.update({
      where: { id: p.id },
      data: { mediaUrl: fixedMedia },
    });
    console.log(`Normalized mediaUrl for community post [${p.id}]`);
  }

  // 5. Check all courses now
  const allCourses = await prisma.course.findMany({
    select: { id: true, title: true, slug: true, thumbnail: true },
  });

  console.log('\n--- VERIFICATION OF ALL COURSES IN DATABASE ---');
  allCourses.forEach((c) => {
    console.log(`Course [${c.slug}]: thumbnail = "${c.thumbnail}"`);
  });

  console.log('\n✅ Image data migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
