import React, { useState } from 'react';
import { FileText, MessageSquare, Search } from 'lucide-react';
import { DocumentChunk, StudyDocument } from '../types/aura';
import { searchChunksInDocuments } from '../services/auraApi';

interface SearchViewProps {
  documents: StudyDocument[];
  selectedDocIds: string[];
  onAskAboutSnippet: (prompt: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  documents,
  selectedDocIds,
  onAskAboutSnippet,
}) => {
  const [query, setQuery] = useState('');
  const [scopeAll, setScopeAll] = useState(true);

  const targetDocs = scopeAll
    ? documents
    : documents.filter((d) => selectedDocIds.includes(d.id));

  const targetChunks: DocumentChunk[] = targetDocs.flatMap((d) => d.chunks);

  const results = query.trim()
    ? searchChunksInDocuments(query, targetChunks)
    : targetChunks.map((c) => ({
        chunkId: c.id,
        documentId: c.documentId,
        documentName: c.documentName,
        pageNumber: c.pageNumber,
        topic: c.topic,
        snippet: c.text,
        relevanceScore: 1,
      }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Document Knowledge Search
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Search across your uploaded study materials by keyword, concept, or formula, and ask Aura
          directly about any passage.
        </p>
      </div>

      {/* Search Bar & Scope Toggle */}
      <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your notes (e.g., 'regularization', 'LEGB scope', 'Coffman deadlock', 'gradient descent')..."
            className="w-full bg-[#090D16] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#090D16] p-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setScopeAll(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              scopeAll ? 'bg-emerald-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Search All Documents
          </button>
          <button
            onClick={() => setScopeAll(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              !scopeAll ? 'bg-emerald-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Selected ({selectedDocIds.length})
          </button>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
          <span>
            {query.trim()
              ? `Found ${results.length} matching passages for "${query}"`
              : `Showing all ${results.length} indexed passages`}
          </span>
          <span>Grounded in your study material</span>
        </div>

        {results.length === 0 ? (
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-10 text-center space-y-2">
            <div className="text-base font-semibold text-white">No matching passages found</div>
            <p className="text-xs text-slate-400">
              Try searching for another term or switch scope to &ldquo;Search All Documents&rdquo;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {results.map((item) => (
              <div
                key={item.chunkId}
                className="bg-[#111827] border border-white/[0.08] rounded-2xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums">
                  <div className="text-emerald-400 font-semibold">
                    📄 {item.documentName} · Page {item.pageNumber}
                  </div>
                  <div className="text-slate-400">Topic: {item.topic}</div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{item.snippet}</p>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-slate-500">Chunk ID: {item.chunkId}</span>
                  <button
                    onClick={() =>
                      onAskAboutSnippet(
                        `Based on ${item.documentName} (Page ${item.pageNumber}), explain "${item.topic}" and summarize its key points.`
                      )
                    }
                    className="inline-flex items-center gap-1.5 font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask Aura about this →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
