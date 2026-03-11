export async function checkHealth() {
  const r = await fetch('/api/health');
  return r.json();
}

export async function transcribeFile(file) {
  const fd = new FormData();
  fd.append('audio', file);
  const r = await fetch('/api/transcribe', { method: 'POST', body: fd });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || `Error ${r.status}`);
  return d.transcript;
}

export async function transcribeBlob(blob, mimeType) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const r = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: reader.result, mimeType }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `Error ${r.status}`);
        resolve(d.transcript);
      } catch (e) { reject(e); }
    };
    reader.onerror = () => reject(new Error('Read error'));
    reader.readAsDataURL(blob);
  });
}

export async function analyzeTranscript(transcript) {
  const r = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || `Error ${r.status}`);
  return d;
}
