import React, { useState, useRef } from 'react';
import { mediaDB } from '../../services/storage';
import { Upload, CheckCircle2, AlertCircle, X, FileAudio } from 'lucide-react';

interface AudioUploadModalProps {
  currentTrackId?: string;
  onClose: () => void;
  onUploadSuccess: (trackId: string) => void;
}

export const AudioUploadModal: React.FC<AudioUploadModalProps> = ({
  currentTrackId = '',
  onClose,
  onUploadSuccess,
}) => {
  const [trackIdInput, setTrackIdInput] = useState(currentTrackId);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.type.includes('audio') || dropped.name.endsWith('.mp3')) {
        setFile(dropped);
        if (!trackIdInput) {
          setTrackIdInput(dropped.name.replace(/\.[^/.]+$/, ''));
        }
      } else {
        setErrorMsg('Please upload an audio file (.mp3, .wav, .m4a)');
      }
    }
  };

  const handleSave = async () => {
    if (!file) {
      setErrorMsg('Please select an audio file to upload.');
      return;
    }
    const cleanId = trackIdInput.trim() || 'custom-track';
    setStatus('uploading');

    try {
      await mediaDB.saveCustomAudio(cleanId, file);
      setStatus('success');
      setTimeout(() => {
        onUploadSuccess(cleanId);
        onClose();
      }, 1000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to save audio file to local storage.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slateDark-900 border border-slate-700 rounded-2xl shadow-2xl p-5 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-sm">Upload Authentic MP3</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Track ID / Filename
            </label>
            <input
              type="text"
              value={trackIdInput}
              onChange={(e) => setTrackIdInput(e.target.value)}
              placeholder="e.g. 1.2 or ef3e_p-int_01a_1-2"
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-sky-500"
            />
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-sky-500/70 rounded-xl p-6 text-center cursor-pointer bg-slate-800/40 hover:bg-slate-800/60 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                  if (!trackIdInput) {
                    setTrackIdInput(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                  }
                }
              }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold">
                <FileAudio className="w-5 h-5" />
                <span className="truncate max-w-[200px]">{file.name}</span>
              </div>
            ) : (
              <div className="space-y-1 text-slate-400">
                <Upload className="w-6 h-6 mx-auto text-slate-500 mb-2" />
                <p className="text-xs font-medium text-slate-200">
                  Drop audio file here, or <span className="text-sky-400">browse</span>
                </p>
                <p className="text-[11px] text-slate-500">Supports MP3, WAV, M4A</p>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {status === 'success' && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Track saved locally to IndexedDB!</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={status === 'uploading' || !file}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 transition-colors shadow-md shadow-sky-600/20"
          >
            {status === 'uploading' ? 'Saving...' : 'Save Track'}
          </button>
        </div>
      </div>
    </div>
  );
};
