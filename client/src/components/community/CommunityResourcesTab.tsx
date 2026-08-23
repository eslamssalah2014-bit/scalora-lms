import React from 'react';
import { CommunityPost } from '../../types';
import { FolderDown, Download, FileText, ExternalLink, Paperclip, Sparkles } from 'lucide-react';

interface CommunityResourcesTabProps {
  posts: CommunityPost[];
}

export const CommunityResourcesTab: React.FC<CommunityResourcesTabProps> = ({ posts }) => {
  const resourcePosts = posts.filter((p) => p.type === 'FILE' || p.fileUrl);

  return (
    <div className="bg-[#0B1528] rounded-3xl p-6 border border-white/10 shadow-xl space-y-5">
      <div className="pb-4 border-b border-white/10">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <FolderDown className="w-5 h-5 text-purple-400" />
          <span>Course Blueprint & Resource Vault</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Production-tested Helm charts, scripts, SOP templates, and architectural diagrams shared by instructors and peers.
        </p>
      </div>

      {resourcePosts.length === 0 ? (
        <div className="p-12 text-center space-y-2 bg-[#091324] rounded-2xl border border-white/5">
          <FolderDown className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">No files shared yet</h4>
          <p className="text-xs text-slate-400">
            Files and blueprints shared in the feed will automatically be archived here for one-click downloading.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resourcePosts.map((post) => (
            <div
              key={post.id}
              className="p-4 rounded-2xl bg-[#091324] border border-white/5 hover:border-purple-500/30 transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {post.fileName || post.title || 'Architectural Blueprint'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Shared by {post.author.name} • {post.fileSize || 'Standard Document'}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {post.content}
                </p>
              </div>

              {post.fileUrl && (
                <a
                  href={post.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="w-full py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-purple-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
