import React, { useState } from 'react';
import { CommunityChannel } from '../../types';
import { Users, Shield, GraduationCap, Search, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CommunityMembersTabProps {
  channel: CommunityChannel | null;
  onUserClick: (userId: string) => void;
}

export const CommunityMembersTab: React.FC<CommunityMembersTabProps> = ({ channel, onUserClick }) => {
  const [search, setSearch] = useState('');

  if (!channel) return null;

  const members = channel.recentMembers || [];
  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#0B1528] rounded-3xl p-6 border border-white/10 shadow-xl space-y-5">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Community Directory ({members.length})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Active scholars and assigned instructors in this track.
          </p>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#050C1A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((member) => {
          const isTrainer = member.role === 'ADMIN' || member.role === 'TRAINER';
          return (
            <div
              key={member.id}
              className="p-4 rounded-2xl bg-[#091324] border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3"
            >
              <div
                onClick={() => onUserClick(member.id)}
                className="flex items-center gap-3 min-w-0 cursor-pointer group"
              >
                <img
                  src={
                    member.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0284C7&color=fff`
                  }
                  alt={member.name}
                  className="w-11 h-11 rounded-2xl object-cover border border-white/10 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {member.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isTrainer ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        Instructor
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/5 text-slate-400">
                        Scholar
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isTrainer ? (
                <span className="px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-300 text-[10px] font-extrabold border border-cyan-500/20">
                  Lead
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-xl bg-white/5 text-slate-400 text-[10px] font-bold">
                  Peer
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
