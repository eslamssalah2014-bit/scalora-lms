import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Globe,
  Upload,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileText,
  Video,
  PlaySquare,
  Sparkles,
  ArrowRight,
  BookOpen,
  Lock,
  Layers,
  Settings,
  Users,
  TrendingUp,
  Target,
  UserCheck,
  DollarSign,
  Rocket,
  Zap,
  Cpu,
  Code,
  BarChart3,
  HelpCircle,
} from 'lucide-react';

interface TeachingTrack {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
}

interface TrainerPolicy {
  id: string;
  title: string;
  content: string;
  version: number;
}

interface SessionData {
  id?: string;
  title: string;
  description: string;
  sessionNumber: number;
  durationMinutes: number;
  videoProvider: 'bunny' | 'url' | 'upload';
  videoId: string;
  videoUrl: string;
  fileUrl: string;
  fileName: string;
  uploadProgress?: number;
}

const TRACK_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Briefcase,
  Settings,
  Users,
  TrendingUp,
  Target,
  UserCheck,
  DollarSign,
  Rocket,
  Zap,
  Cpu,
  Code,
  BarChart3,
};

// Helper to detect Arabic text
function isArabicText(text: string): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF]/.test(text);
}

export const BecomeTrainerPage: React.FC = () => {
  const { user, setAuthSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editSubmissionId = searchParams.get('edit');

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  // Step 1: Profile State
  const [fullName, setFullName] = useState<string>(user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [mobile, setMobile] = useState<string>('');
  const [country, setCountry] = useState<string>('Egypt');
  const [linkedin, setLinkedin] = useState<string>('');
  const [yearsExperience, setYearsExperience] = useState<number>(3);
  const [professionalTitle, setProfessionalTitle] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Step 2: Track Selection State
  const [tracks, setTracks] = useState<TeachingTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [selectedTrackName, setSelectedTrackName] = useState<string>('');

  // Step 3: Policy Acceptance State
  const [policy, setPolicy] = useState<TrainerPolicy | null>(null);
  const [policyAccepted, setPolicyAccepted] = useState<boolean>(false);
  const [acceptCheckbox, setAcceptCheckbox] = useState<boolean>(false);

  // Step 4: Course Submission State (Price & Thumbnail removed as requested)
  const [submissionId, setSubmissionId] = useState<string | null>(editSubmissionId || null);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [shortDescription, setShortDescription] = useState<string>('');
  const [fullDescription, setFullDescription] = useState<string>('');
  const [level, setLevel] = useState<string>('All Levels');
  const [numberOfSessions, setNumberOfSessions] = useState<number>(3);
  const [submissionNotes, setSubmissionNotes] = useState<string>('');
  const [sessions, setSessions] = useState<SessionData[]>([
    {
      title: 'Session 1: Introduction & Core Frameworks',
      description: 'Overview of key objectives and practical foundational setups.',
      sessionNumber: 1,
      durationMinutes: 45,
      videoProvider: 'bunny',
      videoId: '',
      videoUrl: '',
      fileUrl: '',
      fileName: '',
    },
    {
      title: 'Session 2: Deep Dive & Production Implementation',
      description: 'Hands-on practical walkthrough and core blueprints.',
      sessionNumber: 2,
      durationMinutes: 45,
      videoProvider: 'bunny',
      videoId: '',
      videoUrl: '',
      fileUrl: '',
      fileName: '',
    },
    {
      title: 'Session 3: Optimization & Case Studies',
      description: 'Advanced real-world workflows, troubleshooting, and summary.',
      sessionNumber: 3,
      durationMinutes: 45,
      videoProvider: 'bunny',
      videoId: '',
      videoUrl: '',
      fileUrl: '',
      fileName: '',
    },
  ]);

  // Load initial data (Tracks, Policy, Profile, Draft)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // 1. Fetch Tracks
        const trackRes = await api.get<{ success: boolean; data: TeachingTrack[] }>('/trainer-submissions/tracks');
        if (trackRes.success && trackRes.data) {
          setTracks(trackRes.data);
          if (trackRes.data.length > 0 && !selectedTrackId) {
            setSelectedTrackId(trackRes.data[0].id);
            setSelectedTrackName(trackRes.data[0].name);
          }
        }

        // 2. Fetch Policy
        const policyRes = await api.get<{
          success: boolean;
          data: { policy: TrainerPolicy; hasAccepted: boolean };
        }>('/trainer-submissions/policy');
        if (policyRes.success && policyRes.data) {
          setPolicy(policyRes.data.policy);
          setPolicyAccepted(policyRes.data.hasAccepted);
          if (policyRes.data.hasAccepted) {
            setAcceptCheckbox(true);
          }
        }

        // 3. Fetch Profile if logged in
        if (user) {
          try {
            const profRes = await api.get<{
              success: boolean;
              data: { profile: any; policyAccepted: boolean };
            }>('/trainer-submissions/profile');
            if (profRes.success && profRes.data?.profile) {
              const p = profRes.data.profile;
              setFullName(p.fullName || user.name || '');
              setEmail(p.email || user.email || '');
              setMobile(p.mobile || '');
              setCountry(p.country || 'Egypt');
              setLinkedin(p.linkedin || '');
              setYearsExperience(p.yearsExperience || 3);
              setProfessionalTitle(p.professionalTitle || '');
              setBio(p.bio || '');
              if (p.preferredTrackId) {
                setSelectedTrackId(p.preferredTrackId);
              }
              if (profRes.data.policyAccepted) {
                setPolicyAccepted(true);
                setAcceptCheckbox(true);
              }
            }
          } catch {
            // New user without profile
          }
        }

        // 4. If editing an existing submission
        if (editSubmissionId) {
          const subRes = await api.get<{ success: boolean; data: any }>(
            `/trainer-submissions/${editSubmissionId}`
          );
          if (subRes.success && subRes.data) {
            const s = subRes.data;
            setCourseTitle(s.title || '');
            setShortDescription(s.shortDescription || '');
            setFullDescription(s.fullDescription || '');
            setLevel(s.level || 'All Levels');
            setNumberOfSessions(s.numberOfSessions || s.sessions?.length || 1);
            setSubmissionNotes(s.submissionNotes || '');
            if (s.trackId) {
              setSelectedTrackId(s.trackId);
              setSelectedTrackName(s.trackName || '');
            }
            if (s.sessions && s.sessions.length > 0) {
              setSessions(
                s.sessions.map((sess: any, idx: number) => ({
                  id: sess.id,
                  title: sess.title,
                  description: sess.description || '',
                  sessionNumber: sess.sessionNumber || idx + 1,
                  durationMinutes: sess.durationMinutes || 30,
                  videoProvider: sess.videoProvider || 'bunny',
                  videoId: sess.videoId || '',
                  videoUrl: sess.videoUrl || '',
                  fileUrl: sess.fileUrl || '',
                  fileName: sess.fileName || '',
                }))
              );
            }
            // Jump directly to Step 4 if editing existing draft
            setCurrentStep(4);
          }
        }
      } catch (err: any) {
        console.error('Error loading onboarding data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, editSubmissionId]);

  // Adjust sessions array when numberOfSessions changes
  const handleNumberOfSessionsChange = (num: number) => {
    const validNum = Math.max(1, Math.min(50, num));
    setNumberOfSessions(validNum);
    setSessions((prev) => {
      const updated = [...prev];
      if (validNum > updated.length) {
        for (let i = updated.length; i < validNum; i++) {
          updated.push({
            title: `Session ${i + 1}`,
            description: '',
            sessionNumber: i + 1,
            durationMinutes: 45,
            videoProvider: 'bunny',
            videoId: '',
            videoUrl: '',
            fileUrl: '',
            fileName: '',
          });
        }
      } else if (validNum < updated.length) {
        return updated.slice(0, validNum);
      }
      return updated;
    });
  };

  const updateSession = (index: number, field: keyof SessionData, value: any) => {
    setSessions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSession = () => {
    setSessions((prev) => {
      const nextNum = prev.length + 1;
      const updated = [
        ...prev,
        {
          title: `Session ${nextNum}`,
          description: '',
          sessionNumber: nextNum,
          durationMinutes: 45,
          videoProvider: 'bunny' as const,
          videoId: '',
          videoUrl: '',
          fileUrl: '',
          fileName: '',
        },
      ];
      setNumberOfSessions(updated.length);
      return updated;
    });
  };

  const removeSession = (index: number) => {
    if (sessions.length <= 1) {
      alert('You must have at least 1 session in your course.');
      return;
    }
    setSessions((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      const renumbered = filtered.map((s, idx) => ({ ...s, sessionNumber: idx + 1 }));
      setNumberOfSessions(renumbered.length);
      return renumbered;
    });
  };

  // ---------------------------------------------------------------------------
  // STEP 1: SAVE TRAINER PROFILE
  // ---------------------------------------------------------------------------
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('A valid email address is required.');
      return;
    }
    if (!mobile.trim()) {
      setErrorMessage('Mobile phone number is mandatory.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.post<{
        success: boolean;
        message: string;
        data: { profile: any; user: any; token?: string };
      }>('/trainer-submissions/register', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        country,
        linkedin: linkedin.trim(),
        yearsExperience,
        professionalTitle: professionalTitle.trim(),
        bio: bio.trim(),
        preferredTrackId: selectedTrackId,
        password: password ? password : undefined,
      });

      if (res.success) {
        if (res.data.token && res.data.user) {
          // Immediately set token in localStorage and AuthContext
          localStorage.setItem('scalora_token', res.data.token);
          localStorage.setItem('scalora_user', JSON.stringify(res.data.user));
          setAuthSession(res.data.token, res.data.user);
        }
        setSuccessMessage('Profile registered successfully!');
        setTimeout(() => {
          setSuccessMessage(null);
          setCurrentStep(2);
        }, 400);
      } else {
        setErrorMessage(res.message || 'Failed to save trainer profile.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error registering profile. Please verify your details.');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 2: SELECT TRACK
  // ---------------------------------------------------------------------------
  const handleStep2Submit = () => {
    if (!selectedTrackId) {
      setErrorMessage('Please select your primary teaching track.');
      return;
    }
    const track = tracks.find((t) => t.id === selectedTrackId);
    if (track) {
      setSelectedTrackName(track.name);
    }
    setErrorMessage(null);
    setCurrentStep(3);
  };

  // ---------------------------------------------------------------------------
  // STEP 3: ACCEPT POLICY
  // ---------------------------------------------------------------------------
  const handleStep3Submit = async () => {
    if (!acceptCheckbox) {
      setErrorMessage('You must review and accept the Trainer Standards Policy to proceed.');
      return;
    }

    if (!policy) {
      setCurrentStep(4);
      return;
    }

    try {
      setSaving(true);
      await api.post('/trainer-submissions/policy/accept', {
        policyId: policy.id,
        policyVersion: policy.version,
      });
      setPolicyAccepted(true);
      setErrorMessage(null);
      setCurrentStep(4);
    } catch (err: any) {
      console.warn('Policy accept error or already accepted:', err);
      setCurrentStep(4);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 4: SAVE AS DRAFT
  // ---------------------------------------------------------------------------
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const res = await api.post<{ success: boolean; message: string; data: any }>(
        '/trainer-submissions/save-draft',
        {
          id: submissionId,
          trackId: selectedTrackId,
          trackName: selectedTrackName,
          title: courseTitle || 'Untitled Course Draft',
          shortDescription,
          fullDescription,
          level,
          numberOfSessions: sessions.length,
          submissionNotes,
          sessions,
        }
      );

      if (res.success && res.data) {
        setSubmissionId(res.data.id);
        setSuccessMessage('Draft saved successfully! You can resume and edit this anytime.');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // STEP 4: SUBMIT FOR 48-HOUR REVIEW
  // ---------------------------------------------------------------------------
  const handleSubmitForReview = async () => {
    setErrorMessage(null);

    // Validation
    if (!courseTitle.trim()) {
      setErrorMessage('Course Title is mandatory.');
      return;
    }
    if (!selectedTrackId) {
      setErrorMessage('Please select a teaching track in Step 2.');
      return;
    }
    if (!sessions || sessions.length === 0) {
      setErrorMessage('Please add at least 1 session to your course.');
      return;
    }

    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      if (!s.title.trim()) {
        setErrorMessage(`Session #${i + 1} is missing a title.`);
        return;
      }
      if (!s.videoId && !s.videoUrl && !s.fileUrl) {
        setErrorMessage(
          `Session #${i + 1} ("${s.title}") must have a Bunny Video ID, Video URL, or material attached.`
        );
        return;
      }
    }

    try {
      setSaving(true);
      const res = await api.post<{ success: boolean; message: string; data: any }>(
        '/trainer-submissions/submit',
        {
          id: submissionId,
          trackId: selectedTrackId,
          trackName: selectedTrackName,
          title: courseTitle.trim(),
          shortDescription,
          fullDescription,
          level,
          numberOfSessions: sessions.length,
          submissionNotes,
          sessions,
        }
      );

      if (res.success) {
        setSubmittedSuccess(true);
      } else {
        setErrorMessage(res.message || 'Submission failed. Please check all fields.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit course for review.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-semibold">Loading Trainer Studio...</p>
        </div>
      </div>
    );
  }

  // SUBMITTED SUCCESS VIEW
  if (submittedSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>48-Hour Academic Review Guarantee</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Course Submitted For Review!</h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Thank you for submitting <strong className="text-slate-900">"{courseTitle}"</strong> to Scalora LMS. Our
              curriculum board is currently reviewing your session materials against production standards.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-left space-y-3">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              What Happens Next?
            </h4>
            <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>Our reviewers test video stream playback and verify syllabus outcomes within 48 hours.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>
                  Upon approval, your course is published live to the Scalora catalog and credited to your instructor
                  profile.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>You will receive an in-app notification and email confirmation once review is complete.</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/trainer/submissions"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Track My Submissions</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isArabicPolicy = isArabicText(policy?.content || '');

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Hero Banner */}
      <section className="bg-white border-b border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Scalora Faculty & Trainer Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Teach on Scalora. <span className="text-blue-600">Empower Thousands.</span>
              </h1>
              <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
                Submit your production-ready curriculum, share your expertise, and reach top learners and enterprises
                across the region.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/trainer/submissions"
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>My Submissions Workspace</span>
              </Link>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="mt-10 grid grid-cols-4 gap-2 sm:gap-4">
            {[
              { num: 1, title: 'Trainer Profile', desc: 'Credentials & Contact' },
              { num: 2, title: 'Teaching Track', desc: 'Category & Focus' },
              { num: 3, title: 'Trainer Policy', desc: 'Academic Standards' },
              { num: 4, title: 'Course Builder', desc: 'Curriculum & Sessions' },
            ].map((step) => {
              const isDone = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div
                  key={step.num}
                  onClick={() => {
                    if (isDone || (currentStep === 4 && step.num >= 1)) {
                      setCurrentStep(step.num);
                    }
                  }}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                      : isDone
                      ? 'bg-white border-emerald-300 hover:bg-slate-50'
                      : 'bg-white/60 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isDone ? '✓' : step.num}
                    </div>
                    <span className="font-black text-xs sm:text-sm text-slate-900 truncate">{step.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 hidden sm:block truncate">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Form Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Alerts */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 1: TRAINER PROFILE REGISTRATION */}
        {/* ------------------------------------------------------------------ */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 animate-in fade-in duration-150">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Step 1: Trainer Profile & Credentials</h2>
              <p className="text-slate-600 text-sm mt-1">
                Tell us about your background, contact information, and teaching expertise.
              </p>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Full Legal / Professional Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Ahmed Mansour"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-slate-900 font-medium text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Email Address (Mandatory & Unique) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trainer@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-slate-900 font-medium text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Mobile Phone Number (Mandatory & Unique) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+20 100 123 4567"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-slate-900 font-medium text-sm transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Used for urgent course review notices and instructor onboarding.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Country of Residence
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-slate-900 font-medium text-sm transition-all"
                  >
                    <option value="Egypt">Egypt</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Jordan">Jordan</option>
                    <option value="Kuwait">Kuwait</option>
                    <option value="Qatar">Qatar</option>
                    <option value="Oman">Oman</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-slate-900 font-medium text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Years of Professional Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-slate-900 font-medium text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Professional Title / Headline
                </label>
                <input
                  type="text"
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  placeholder="e.g. Senior Solution Architect & AI Engineer"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-slate-900 font-medium text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Short Instructor Bio
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Summarize your industry accomplishments, previous workshops taught, and what students will gain from your courses..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-slate-900 font-medium text-sm transition-all"
                />
              </div>

              {!user && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Create Password (Optional - for logging in later)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a secure password (min 6 characters)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
                  />
                  <p className="text-[11px] text-slate-500">
                    If left blank, a temporary secure credential will be generated for your trainer workspace.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Select Track</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 2: TEACHING TRACK SELECTION */}
        {/* ------------------------------------------------------------------ */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 animate-in fade-in duration-150">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Step 2: Select Your Teaching Track</h2>
              <p className="text-slate-600 text-sm mt-1">
                Choose the primary domain category where your course belongs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tracks.map((track) => {
                const isSelected = selectedTrackId === track.id;
                const IconComponent = (track.icon && TRACK_ICONS[track.icon]) || Briefcase;
                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      setSelectedTrackId(track.id);
                      setSelectedTrackName(track.name);
                    }}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-blue-600'
                        }`}
                      >
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-base">{track.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {track.description || `Specialized programs in ${track.name}.`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                        {isSelected ? '✓ Selected' : 'Click to select'}
                      </span>
                      {isSelected && <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleStep2Submit}
                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>Next: Academic Standards Policy</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 3: TRAINER POLICY ACCEPTANCE (RTL & Multi-Language Support) */}
        {/* ------------------------------------------------------------------ */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 animate-in fade-in duration-150">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Step 3: Scalora Trainer & Academic Standards Policy
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Please review and accept our academic quality framework before submitting materials.
                </p>
              </div>

              {policy && (
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                  Version {policy.version}.0
                </span>
              )}
            </div>

            {/* Policy Reader Box with Arabic RTL & Rich Text HTML Support */}
            <div
              dir={isArabicPolicy ? 'rtl' : 'ltr'}
              className={`p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 max-h-[420px] overflow-y-auto prose prose-slate text-sm space-y-4 leading-relaxed ${
                isArabicPolicy ? 'text-right font-sans font-medium' : 'text-left'
              }`}
              style={{
                direction: isArabicPolicy ? 'rtl' : 'ltr',
                textAlign: isArabicPolicy ? 'right' : 'left',
                unicodeBidi: 'plaintext',
              }}
            >
              {policy?.content ? (
                policy.content.includes('<') && policy.content.includes('>') ? (
                  <div
                    className="prose prose-slate max-w-none text-slate-800 text-xs sm:text-sm space-y-3"
                    dangerouslySetInnerHTML={{ __html: policy.content }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap font-sans text-slate-700 text-xs sm:text-sm leading-relaxed">
                    {policy.content}
                  </div>
                )
              ) : (
                <p className="text-slate-500 italic">Loading policy guidelines...</p>
              )}
            </div>

            {/* Mandatory Checkbox */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start gap-3.5">
              <input
                type="checkbox"
                id="policyAccept"
                checked={acceptCheckbox}
                onChange={(e) => setAcceptCheckbox(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="policyAccept" className="text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer select-none">
                I have read, understood, and agree to adhere to the{' '}
                <strong className="text-blue-700">Scalora Trainer & Academic Standards Policy</strong>. I certify that all
                course materials submitted are original and compliant with production quality guidelines.
              </label>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleStep3Submit}
                disabled={!acceptCheckbox || saving}
                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <span>Accept & Proceed to Course Builder</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 4: COURSE SUBMISSION & DYNAMIC SESSION BUILDER */}
        {/* ------------------------------------------------------------------ */}
        {currentStep === 4 && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Main Course Info Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Step 4: Course Details & Curriculum</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Teaching Track: <strong className="text-blue-600">{selectedTrackName || 'Selected Track'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>Save Draft</span>
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Course Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Masterclass: Advanced B2B Enterprise Sales Engineering"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-slate-900 font-semibold text-base transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Course Level
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 text-slate-900 text-sm font-medium"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="All Levels">All Levels</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Number of Sessions
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={numberOfSessions}
                      onChange={(e) => handleNumberOfSessionsChange(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 text-slate-900 text-sm font-bold text-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Short Description (Course Card Summary)
                  </label>
                  <input
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="One or two compelling sentences summarizing the tangible takeaway..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 text-slate-900 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Full Course Syllabus & Description
                  </label>
                  <textarea
                    rows={4}
                    value={fullDescription}
                    onChange={(e) => setFullDescription(e.target.value)}
                    placeholder="Detailed syllabus, prerequisites, key learning outcomes, and practical exercises..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 text-slate-900 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* DYNAMIC SESSION BUILDER */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <PlaySquare className="w-5 h-5 text-blue-600" />
                    <span>Curriculum Sessions ({sessions.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure titles, video links (Bunny Stream / Video URL), and session durations.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addSession}
                  className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Session Card</span>
                </button>
              </div>

              {/* Sessions List */}
              <div className="space-y-4">
                {sessions.map((session, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4 transition-all hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                          {session.sessionNumber}
                        </span>
                        <h4 className="font-black text-slate-900 text-sm sm:text-base">
                          Session #{session.sessionNumber}: {session.title || 'Untitled'}
                        </h4>
                      </div>

                      {sessions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSession(index)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Remove Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Session Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={session.title}
                          onChange={(e) => updateSession(index, 'title', e.target.value)}
                          placeholder={`e.g. Session ${index + 1}: Implementation Blueprint`}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 text-sm font-semibold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Duration (Minutes)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="300"
                          value={session.durationMinutes}
                          onChange={(e) =>
                            updateSession(index, 'durationMinutes', parseInt(e.target.value, 10) || 30)
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 text-sm font-medium text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Video Provider Selection */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                        <span>Video Stream Method:</span>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`videoProvider-${index}`}
                            value="bunny"
                            checked={session.videoProvider === 'bunny'}
                            onChange={() => updateSession(index, 'videoProvider', 'bunny')}
                            className="text-blue-600"
                          />
                          <span>Bunny Stream ID</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`videoProvider-${index}`}
                            value="url"
                            checked={session.videoProvider === 'url'}
                            onChange={() => updateSession(index, 'videoProvider', 'url')}
                            className="text-blue-600"
                          />
                          <span>Direct Video URL</span>
                        </label>
                      </div>

                      {session.videoProvider === 'bunny' ? (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Bunny Stream Video ID (UUID)
                          </label>
                          <input
                            type="text"
                            value={session.videoId}
                            onChange={(e) => updateSession(index, 'videoId', e.target.value)}
                            placeholder="e.g. 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
                            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            Video URL (MP4 / Stream / YouTube Embed)
                          </label>
                          <input
                            type="url"
                            value={session.videoUrl}
                            onChange={(e) => updateSession(index, 'videoUrl', e.target.value)}
                            placeholder="https://commondatastorage.googleapis.com/... or https://youtube.com/watch?v=..."
                            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Session Summary & Objectives (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={session.description}
                        onChange={(e) => updateSession(index, 'description', e.target.value)}
                        placeholder="What students will learn in this session..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-600 text-xs font-medium text-slate-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submission Notes & SLA Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">48-Hour Review & Approval SLA</h4>
                  <p className="text-xs text-slate-500">
                    Your course will be strictly reviewed by Scalora's academic board within 48 hours of submission.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Notes or Instructions for Academic Reviewers (Optional)
                </label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Mention any credentials, sample accounts, or instructions needed to review your course materials..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-600 text-slate-900 text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Policy</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Submit For Review (48h SLA)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
