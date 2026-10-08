import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { NavigationTab, StudyDocument, UploadStatus } from '../types/aura';
import { processUploadedFile } from '../services/documentProcessor';

interface DocumentsViewProps {
  documents: StudyDocument[];
  selectedDocIds: string[];
  onToggleSelectDoc: (id: string) => void;
  onSelectAllDocs: () => void;
  onAddDocuments: (newDocs: StudyDocument[]) => void;
  onRenameDocument: (id: string, newName: string) => void;
  onDeleteDocument: (id: string) => void;
  onRestoreSampleDocs: () => void;
  onNavigate: (tab: NavigationTab) => void;
  onAskAboutDocument?: (prompt: string) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  selectedDocIds,
  onToggleSelectDoc,
  onSelectAllDocs,
  onAddDocuments,
  onRenameDocument,
  onDeleteDocument,
  onRestoreSampleDocs,
  onNavigate,
  onAskAboutDocument,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentlyUploadedNames, setRecentlyUploadedNames] = useState<string[]>([]);

  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [inspectingDoc, setInspectingDoc] = useState<StudyDocument | null>(null);

  const handleFiles = async (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;

    setErrorMessage(null);
    setRecentlyUploadedNames([]);
    const files = Array.from(fileList);
    const processedDocs: StudyDocument[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const doc = await processUploadedFile(file, (status, msg, prog) => {
          setUploadStatus(status);
          setStatusMessage(`${file.name}: ${msg}`);
          setUploadProgress(prog);
        });
        processedDocs.push(doc);
      }

      onAddDocuments(processedDocs);
      setRecentlyUploadedNames(processedDocs.map((d) => d.name));
      setUploadStatus('ready');
      setStatusMessage('Your document is ready.');
      setUploadProgress(100);
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMessage(err?.message || 'Could not process the uploaded file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const startRename = (doc: StudyDocument) => {
    setEditingDocId(doc.id);
    setEditingName(doc.name);
  };

  const saveRename = (id: string) => {
    if (editingName.trim()) {
      onRenameDocument(id, editingName.trim());
    }
    setEditingDocId(null);
  };

  const downloadSampleTxtForTesting = () => {
    const sampleText = `Database Management Systems — Relational Algebra & Normalization

1. ACID Properties of Transactions
A transaction is a single logical unit of work that accesses and updates a database. To preserve data integrity despite system failures or concurrent access, transactions must satisfy the four ACID properties: Atomicity (either all operations of the transaction execute or none do), Consistency (a transaction transforms the database from one valid state to another valid state), Isolation (concurrent execution of transactions leaves the database in the same state as serial execution), and Durability (once a transaction commits, its changes persist even in the event of a power loss or crash).

2. Database Normalization (1NF, 2NF, 3NF, BCNF)
Normalization is the systematic process of organizing relational tables to minimize data redundancy and eliminate insertion, update, and deletion anomalies. First Normal Form (1NF) requires that all attribute values are atomic (indivisible) and there are no repeating groups. Second Normal Form (2NF) requires 1NF plus no partial functional dependencies—every non-prime attribute must be fully functionally dependent on the entire candidate key. Third Normal Form (3NF) requires 2NF plus no transitive dependencies of non-prime attributes on any superkey. Boyce-Codd Normal Form (BCNF) is a stricter version of 3NF where for every non-trivial functional dependency X -> Y, X must be a superkey.

3. B+ Tree Indexing
Database systems use B+ Trees as the default indexing structure for disk-based storage because B+ Trees are balanced multi-level search trees with high fanout, minimizing disk I/O operations. In a B+ Tree, internal nodes store only routing keys while leaf nodes store the actual data pointers and are linked sequentially in a doubly linked list, enabling both O(log n) point lookups and fast sequential range queries.`;

    const blob = new Blob([sampleText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DBMS-Unit-3-Notes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const testUploadSamplePicture = async () => {
    // Dynamically render a realistic whiteboard / study diagram image on an HTML5 Canvas and process it as a PNG File
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark Slate Whiteboard Background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border & Grid
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    for (let x = 40; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 40; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Heading
    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('NEURAL NETWORKS & BACKPROPAGATION — WHITEBOARD SNAPSHOT', 45, 65);

    // Section 1 Box
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 95, 870, 210);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('1. Forward Propagation & Activation Functions', 65, 135);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '18px sans-serif';
    ctx.fillText('• Each neuron computes weighted sum: z = w · x + b', 65, 175);
    ctx.fillText('• ReLU (Rectified Linear Unit): f(z) = max(0, z) prevents vanishing gradients.', 65, 210);
    ctx.fillText('• Sigmoid: σ(z) = 1 / (1 + e^-z) squashes output between (0, 1) for probabilities.', 65, 245);
    ctx.fillText('• Softmax converts raw logits into a normalized probability distribution over K classes.', 65, 280);

    // Section 2 Box
    ctx.strokeStyle = '#38BDF8';
    ctx.strokeRect(45, 335, 870, 215);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('2. Backpropagation & Chain Rule', 65, 375);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '18px sans-serif';
    ctx.fillText('• Backpropagation computes ∂Loss / ∂w using the Calculus Chain Rule from output to input.', 65, 415);
    ctx.fillText('• Vanishing Gradient Problem occurs in deep networks using Sigmoid/Tanh when gradients < 1.', 65, 450);
    ctx.fillText('• Dropout randomly zeroes out a fraction p of neurons during training to prevent co-adaptation.', 65, 485);
    ctx.fillText('• Batch Normalization normalizes layer activations to accelerate training stability.', 65, 520);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const sampleImgFile = new File([blob], 'Whiteboard-Neural-Networks-Diagram.png', {
        type: 'image/png',
      });
      await handleFiles([sampleImgFile]);
    }, 'image/png');
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            My Study Documents &amp; Pictures
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload any file or picture — PDFs, photos of handwritten notes, whiteboard images,
            DOCX, TXT, PPTX, CSV, code, or audio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={testUploadSamplePicture}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Try Sample Notes Picture (.PNG)</span>
          </button>
          <button
            onClick={downloadSampleTxtForTesting}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Test .TXT</span>
          </button>
          <button
            onClick={onRestoreSampleDocs}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Sample Bundle</span>
          </button>
        </div>
      </div>

      {/* Universal Drag & Drop Upload Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10'
            : 'border-white/15 bg-[#111827] hover:border-white/25'
        }`}
      >
        {/* Universal File Input (accepts ALL files) */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Dedicated Picture / Camera Input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-6 h-6" />
        </div>

        <h2 className="text-base sm:text-lg font-semibold text-white">
          Upload any study file or picture
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl mx-auto">
          Drag and drop <strong className="text-slate-200">Pictures (PNG, JPG, WEBP, HEIC)</strong>,{' '}
          <strong className="text-slate-200">PDFs</strong>,{' '}
          <strong className="text-slate-200">Word / Slides / Text (DOCX, PPTX, TXT, MD, CSV)</strong>
          , <strong className="text-slate-200">Code</strong>, or{' '}
          <strong className="text-slate-200">Audio recordings</strong>. Aura extracts all text,
          handwritten notes, and diagrams automatically.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Browse Any File (All Formats)</span>
          </button>

          <button
            onClick={() => imageInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>Upload Pictures / Photos</span>
          </button>
        </div>

        {/* Upload / Processing Progress State */}
        {uploadStatus !== 'idle' && uploadStatus !== 'error' && (
          <div className="mt-6 max-w-lg mx-auto bg-[#0B111E] border border-white/10 rounded-xl p-4 text-left space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200 flex items-center gap-2">
                {uploadStatus === 'ready' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                )}
                {statusMessage}
              </span>
              <span className="font-mono tabular-nums text-emerald-400">{uploadProgress}%</span>
            </div>

            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            {uploadStatus === 'ready' && (
              <div className="pt-3 space-y-3 border-t border-white/[0.08]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-300">
                    Ready to explain:{' '}
                    <span className="font-semibold text-emerald-400">
                      {recentlyUploadedNames.join(', ')}
                    </span>
                  </div>
                  <button
                    onClick={() => setUploadStatus('idle')}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="text-xs font-medium text-white">
                  How would you like Aura to explain this file?
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      label: '✨ Explain Simply + Examples',
                      prompt: `Explain "${recentlyUploadedNames.join(', ')}" in simple, easy-to-understand words with real-life examples.`,
                    },
                    {
                      label: '📋 Summarize Full File',
                      prompt: `Summarize all the main points and key takeaways from "${recentlyUploadedNames.join(', ')}" clearly.`,
                    },
                    {
                      label: '🪜 Step-by-Step Breakdown',
                      prompt: `Break down every topic in "${recentlyUploadedNames.join(', ')}" step-by-step from beginning to end.`,
                    },
                    {
                      label: '🎯 Important Exam Questions & Answers',
                      prompt: `Give me the most important short and long exam questions and answers from "${recentlyUploadedNames.join(', ')}".`,
                    },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => {
                        if (onAskAboutDocument) {
                          onAskAboutDocument(opt.prompt);
                        } else {
                          onNavigate('ask');
                        }
                      }}
                      className="px-3 py-2 text-xs font-medium text-left text-slate-100 bg-[#111827] hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/50 rounded-lg transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>{opt.label}</span>
                      <span className="text-emerald-400">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Friendly Error State */}
        {uploadStatus === 'error' && errorMessage && (
          <div className="mt-6 max-w-lg mx-auto bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 text-left flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-rose-200">File Processing Notice</div>
                <p className="text-xs text-rose-300/90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setUploadStatus('idle');
                setErrorMessage(null);
              }}
              className="text-rose-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Document Scope Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-white/[0.08] rounded-xl p-4">
        <div className="text-xs sm:text-sm text-slate-300">
          Active Context:{' '}
          <strong className="text-white font-mono tabular-nums">
            {selectedDocIds.length} of {documents.length}
          </strong>{' '}
          files/pictures selected for Ask Aura, Study Mode, Exam Mode &amp; Quiz Arena.
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onSelectAllDocs}
            className="px-3.5 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Select All Files
          </button>
          <button
            onClick={() => onNavigate('ask')}
            className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Ask Aura About Selected
          </button>
        </div>
      </div>

      {/* Uploaded Documents List */}
      {documents.length === 0 ? (
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-10 text-center space-y-3">
          <FolderOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <div className="text-base font-semibold text-white">No study files uploaded yet</div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Upload any file or picture above, or load our sample university study bundle to test
            Aura Learn immediately.
          </p>
          <button
            onClick={onRestoreSampleDocs}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
          >
            Load Sample Study Material
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {documents.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.id);
            const isEditing = editingDocId === doc.id;

            return (
              <div
                key={doc.id}
                className={`bg-[#111827] border rounded-2xl p-5 flex flex-col justify-between transition-colors ${
                  isSelected
                    ? 'border-emerald-500/50'
                    : 'border-white/[0.08] hover:border-white/15'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => onToggleSelectDoc(doc.id)}
                        aria-label={`Select ${doc.name}`}
                        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-400 border-emerald-400 text-slate-950'
                            : 'border-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </button>

                      <div className="min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveRename(doc.id)}
                              className="bg-[#090D16] border border-emerald-500/50 rounded px-2.5 py-1 text-sm text-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => saveRename(doc.id)}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <h3
                            onClick={() => onToggleSelectDoc(doc.id)}
                            className="text-base font-semibold text-white truncate cursor-pointer"
                            title={doc.name}
                          >
                            {doc.name}
                          </h3>
                        )}

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 mt-1 font-mono tabular-nums">
                          <span>{doc.fileType}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatBytes(doc.fileSize)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{doc.pageCount} Pages/Sections</span>
                          <span aria-hidden="true">·</span>
                          <span>{doc.chunkCount} Chunks</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setInspectingDoc(doc)}
                        title="View extracted chunks"
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startRename(doc)}
                        title="Rename document"
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteDocument(doc.id)}
                        title="Delete document"
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Picture Preview Thumbnail if Uploaded Image */}
                  {doc.previewImageUrl && (
                    <div
                      onClick={() => setInspectingDoc(doc)}
                      className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-[#090D16] max-h-36 flex items-center justify-center cursor-pointer"
                    >
                      <img
                        src={doc.previewImageUrl}
                        alt={doc.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-36 object-cover hover:opacity-90 transition-opacity"
                      />
                    </div>
                  )}

                  {doc.summaryPreview && (
                    <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                      {doc.summaryPreview}
                    </p>
                  )}

                  <div className="mt-3 text-xs text-slate-400">
                    <span className="text-slate-500">Detected Topics: </span>
                    <span className="text-slate-300">{doc.topics.join(' · ')}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <button
                    onClick={() => setInspectingDoc(doc)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Inspect {doc.chunkCount} Knowledge Chunks
                  </button>
                  <button
                    onClick={() => {
                      if (!isSelected) onToggleSelectDoc(doc.id);
                      onNavigate('study');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                  >
                    Open in Study Mode →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document & Picture Chunk Inspector Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-semibold text-white">{inspectingDoc.name}</h3>
                <div className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                  {inspectingDoc.fileType} · {inspectingDoc.pageCount} Sections ·{' '}
                  {inspectingDoc.chunkCount} Indexed RAG Chunks
                </div>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {inspectingDoc.previewImageUrl && (
                <div className="bg-[#090D16] border border-white/10 rounded-xl p-3 space-y-2">
                  <div className="text-xs text-emerald-400 font-mono">
                    Uploaded Study Picture Preview
                  </div>
                  <img
                    src={inspectingDoc.previewImageUrl}
                    alt={inspectingDoc.name}
                    referrerPolicy="no-referrer"
                    className="max-h-72 w-auto mx-auto rounded-lg object-contain"
                  />
                </div>
              )}

              {inspectingDoc.chunks.map((chunk, idx) => (
                <div
                  key={chunk.id}
                  className="bg-[#090D16] border border-white/[0.07] rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-mono tabular-nums">
                    <span>
                      Chunk #{idx + 1} · {chunk.topic}
                    </span>
                    <span>Page / Section {chunk.pageNumber}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{chunk.text}</p>
                  <div className="text-[11px] text-slate-500">
                    Keywords: {chunk.keywords.join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
