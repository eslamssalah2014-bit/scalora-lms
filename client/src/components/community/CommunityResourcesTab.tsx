import React from 'react';
import { CommunityPost } from '../../types';
import { FolderDown, Download, FileText, ExternalLink, Paperclip, Sparkles } from 'lucide-react';

interface CommunityResourcesTabProps {
  posts: CommunityPost[];
}

export const CommunityResourcesTab: React.FC<CommunityResourcesTabProps> = ({ posts }) => {
  const resourcePosts = posts.filter((p) => p.type === 'FILE' || p.fileUrl);

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 text-slate-900">
      <div className="pb-4 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FolderDown className="w-5 h-5 text-purple-600" />
          <span>Course Blueprint & Resource Vault</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Production-tested templates, deployment scripts, architecture blueprints, and files shared across discussions.
        </p>
      </div>

      {resourcePosts.length === 0 ? (
        <div className="p-12 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
          <FolderDown className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900">No files shared yet</h4>
          <p className="text-xs text-slate-500">
            Files and blueprints shared in the feed will automatically be archived here for one-click downloading.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resourcePosts.map((post) => (
            <div
              key={post.id}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 hover:shadow-sm transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {post.fileName || post.title || 'Architectural Blueprint'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Shared by {post.author.name} • {post.fileSize || 'Standard Document'}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {post.content}
                </p>
              </div>

              {post.fileUrl && (
                <a
                  href={post.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
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
