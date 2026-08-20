'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

const TEACHING_ROLES = ['MONITOR', 'INSTRUTOR', 'PROFESSOR', 'CONTRAMESTRE', 'MESTRE', 'ADMIN'];

export default function ScanPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isStaff = role && TEACHING_ROLES.includes(role);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="text-2xl font-bold">Class check-in</h1>
      {isStaff && <StaffQrDisplay />}
      <StudentScanner />
    </div>
  );
}

function StaffQrDisplay() {
  const [qr, setQr] = useState<{ dataUrl: string; cityName: string; expiresAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/qrcode/today')
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || 'Failed to load QR');
        return r.json();
      })
      .then(setQr)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="card text-center">
      <h2 className="mb-2 font-semibold">Today's class QR code</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {qr ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr.dataUrl} alt="Today's attendance QR code" className="mx-auto" />
          <p className="mt-2 text-sm text-neutral-600">{qr.cityName} — display this for students to scan</p>
        </>
      ) : (
        !error && <p className="text-sm text-neutral-500">Loading…</p>
      )}
    </div>
  );
}

function StudentScanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    let scanner: any;
    let cancelled = false;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled || !containerRef.current) return;
      scanner = new Html5Qrcode(containerRef.current.id);
      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 220 },
          (decodedText: string) => submitToken(decodedText),
          () => {}
        )
        .catch(() => {
          // Camera unavailable (e.g. no permission, or desktop without camera) —
          // the manual token entry field below still works.
        });
    });

    return () => {
      cancelled = true;
      if (scanner) scanner.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitToken(token: string) {
    setStatus({ type: 'idle' });
    const res = await fetch('/api/attendance/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const body = await res.json();
    if (!res.ok) {
      setStatus({ type: 'error', message: body.error || 'Check-in failed.' });
    } else {
      setStatus({ type: 'success', message: body.message || 'Checked in!' });
    }
  }

  return (
    <div className="card">
      <h2 className="mb-2 font-semibold">Scan today's QR code</h2>
      <div id="qr-reader" ref={containerRef} className="mx-auto w-full max-w-xs" />
      <div className="mt-4">
        <label className="label">Or enter the code manually</label>
        <div className="flex gap-2">
          <input className="input" value={manualToken} onChange={(e) => setManualToken(e.target.value)} />
          <button className="btn-secondary shrink-0" onClick={() => submitToken(manualToken)}>
            Check in
          </button>
        </div>
      </div>
      {status.type === 'success' && <p className="mt-3 text-sm text-green-600">{status.message}</p>}
      {status.type === 'error' && <p className="mt-3 text-sm text-red-600">{status.message}</p>}
    </div>
  );
}
