import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Trainer } from '../../types';
import {
  Users,
  Plus,
  Search,
  Edit2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Linkedin,
  Globe,
  BookOpen,
  Mail,
  Shield,
  Loader2,
  X,
  AlertCircle,
  Sparkles,
  Award,
} from 'lucide-react';

export const AdminTrainersPage: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    title: '',
    bio: '',
    avatar: '',
    linkedin: '',
    website: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; trainers: Trainer[] }>('/trainers');
      if (res.success) {
        setTrainers(res.trainers);
      }
    } catch (err: any) {
      console.error('Error loading trainers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingTrainer(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      title: '',
      bio: '',
      avatar: '',
      linkedin: '',
      website: '',
      status: 'ACTIVE',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setFormData({
      name: trainer.name,
      email: trainer.email,
      password: '',
      title: trainer.title || '',
      bio: trainer.bio || '',
      avatar: trainer.avatar || '',
      linkedin: trainer.linkedin || '',
      website: trainer.website || '',
      status: (trainer.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (trainer: Trainer) => {
    try {
      const res = await api.patch<{ success: boolean; message: string; trainer: any }>(
        `/trainers/${trainer.id}/status`,
        {}
      );
      if (res.success) {
        setTrainers((prev) =>
          prev.map((t) => (t.id === trainer.id ? { ...t, status: res.trainer.status } : t))
        );
      }
    } catch (err: any) {
      console.error('Error toggling trainer status:', err);
    }
  };

  const handleSaveTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingTrainer) {
        // Edit existing
        const res = await api.put<{ success: boolean; message: string; trainer: Trainer }>(
          `/trainers/${editingTrainer.id}`,
          formData
        );
        if (res.success) {
          setTrainers((prev) =>
            prev.map((t) => (t.id === editingTrainer.id ? { ...t, ...res.trainer } : t))
          );
          setIsModalOpen(false);
        }
      } else {
        // Create new
        const res = await api.post<{ success: boolean; message: string; trainer: Trainer }>(
          '/trainers',
          formData
        );
        if (res.success) {
          setTrainers((prev) => [res.trainer, ...prev]);
          setIsModalOpen(false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save trainer');
    } finally {
      setSaving(false);
    }
  };

  const filteredTrainers = trainers.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      (t.title && t.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            <span>Trainers & Instructors Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage certified instructors, course assignments, bios, credentials, and access statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white font-bold text-xs shadow-glow-accent hover:opacity-95 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Trainer Account</span>
        </button>
      </div>

      {/* Search & Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0B1528] border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{trainers.length}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Trainers</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B1528] border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-white">
              {trainers.filter((t) => t.status === 'ACTIVE').length}
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Instructors</div>
          </div>
        </div>

        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          <input
            type="text"
            placeholder="Search by name, email, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#0B1528] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>
      </div>

      {/* Trainers Cards Roster */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-xs text-slate-400">Loading trainer roster...</p>
        </div>
      ) : filteredTrainers.length === 0 ? (
        <div className="p-12 text-center bg-[#0B1528] rounded-3xl border border-white/10 space-y-3">
          <Users className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No trainers found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search ? `No trainers matched "${search}".` : 'Get started by creating your first trainer account.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTrainers.map((trainer) => (
            <div
              key={trainer.id}
              className="bg-[#0B1528] rounded-3xl p-5 border border-white/10 hover:border-cyan-500/30 transition-all shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Trainer Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        trainer.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(trainer.name)}&background=0284C7&color=fff`
                      }
                      alt={trainer.name}
                      className="w-13 h-13 rounded-2xl object-cover border-2 border-cyan-500/30 shadow-md flex-shrink-0"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{trainer.name}</h3>
                      <div className="text-xs font-semibold text-cyan-300 mt-0.5">
                        {trainer.title || 'Senior Instructor'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{trainer.email}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      trainer.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {trainer.status}
                  </span>
                </div>

                {/* Bio Snippet */}
                {trainer.bio && (
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-[#091324] p-3 rounded-2xl border border-white/5">
                    {trainer.bio}
                  </p>
                )}

                {/* Social Links */}
                <div className="flex items-center gap-2">
                  {trainer.linkedin && (
                    <a
                      href={trainer.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-[#091324] text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-all border border-white/5"
                      title="LinkedIn Profile"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {trainer.website && (
                    <a
                      href={trainer.website}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-[#091324] text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                      title="Personal Website"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Assigned Courses Roster */}
                <div className="pt-2 border-t border-white/10">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-cyan-400" />
                    <span>Assigned Courses ({trainer.assignedCourses?.length || 0})</span>
                  </div>

                  {trainer.assignedCourses && trainer.assignedCourses.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {trainer.assignedCourses.map((ac, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-lg bg-[#091324] text-cyan-300 text-[10px] font-bold border border-cyan-500/20 truncate max-w-[190px]"
                        >
                          {ac.course.title}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No courses assigned yet</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(trainer)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    trainer.status === 'ACTIVE'
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  {trainer.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(trainer)}
                  className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT TRAINER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B1528] w-full max-w-xl rounded-3xl border border-white/15 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>{editingTrainer ? 'Edit Trainer Profile' : 'Create New Trainer Account'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveTrainer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#091324] border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    placeholder="e.g. Eslam Salah"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    disabled={Boolean(editingTrainer)}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#091324] border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                    placeholder="trainer@scalora.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {editingTrainer ? 'New Password (leave blank to keep)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingTrainer}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#091324] border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Job Title / Specialty</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#091324] border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    placeholder="e.g. Principal Cloud Architect"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Photo / Avatar URL</label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#091324] border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Biography</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#091324] border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none resize-none"
                  placeholder="Tell students about the instructor's background and achievements..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#091324] border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Website / Portfolio</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#091324] border border-white/10 text-white text-xs focus:border-cyan-400 focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-scalora-blue text-white font-bold text-xs shadow-glow-accent hover:opacity-95 transition-all flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingTrainer ? 'Save Changes' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
