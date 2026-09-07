import React, { useState } from 'react';
import { Calendar, Radio, Clock, Users, Check, ExternalLink, Sparkles } from 'lucide-react';

export const CommunityEventsTab: React.FC = () => {
  const [rsvpd, setRsvpd] = useState<{ [key: string]: boolean }>({});

  const events = [
    {
      id: 'event-1',
      title: 'Weekly Live Architecture AMA with Eslam Salah',
      date: 'Every Thursday',
      time: '7:00 PM UTC (9:00 PM Cairo)',
      description:
        'Live interactive teardown of student system designs, production troubleshooting, and Q&A office hours.',
      host: 'Eslam Salah',
      hostRole: 'Lead Instructor',
      isLiveSoon: true,
    },
    {
      id: 'event-2',
      title: 'Cohort Capstone Presentation & Peer Review',
      date: 'Saturday, Sept 5, 2026',
      time: '6:00 PM UTC',
      description:
        'Selected students present their end-to-end production architecture pipelines for constructive grading and live feedback.',
      host: 'Scalora Faculty',
      hostRole: 'Mentorship Board',
      isLiveSoon: false,
    },
  ];

  const handleToggleRsvp = (id: string) => {
    setRsvpd((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 text-slate-900">
      <div className="pb-4 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-rose-600" />
          <span>Live Sessions & Community Calendar</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Join scheduled live architectural reviews, office hours, and cohort demo days.
        </p>
      </div>

      <div className="space-y-4">
        {events.map((event) => {
          const isAttending = rsvpd[event.id];
          return (
            <div
              key={event.id}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-rose-600 animate-pulse" />
                    <span>{event.date}</span>
                  </span>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{event.time}</span>
                  </span>
                </div>

                <div className="text-xs font-semibold text-blue-700">
                  Hosted by {event.host} ({event.hostRole})
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-900 leading-snug">{event.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{event.description}</p>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Streamed via private Zoom room</span>
                <button
                  type="button"
                  onClick={() => handleToggleRsvp(event.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    isAttending
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isAttending && <Check className="w-3.5 h-3.5" />}
                  <span>{isAttending ? 'RSVP Confirmed ✓' : 'RSVP & Add to Calendar'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
