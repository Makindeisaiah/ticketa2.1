import React, { useState, useRef, useEffect } from 'react';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Clock,
} from 'lucide-react';
import { checkInTicket } from '../services/organizerService';

interface OrganizerCheckInScannerProps {
  events: any[];
  userId: string;
}

export const OrganizerCheckInScanner: React.FC<OrganizerCheckInScannerProps> = ({
  events,
  userId,
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
  }, [events]);

  const handleVerifyTicket = async (codeToTest?: string) => {
    const code = (codeToTest || ticketInput).trim();
    if (!code) return;
    if (!selectedEventId) {
      alert('Please select an event before scanning tickets.');
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
      ...prev.slice(0, 19),
    ]);
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
        alert('Camera access denied or unequipped. You can use manual code input below.');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-2">
        <div className="flex items-center space-x-2 text-[#00b894] font-extrabold text-xs tracking-wider uppercase">
          <ShieldCheck className="w-4 h-4" />
          <span>Atomic PostgreSQL Check-in Engine</span>
        </div>
        <h2 className="text-2xl font-black text-white">QR Code Scanner &amp; Check-In</h2>
        <p className="text-xs text-slate-400">
          Scans and verifies tickets using Supabase RPC double-scan prevention.
        </p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="text-xs font-bold text-slate-300">Target Event for Scanner:</label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-xl px-4 py-2.5 outline-none cursor-pointer flex-1 max-w-md"
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ({new Date(e.start_time).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {lastResult && (
        <div
          className={`p-6 rounded-3xl border shadow-2xl flex items-center space-x-4 animate-in fade-in zoom-in-95 duration-200 ${
            lastResult.status === 'SUCCESS'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : lastResult.status === 'ALREADY_CHECKED_IN'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {lastResult.status === 'SUCCESS' && <CheckCircle2 className="w-10 h-10 flex-shrink-0 text-emerald-400" />}
          {lastResult.status === 'ALREADY_CHECKED_IN' && <AlertTriangle className="w-10 h-10 flex-shrink-0 text-amber-400" />}
          {lastResult.status !== 'SUCCESS' && lastResult.status !== 'ALREADY_CHECKED_IN' && (
            <XCircle className="w-10 h-10 flex-shrink-0 text-rose-400" />
          )}

          <div>
            <span className="font-mono font-extrabold text-lg block">
              {lastResult.ticket_code ? `Ticket: ${lastResult.ticket_code}` : `Status: ${lastResult.status}`}
            </span>
            <p className="text-xs font-medium">{lastResult.message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="w-full aspect-square bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="space-y-3 p-6">
                <QrCode className="w-16 h-16 text-slate-700 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">
                  Camera inactive. Click below to enable webcam or mobile scanner.
                </p>
              </div>
            )}

            {cameraActive && (
              <div className="absolute inset-0 border-2 border-[#00b894] m-8 rounded-2xl animate-pulse pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-[#00b894] shadow-[0_0_15px_#00b894]" />
              </div>
            )}
          </div>

          <button
            onClick={toggleCamera}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#00b894]" />
            <span>{cameraActive ? 'Stop Camera' : 'Start Live Camera Scanner'}</span>
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Search className="w-4 h-4 text-[#00b894]" />
              <span>Manual Code or QR Payload Entry</span>
            </h3>

            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 font-bold block">
                Enter Ticket Code or QR Payload Hash:
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. TCK-849201 or hash payload"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyTicket()}
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-[#00b894] rounded-xl px-4 py-3 text-[#00b894] font-mono font-bold outline-none"
                />
                <button
                  onClick={() => handleVerifyTicket()}
                  disabled={loading || !ticketInput.trim()}
                  className="bg-[#00b894] hover:bg-[#00a383] text-white font-bold text-xs px-5 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recent Session Scan Logs ({scanHistory.length})
            </h4>

            {scanHistory.length === 0 ? (
              <p className="text-slate-600 text-xs italic">No scans performed in this session yet.</p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {scanHistory.map((sh, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <span className="font-mono font-bold text-white block truncate">{sh.code}</span>
                      <span className="text-[10px] text-slate-400 block">{sh.message}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        sh.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {sh.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
