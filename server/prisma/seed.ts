import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Scalora LMS PostgreSQL database seeding...');

  // 1. Clean existing records in correct foreign-key dependency order
  await prisma.certificate.deleteMany({});
  await prisma.lessonProgress.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.quizResult.deleteMany({});
  await prisma.quizQuestion.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Users
  const adminPassword = await bcrypt.hash('ScaloraAdmin123!', 10);
  const studentPassword = await bcrypt.hash('Student123!', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Eslam Salah (Admin)',
      email: 'admin@scalora.com',
      password: adminPassword,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: 'Principal Lead Administrator & LMS Architect at Scalora Academy.',
    },
  });

  const student = await prisma.user.create({
    data: {
      name: 'Eslam Salah',
      email: 'student@scalora.com',
      password: studentPassword,
      role: 'STUDENT',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      bio: 'Software Engineer specializing in Cloud Native and Full-Stack Systems.',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Sarah Mitchell',
      email: 'sarah.m@example.com',
      password: studentPassword,
      role: 'STUDENT',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      bio: 'Data Scientist exploring modern Generative AI & Large Language Models.',
    },
  });

  console.log('✅ Created Demo Users (Admin & Students)');

  // 3. Create Course 1: Cloud-Native Microservices
  const course1 = await prisma.course.create({
    data: {
      title: 'Cloud-Native Microservices Architecture with Node.js & Kubernetes',
      slug: 'cloud-native-microservices-nodejs-kubernetes',
      description:
        'Master the design, development, and deployment of scalable, resilient cloud-native microservices using TypeScript, Docker, Kubernetes, and gRPC with enterprise observability.',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      price: 89.99,
      instructor: 'Dr. Tariq Al-Mansoor',
      category: 'Cloud Architecture',
      level: 'Advanced',
      isPublished: true,
      modules: {
        create: [
          {
            title: 'Module 1: Foundations of Distributed Microservices',
            order: 1,
            lessons: {
              create: [
                {
                  title: '1.1 Welcome to Scalora Cloud-Native Track',
                  type: 'YOUTUBE',
                  videoUrl: 'https://www.youtube.com/watch?v=17Xm2k3tQsw',
                  duration: '14 min',
                  order: 1,
                  content:
                    '### Welcome to Cloud-Native Mastery\nIn this foundational session, we break down why modern monolithic applications transition to microservices and how domain-driven design shapes autonomous services.',
                },
                {
                  title: '1.2 Microservices Design Patterns & Anti-Patterns',
                  type: 'TEXT',
                  duration: '20 min',
                  order: 2,
                  content:
                    '# Microservices Design Patterns\n\nWhen architecting microservices for enterprise workloads, understanding core communication and data patterns is paramount:\n\n### 1. API Gateway Pattern\nActs as a single entry point for all clients, handling SSL termination, rate limiting, and request routing.\n\n### 2. Saga Pattern (Distributed Transactions)\nManages transactions across multiple services without two-phase locking:\n- **Choreography**: Event-driven coordination.\n- **Orchestration**: Central orchestrator commands participants.\n\n```typescript\ninterface SagaCoordinator {\n  executeTransaction(orderId: string): Promise<SagaResult>;\n  rollback(stepId: string): Promise<void>;\n}\n```\n\n### Key Takeaway\nAlways favor eventual consistency where real-time ACID locks degrade throughput.',
                },
                {
                  title: '1.3 Microservices Architecture Blueprint (PDF Reference)',
                  type: 'PDF',
                  fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                  fileName: 'Scalora-Microservices-Blueprint-v2.pdf',
                  fileSize: '3.4 MB',
                  duration: '15 min',
                  order: 3,
                  content: 'Download and review the high-level architecture diagram and API gateway topology document.',
                },
              ],
            },
          },
          {
            title: 'Module 2: Containerization, gRPC & Kubernetes Orchestration',
            order: 2,
            lessons: {
              create: [
                {
                  title: '2.1 High-Performance Inter-Service RPC with gRPC & Protobuf',
                  type: 'YOUTUBE',
                  videoUrl: 'https://www.youtube.com/watch?v=gnchfOojMk4',
                  duration: '22 min',
                  order: 1,
                  content: 'Learn how to generate typed stubs, multiplex HTTP/2 streams, and achieve sub-millisecond serialization speeds with Protocol Buffers.',
                },
                {
                  title: '2.2 Kubernetes Deployment Manifests & Helm Charts Starter',
                  type: 'DOWNLOAD',
                  fileUrl: 'https://github.com/scalora/k8s-microservices-starter/archive/refs/heads/main.zip',
                  fileName: 'scalora-k8s-starter-kit.zip',
                  fileSize: '8.1 MB',
                  duration: '25 min',
                  order: 2,
                  content: 'Download the production-grade Helm chart repository and docker-compose orchestration files.',
                },
              ],
            },
          },
        ],
      },
      quizzes: {
        create: [
          {
            title: 'Cloud-Native Architecture & Microservices Certification Quiz',
            description: 'Test your understanding of distributed transactions, Kubernetes networking, and gRPC RPC patterns.',
            passingScore: 75,
            questions: {
              create: [
                {
                  question: 'Which pattern is recommended to manage distributed transactions across autonomous microservices?',
                  options: JSON.stringify([
                    'Two-Phase Commit (2PC) with distributed locks',
                    'Saga Pattern with compensating transactions',
                    'Single shared relational database table',
                    'Direct synchronous circular REST calls',
                  ]),
                  correctAnswer: 1,
                  explanation: 'The Saga pattern coordinates distributed transactions across services through orchestrator commands or event-driven choreography without distributed database locking.',
                  order: 1,
                },
                {
                  question: 'Why is gRPC significantly faster than standard JSON over HTTP/1.1 for inter-service communication?',
                  options: JSON.stringify([
                    'It uses XML instead of JSON',
                    'It uses Binary Protocol Buffers over multiplexed HTTP/2 streams',
                    'It bypasses TCP and runs on raw UDP',
                    'It disables transport encryption',
                  ]),
                  correctAnswer: 1,
                  explanation: 'gRPC utilizes compact binary Protocol Buffer serialization and multiplexed streams on HTTP/2, dramatically reducing CPU overhead and latency.',
                  order: 2,
                },
                {
                  question: 'What is the primary role of an Ingress Controller in Kubernetes?',
                  options: JSON.stringify([
                    'To allocate hard disk storage volumes to Pods',
                    'To route external HTTP/HTTPS traffic to internal Kubernetes Services with routing rules and TLS termination',
                    'To compile container source code inside nodes',
                    'To monitor CPU temperature of physical servers',
                  ]),
                  correctAnswer: 1,
                  explanation: 'An Ingress controller manages external access to the services in a cluster, typically HTTP, providing load balancing, SSL termination, and name-based virtual hosting.',
                  order: 3,
                },
                {
                  question: 'Which Kubernetes resource guarantees that exactly one copy of a Pod runs on every eligible cluster Node?',
                  options: JSON.stringify(['Deployment', 'StatefulSet', 'DaemonSet', 'ReplicaSet']),
                  correctAnswer: 2,
                  explanation: 'DaemonSets ensure that all (or some) Nodes run a copy of a Pod, commonly used for log collection and node monitoring agents.',
                  order: 4,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 4. Create Course 2: Generative AI & LLM Applications
  const course2 = await prisma.course.create({
    data: {
      title: 'Generative AI & LLM Application Engineering in Production',
      slug: 'generative-ai-llm-application-engineering',
      description:
        'Build cutting-edge AI systems with Retrieval-Augmented Generation (RAG), Vector Databases, LangChain, semantic search, and autonomous multi-agent workflows.',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      price: 129.99,
      instructor: 'Elena Rostova',
      category: 'AI & Data Science',
      level: 'Intermediate',
      isPublished: true,
      modules: {
        create: [
          {
            title: 'Module 1: Vector Embeddings & Semantic Search Pipelines',
            order: 1,
            lessons: {
              create: [
                {
                  title: '1.1 Deep Dive into High-Dimensional Vector Embeddings',
                  type: 'YOUTUBE',
                  videoUrl: 'https://www.youtube.com/watch?v=QdDoFfkVkcw',
                  duration: '18 min',
                  order: 1,
                  content: 'Learn how text is mapped into dense 1536-dimensional semantic spaces and how Cosine Similarity works.',
                },
                {
                  title: '1.2 Building a Production RAG Pipeline: Chunking & Hybrid Search',
                  type: 'TEXT',
                  duration: '25 min',
                  order: 2,
                  content:
                    '# Enterprise RAG Architecture\n\nRetrieval-Augmented Generation bridges the context gap for LLMs by augmenting prompts with verified private context:\n\n```python\ndef query_rag(prompt: str, vector_store: VectorDB):\n    relevant_chunks = vector_store.similarity_search(prompt, k=5)\n    augmented_prompt = f"Context: {relevant_chunks}\\n\\nQuestion: {prompt}"\n    return llm.generate(augmented_prompt)\n```\n\n### Optimization Tips\n- Use recursive character chunking with 15% overlap.\n- Implement re-ranking (Cross-Encoders) on top-k retrievals.',
                },
              ],
            },
          },
          {
            title: 'Module 2: Autonomous Agentic Frameworks & Function Calling',
            order: 2,
            lessons: {
              create: [
                {
                  title: '2.1 Multi-Agent Workflows with Tool Calling & Structured Outputs',
                  type: 'YOUTUBE',
                  videoUrl: 'https://www.youtube.com/watch?v=sal78ACtGTc',
                  duration: '30 min',
                  order: 1,
                  content: 'Construct self-correcting agents with feedback loops and programmatic tool execution.',
                },
                {
                  title: '2.2 LangChain & LlamaIndex Full Architecture Guide',
                  type: 'PDF',
                  fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                  fileName: 'Scalora-LLM-Architecture-Manual.pdf',
                  fileSize: '5.2 MB',
                  duration: '20 min',
                  order: 2,
                  content: 'Complete architectural handbook for building production AI applications.',
                },
              ],
            },
          },
        ],
      },
      quizzes: {
        create: [
          {
            title: 'Generative AI & RAG Engineering Mastery Quiz',
            description: 'Evaluate your grasp of semantic search, chunking strategies, embeddings, and agent orchestration.',
            passingScore: 70,
            questions: {
              create: [
                {
                  question: 'What is the primary function of chunk overlap in text splitters during RAG indexing?',
                  options: JSON.stringify([
                    'To reduce database storage usage',
                    'To preserve semantic context across chunk boundaries so sentences are not sliced abruptly',
                    'To speed up embedding model execution',
                    'To encrypt sensitive user tokens',
                  ]),
                  correctAnswer: 1,
                  explanation: 'Chunk overlap ensures that contextual information near the splitting boundary is preserved in consecutive chunks.',
                  order: 1,
                },
                {
                  question: 'Which similarity metric measures the angle between two embedding vectors regardless of their magnitude?',
                  options: JSON.stringify(['Euclidean Distance (L2)', 'Cosine Similarity', 'Manhattan Distance (L1)', 'Hamming Distance']),
                  correctAnswer: 1,
                  explanation: 'Cosine similarity computes the cosine of the angle between two non-zero vectors in an inner product space.',
                  order: 2,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 5. Create Course 3: Enterprise Full-Stack Mastery
  const course3 = await prisma.course.create({
    data: {
      title: 'Modern Enterprise Full-Stack Mastery (React 19 & TypeScript)',
      slug: 'modern-enterprise-fullstack-react-typescript',
      description:
        'Develop enterprise-scale web applications with clean architecture, atomic design system, strict TypeScript, server components, and bulletproof security.',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      price: 69.99,
      instructor: 'Marcus Vance',
      category: 'Software Engineering',
      level: 'All Levels',
      isPublished: true,
      modules: {
        create: [
          {
            title: 'Module 1: Scalable Frontend Architecture',
            order: 1,
            lessons: {
              create: [
                {
                  title: '1.1 Design Systems & Tailwind CSS v4 in Production',
                  type: 'YOUTUBE',
                  videoUrl: 'https://www.youtube.com/watch?v=mr15Xzb1Ook',
                  duration: '16 min',
                  order: 1,
                  content: 'Setting up clean reusable UI component systems with accessibility and dark mode support.',
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 6. Create Course 4: DevOps Automation
  const course4 = await prisma.course.create({
    data: {
      title: 'DevOps, CI/CD & Production Infrastructure Automation',
      slug: 'devops-cicd-production-infrastructure-automation',
      description:
        'Automate testing, container builds, zero-downtime blue-green deployments, and Terraform infrastructure as code for high-availability production clusters.',
      thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80',
      price: 79.99,
      instructor: 'David K. O’Connor',
      category: 'DevOps & Cloud',
      level: 'Intermediate',
      isPublished: true,
      modules: {
        create: [
          {
            title: 'Module 1: Automated Pipeline Engineering',
            order: 1,
            lessons: {
              create: [
                {
                  title: '1.1 Multi-Stage Docker Builds & Image Optimization',
                  type: 'YOUTUBE',
                  videoUrl: 'https://www.youtube.com/watch?v=wGZ_c9A1c4U',
                  duration: '15 min',
                  order: 1,
                  content: 'Reduce container sizes from 1.2GB to 45MB with alpine and scratch multi-stage pipelines.',
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Created 4 Enterprise Courses with Modules, Lessons and Quizzes');

  // 7. Create Dedicated Payments in PostgreSQL Payment table
  const pay1 = await prisma.payment.create({
    data: {
      userId: student.id,
      courseId: course1.id,
      amount: course1.price,
      currency: 'USD',
      status: 'COMPLETED',
      provider: 'STRIPE',
      transactionId: `pi_stripe_seed_${Date.now()}_01`,
      metadata: JSON.stringify({ gateway: 'stripe', cardLast4: '4242' }),
    },
  });

  const pay2 = await prisma.payment.create({
    data: {
      userId: student.id,
      courseId: course2.id,
      amount: course2.price,
      currency: 'USD',
      status: 'COMPLETED',
      provider: 'MOCK',
      transactionId: `txn_mock_seed_${Date.now()}_02`,
      metadata: JSON.stringify({ gateway: 'mock_sandbox' }),
    },
  });

  const pay3 = await prisma.payment.create({
    data: {
      userId: student2.id,
      courseId: course2.id,
      amount: course2.price,
      currency: 'EGP',
      status: 'COMPLETED',
      provider: 'PAYMOB',
      transactionId: `paymob_seed_${Date.now()}_03`,
      metadata: JSON.stringify({ gateway: 'paymob', wallet: 'vodafone_cash' }),
    },
  });

  console.log('✅ Created Transactions in PostgreSQL Payment Table');

  // 8. Create Enrollments linked to Payments
  await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course1.id,
      status: 'ACTIVE',
      amount: course1.price,
      paymentId: pay1.id,
    },
  });

  await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course2.id,
      status: 'ACTIVE',
      amount: course2.price,
      paymentId: pay2.id,
    },
  });

  await prisma.enrollment.create({
    data: {
      userId: student2.id,
      courseId: course2.id,
      status: 'ACTIVE',
      amount: course2.price,
      paymentId: pay3.id,
    },
  });

  // 9. Add Lesson Progress for student Alex
  const course1Lessons = await prisma.lesson.findMany({
    where: { module: { courseId: course1.id } },
  });

  if (course1Lessons.length >= 2) {
    await prisma.lessonProgress.create({
      data: {
        userId: student.id,
        lessonId: course1Lessons[0].id,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    await prisma.lessonProgress.create({
      data: {
        userId: student.id,
        lessonId: course1Lessons[1].id,
        isCompleted: true,
        completedAt: new Date(),
      },
    });
  }

  // 10. Add Quiz Results in PostgreSQL QuizResult Table
  const quiz1 = await prisma.quiz.findFirst({
    where: { courseId: course1.id },
    include: { questions: true },
  });

  if (quiz1) {
    const answers: Record<string, number> = {};
    quiz1.questions.forEach((q) => {
      answers[q.id] = q.correctAnswer;
    });

    await prisma.quizResult.create({
      data: {
        quizId: quiz1.id,
        userId: student.id,
        score: 100,
        passed: true,
        answers: JSON.stringify(answers),
      },
    });
  }

  // 11. Create Pre-issued Certificate in PostgreSQL Certificate Table
  const certNumber = `SCL-K8S-${student.id.slice(-4).toUpperCase()}-2026`;
  await prisma.certificate.create({
    data: {
      certificateNumber: certNumber,
      userId: student.id,
      courseId: course1.id,
      studentName: student.name,
      courseTitle: course1.title,
      instructorName: course1.instructor,
      verificationUrl: `https://scalora.com/verify/${certNumber}`,
    },
  });

  console.log('✅ Created Certificates & Quiz Results in PostgreSQL');
  console.log('🎉 Scalora LMS PostgreSQL Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
