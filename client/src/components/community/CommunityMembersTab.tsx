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
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 text-slate-900">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Community Directory ({members.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Active scholars and assigned instructors in this engineering track.
          </p>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
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
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all flex items-center justify-between gap-3"
            >
              <div
                onClick={() => onUserClick(member.id)}
                className="flex items-center gap-3 min-w-0 cursor-pointer group"
              >
                <img
                  src={
                    member.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=2563EB&color=fff`
                  }
                  alt={member.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-blue-100 group-hover:scale-105 transition-transform shadow-sm"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {member.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isTrainer ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        Instructor
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-600">
                        Scholar
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isTrainer ? (
                <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                  Lead
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-xl bg-slate-200 text-slate-700 text-[10px] font-semibold">
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
