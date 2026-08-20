import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../types';
import { api } from '../lib/api';
import { getPersistentCourses } from '../data/fallbackData';
import { CourseCard } from '../components/CourseCard';
import { CheckoutModal } from '../components/CheckoutModal';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Video,
  FileText,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  Users,
  Code2,
  Cpu,
  Layers,
  Terminal,
  Zap,
  Star,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>(() => getPersistentCourses().slice(0, 3));
  const [loading, setLoading] = useState(false);
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState<Course | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get<{ success: boolean; courses: Course[] }>('/courses');
        if (res.success && res.courses && res.courses.length > 0) {
          setCourses(res.courses.slice(0, 3)); // Featured top 3
        }
      } catch {
        setCourses(getPersistentCourses().slice(0, 3));
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleEnrollClick = (course: Course) => {
    setSelectedCourseForCheckout(course);
  };

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Background Glows & Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-scalora-blue/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-scalora-accent/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            {/* Top Announcement Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-scalora-navy/80 border border-scalora-blue/40 shadow-glow-blue animate-in fade-in slide-in-from-top-4 duration-500">
              <span className="flex h-2 w-2 rounded-full bg-scalora-accent animate-ping" />
              <span className="text-xs font-bold text-slate-200 tracking-wide">
                Next-Generation Enterprise LMS Architecture
              </span>
              <Sparkles className="w-3.5 h-3.5 text-scalora-accent" />
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
              Elevate Engineering Excellence with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-scalora-blue via-cyan-400 to-scalora-accent">
                Scalora
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              The premier learning platform designed for mission-critical engineering tracks. Master Cloud-Native
              Microservices, Generative AI, and Distributed Systems with production-grade curriculum.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/courses"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white font-bold text-base shadow-glow-blue hover:opacity-95 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <span>Explore All Tracks</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              {user ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel hover:bg-scalora-navy/80 text-slate-100 font-bold text-base border border-scalora-blue/30 transition-all flex items-center justify-center gap-2"
                >
                  <Terminal className="w-5 h-5 text-scalora-accent" />
                  <span>Resume Learning</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel hover:bg-scalora-navy/80 text-slate-100 font-bold text-base border border-scalora-blue/30 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5 text-scalora-accent" />
                  <span>Try Demo Login</span>
                </Link>
              )}
            </div>

            {/* Platform Live Metrics */}
            <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-scalora-blue/15">
              <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-white">4,800+</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Engineers Trained</div>
              </div>
              <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-scalora-accent">98.4%</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completion Rate</div>
              </div>
              <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-white">4.9 / 5</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Course Rating</div>
              </div>
              <div className="p-4 rounded-2xl glass-panel text-center space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">100%</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verifiable Certs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED COURSES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-scalora-blue/15">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-accent mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>Curated Tracks</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Featured Enterprise Courses</h2>
            <p className="text-slate-400 text-sm mt-1">
              Hand-crafted, real-world curriculum with interactive quizzes and downloadable materials.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-sm font-bold text-scalora-blue hover:text-scalora-accent transition-colors"
          >
            <span>View all courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl glass-card animate-pulse bg-scalora-navy/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEnrollClick={handleEnrollClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. WHY SCALORA SECTION */}
      <section id="why-scalora" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-blue">
            <ShieldCheck className="w-4 h-4" />
            <span>Built For Modern Engineering</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Why Enterprise Teams Choose Scalora
          </h2>
          <p className="text-sm text-slate-400">
            A comprehensive, high-throughput learning environment tailored for technical mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-scalora-blue/20 text-scalora-blue flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Enterprise Streaming</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seamless YouTube embed streaming combined with PDF guides, downloadable starter repos, and rich Markdown lessons.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Interactive Quizzes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time scoring, automated pass/fail evaluations, and detailed answer explanations for immediate learning feedback.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Dynamic Progress Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pick up right where you left off with instant "Resume Learning" buttons, completed lesson checks, and progress percentages.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Verifiable Certificates</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Earn digitally verifiable Scalora certificates complete with unique credential hashes upon 100% course mastery.
            </p>
          </div>
        </div>
      </section>

      {/* 4. TESTIMONIALS SECTION */}
      <section id="testimonials" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-scalora-accent">
            <Users className="w-4 h-4" />
            <span>Alumni Voices</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Trusted by Top Engineering Talent
          </h2>
          <p className="text-sm text-slate-400">
            Hear from software architects and developers who advanced their careers through Scalora.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "The Cloud-Native Kubernetes course gave our DevOps squad the exact production blueprints we needed to migrate our services without downtime."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-scalora-blue/15">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                alt="Sarah Jenkins"
                className="w-10 h-10 rounded-full object-cover border border-scalora-blue/30"
              />
              <div>
                <div className="text-sm font-bold text-white">Sarah Jenkins</div>
                <div className="text-xs text-scalora-blue">Lead Platform Engineer</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "Scalora’s RAG and Generative AI curriculum is by far the most practical track I have taken. The quizzes and code starter kits are top tier."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-scalora-blue/15">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80"
                alt="Karim Mansour"
                className="w-10 h-10 rounded-full object-cover border border-scalora-blue/30"
              />
              <div>
                <div className="text-sm font-bold text-white">Karim Mansour</div>
                <div className="text-xs text-scalora-blue">Senior AI Researcher</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "The course player is blisteringly fast and distraction-free. The downloadable blueprints and instant certificate verification are brilliant."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-scalora-blue/15">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80"
                alt="David Chen"
                className="w-10 h-10 rounded-full object-cover border border-scalora-blue/30"
              />
              <div>
                <div className="text-sm font-bold text-white">David Chen</div>
                <div className="text-xs text-scalora-blue">Full-Stack Tech Lead</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#082B5B] via-[#0D3E82] to-[#04152D] border border-scalora-blue/40 p-8 sm:p-14 overflow-hidden text-center shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-scalora-accent/20 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Accelerate Your Tech Career?
            </h2>
            <p className="text-sm sm:text-base text-slate-200">
              Join thousands of engineers learning with Scalora today. Get instant access to courses, interactive assessments, and certificates.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-scalora-navy hover:bg-slate-100 font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Create Free Student Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/courses"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-scalora-navy/60 hover:bg-scalora-navy text-white font-bold text-sm border border-white/20 transition-colors"
              >
                Browse Curriculum
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={Boolean(selectedCourseForCheckout)}
        onClose={() => setSelectedCourseForCheckout(null)}
        course={selectedCourseForCheckout}
      />
    </div>
  );
};
