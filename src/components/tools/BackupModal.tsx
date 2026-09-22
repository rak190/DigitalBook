import React, { useState, useRef } from 'react';
import { StorageService } from '../../services/storage';
import { Download, Upload, Trash2, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';

interface BackupModalProps {
  onClose: () => void;
  onDataImported: () => void;
  onDataReset: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  onClose,
  onDataImported,
  onDataReset,
}) => {
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    try {
      const json = StorageService.exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `english_file_preint_study_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: 'Backup downloaded successfully!' });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: `Export failed: ${e.message}` });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        const res = StorageService.importData(text);
        if (res.success) {
          setStatusMsg({ type: 'success', text: res.message });
          onDataImported();
          setTimeout(onClose, 1200);
        } else {
          setStatusMsg({ type: 'error', text: res.message });
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const handleResetAll = () => {
    StorageService.clearAllData();
    onDataReset();
    setShowResetConfirm(false);
    setStatusMsg({ type: 'success', text: 'All local study data was reset.' });
    setTimeout(onClose, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slateDark-900 border border-slate-700 rounded-2xl shadow-2xl p-5 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-sky-400" />
            Backup & Study Progress
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          {/* Export button */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-850/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">Export Progress</span>
              <span className="text-[11px] text-slate-400">Save all typed answers, bookmarks & notes to JSON</span>
            </div>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>

          {/* Import button */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-850/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">Import Progress</span>
              <span className="text-[11px] text-slate-400">Restore answers from a previous backup file</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              Select File
            </button>
          </div>

          {/* Reset progress */}
          {!showResetConfirm ? (
            <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-red-300 block">Reset Progress</span>
                <span className="text-[11px] text-red-400/80">Wipe all your answers and start fresh</span>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600/80 hover:bg-red-600 text-white flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 space-y-2">
              <div className="flex items-center gap-2 text-red-300 text-xs font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>Are you completely sure?</span>
              </div>
              <p className="text-[11px] text-red-200 leading-relaxed">
                This will clear all typed answers, notes, and bookmarks saved on this computer.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleResetAll}
                  className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white shadow"
                >
                  Yes, Wipe All Data
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {statusMsg && (
            <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
