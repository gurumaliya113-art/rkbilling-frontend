import { useEffect, useRef, useState } from 'react';
import { Camera, X, ScanLine, Check, RefreshCw } from 'lucide-react';
import { Modal, Spinner } from '@/components/ui';
import { readText, extractCodeCandidates } from '@/lib/ocr';

/**
 * Camera OCR scanner. Opens the device camera, captures a frame, reads the
 * printed HK / NO / TL / EXP code via OCR and lets the user confirm before use.
 * Works without any barcode — designed for printed tags.
 *
 * Props: open, onClose, onDetected(code)
 */
export default function CodeScanner({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState('camera'); // camera | reading | review
  const [progress, setProgress] = useState(0);
  const [candidates, setCandidates] = useState([]);
  const [manual, setManual] = useState('');
  const [error, setError] = useState(null);

  // Start / stop camera with the modal
  useEffect(() => {
    if (!open) return undefined;
    setPhase('camera');
    setError(null);
    setCandidates([]);
    setManual('');

    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        setError('Camera nahi khul payi. Permission do ya code neeche type karo.');
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const capture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    setPhase('reading');
    setProgress(0);
    try {
      const text = await readText(canvas, setProgress);
      const found = extractCodeCandidates(text);
      setCandidates(found);
      setPhase('review');
    } catch (e) {
      setError('Padhne me dikkat aayi, dobara try karo.');
      setPhase('camera');
    }
  };

  const use = (code) => {
    stopCamera();
    onDetected(code);
  };

  const retry = () => {
    setPhase('camera');
    setCandidates([]);
    setProgress(0);
  };

  return (
    <Modal open={open} onClose={() => { stopCamera(); onClose(); }} title="Scan Tag (Camera)" size="md">
      <div className="space-y-3">
        {/* Camera view */}
        {phase === 'camera' && (
          <>
            <div className="relative overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} playsInline muted className="h-64 w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-3/4 rounded-lg border-2 border-brand-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
              <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/80">
                Tag ke HK number ko box ke andar rakho
              </div>
            </div>
            {error && <p className="text-sm text-amber-500">{error}</p>}
            <button className="btn-primary w-full" onClick={capture}>
              <Camera size={18} /> Capture &amp; Read
            </button>
          </>
        )}

        {/* OCR in progress */}
        {phase === 'reading' && (
          <div className="flex flex-col items-center gap-3 py-10">
            <ScanLine className="animate-pulse text-brand-500" size={40} />
            <p className="text-sm font-medium">Code padh rahe hain... {progress}%</p>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Review candidates */}
        {phase === 'review' && (
          <div className="space-y-3">
            {candidates.length > 0 ? (
              <>
                <p className="text-sm font-medium">Ye codes mile — sahi wala chuno:</p>
                <div className="space-y-2">
                  {candidates.map((c) => (
                    <button
                      key={c}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left font-mono text-sm hover:border-brand-500 hover:bg-brand-500/5 dark:border-slate-700"
                      onClick={() => use(c)}
                    >
                      {c}
                      <Check size={16} className="text-brand-500" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-amber-500">Koi code clear nahi mila. Dobara scan karo ya neeche type karo.</p>
            )}

            <div>
              <p className="mb-1 text-xs text-slate-400">Ya code khud type/theek karo:</p>
              <div className="flex gap-2">
                <input
                  className="input font-mono"
                  placeholder="HK0765760"
                  value={manual}
                  onChange={(e) => setManual(e.target.value.toUpperCase())}
                />
                <button className="btn-primary" disabled={!manual.trim()} onClick={() => use(manual.trim())}>
                  Use
                </button>
              </div>
            </div>

            <button className="btn-secondary w-full" onClick={retry}>
              <RefreshCw size={16} /> Dobara Scan
            </button>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </Modal>
  );
}
