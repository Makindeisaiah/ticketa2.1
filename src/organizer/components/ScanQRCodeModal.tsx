import React, { useState, useRef, useEffect } from 'react';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Search,
  X,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { checkInTicket } from '../services/organizerService';

interface ScanQRCodeModalProps {
  events: any[];
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onCheckInSuccess?: () => void;
}

export const ScanQRCodeModal: React.FC<ScanQRCodeModalProps> = ({
  events = [],
  userId,
  isOpen,
  onClose,
  onCheckInSuccess,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [ticketInput, setTicketInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    status: string;
    message: string;
    ticket_code?: string;
  } | null>(null);

  const [scanHistory, setScanHistory] = useState<
    {
      code: string;
      status: string;
      time: string;
      message: string;
    }[]
  >([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  // Clean up camera stream
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleVerifyTicket = async (codeToTest?: string) => {
    const code = (codeToTest || ticketInput).trim();
    if (!code) return;
    if (!selectedEventId) {
      alert('Please select an event before verifying tickets.');
      return;
    }

    setLoading(true);
    setLastResult(null);

    const res = await checkInTicket(code, selectedEventId, userId);
    setLoading(false);
    setLastResult(res);
    setTicketInput('');

    setScanHistory((prev) => [
      {
        code: res.ticket_code || code,
        status: res.status,
        time: new Date().toLocaleTimeString(),
        message: res.message,
      },
      ...prev.slice(0, 9),
    ]);

    if (res.success && onCheckInSuccess) {
      onCheckInSuccess();
    }
  };

  const toggleCamera = async () => {
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } catch (err) {
        alert('Camera preview unavailable or permission denied. Please use the quick ticket code search below.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="scan-qr-code-modal-dialog"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#e6faf5] text-[#00b894] flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Scan QR Code Ticket</h3>
              <p className="text-xs text-slate-500 font-medium">
                Instant optical badge scanning &amp; verification
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
              }
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Target Event Selector */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-xs font-bold text-slate-700">Target Event:</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 font-bold text-xs rounded-xl px-3.5 py-2 outline-hidden cursor-pointer flex-1 max-w-md focus:border-[#00b894]"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          {/* Camera Scanner Viewport */}
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center justify-center min-h-[220px] p-4 text-center">
            {cameraActive ? (
              <div className="relative w-full h-56 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute inset-0 border-2 border-[#00b894] rounded-xl pointer-events-none animate-pulse flex items-center justify-center">
                  <div className="w-36 h-36 border-2 border-white/60 rounded-lg" />
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <QrCode className="w-12 h-12 text-slate-600 mx-auto animate-bounce" />
                <p className="text-xs font-bold text-slate-300">
                  Camera feed currently paused
                </p>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="px-4 py-2 bg-[#00b894] hover:bg-[#00a383] text-white text-xs font-extrabold rounded-xl shadow-md transition-all inline-flex items-center space-x-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Activate Camera Scanner</span>
                </button>
              </div>
            )}

            {cameraActive && (
              <button
                type="button"
                onClick={toggleCamera}
                className="mt-3 px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Stop Camera
              </button>
            )}
          </div>

          {/* Quick Code Entry Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyTicket();
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="Or type/paste Ticket Code (e.g. TKT-DF92K-REG-1)..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#00b894]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !ticketInput.trim()}
              className="px-5 py-2.5 bg-[#00b894] hover:bg-[#00a383] text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Verify &amp; Admit</span>
            </button>
          </form>

          {/* Verification Status Result */}
          {lastResult && (
            <div
              className={`p-4 rounded-2xl border flex items-center space-x-3.5 animate-in fade-in duration-200 ${
                lastResult.status === 'SUCCESS'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : lastResult.status === 'ALREADY_CHECKED_IN'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {lastResult.status === 'SUCCESS' && (
                <CheckCircle2 className="w-7 h-7 flex-shrink-0 text-[#00b894]" />
              )}
              {lastResult.status === 'ALREADY_CHECKED_IN' && (
                <AlertTriangle className="w-7 h-7 flex-shrink-0 text-amber-500" />
              )}
              {lastResult.status !== 'SUCCESS' && lastResult.status !== 'ALREADY_CHECKED_IN' && (
                <XCircle className="w-7 h-7 flex-shrink-0 text-rose-500" />
              )}

              <div>
                <span className="font-mono font-black text-sm block">
                  {lastResult.ticket_code ? `Ticket: ${lastResult.ticket_code}` : `Status: ${lastResult.status}`}
                </span>
                <p className="text-xs font-semibold mt-0.5">{lastResult.message}</p>
              </div>
            </div>
          )}

          {/* Recent Scans */}
          {scanHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Recent Scanned Badges
              </h4>
              <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
                {scanHistory.map((s, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-800">{s.code}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        s.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.status === 'ALREADY_CHECKED_IN'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
