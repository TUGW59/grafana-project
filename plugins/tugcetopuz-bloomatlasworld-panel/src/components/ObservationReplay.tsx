import React, { useEffect, useRef, useState } from 'react';
import { replayUrl, readReplay } from '../utils/replayProtocol';

interface Props { ids: string[]; onSelect: (id: string) => void; }
export function ObservationReplay({ ids, onSelect }: Props) {
  const [status, setStatus] = useState('Ready');
  const [received, setReceived] = useState(0);
  const [running, setRunning] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const history = useRef<string[]>([]);
  // Filtre veya sekme değişirse önceki bağlantı kapanır; statik harita korunur.
  const disconnect = () => { const current = ws.current; ws.current = null; current?.close(); };
  useEffect(() => () => { const current = ws.current; ws.current = null; current?.close(); }, []);
  const pause = () => { disconnect(); setRunning(false); setStatus('Paused'); };
  const reset = () => { disconnect(); history.current = []; setReceived(0); setRunning(false); setStatus('Ready'); };
  const play = () => {
    if (ws.current) { return; }
    const url = replayUrl(window.location.host, ids, history.current.length);
    if (!url) { setStatus('Replay available only on the local 3400 preview'); return; }
    try {
      const socket = new WebSocket(url);
      ws.current = socket; setRunning(true); setStatus('Connecting…');
      socket.onopen = () => { if (ws.current === socket) { setStatus('Connected · historical replay'); } };
      socket.onmessage = event => {
        if (ws.current !== socket) { return; }
        const message = readReplay(event.data, ids, history.current);
        if (!message) { disconnect(); setRunning(false); setStatus('Invalid event · static snapshot retained'); return; }
        if (message.type === 'complete') { disconnect(); setRunning(false); setStatus('Replay complete'); return; }
        history.current = [...history.current, message.id]; setReceived(history.current.length); onSelect(message.id);
      };
      socket.onerror = () => { if (ws.current === socket) { disconnect(); setRunning(false); setStatus('Connection unavailable · resume to retry'); } };
      socket.onclose = () => { if (ws.current === socket) { ws.current = null; setRunning(false); setStatus('Disconnected · resume to retry'); } };
    } catch { setRunning(false); setStatus('Connection unavailable · static snapshot retained'); }
  };
  return <section aria-label="Observation replay" style={{border:'1px solid #cbd4c7', borderRadius:8, padding:12, background:'#fffdf7'}}>
    <h2 style={{fontSize:18, marginTop:0}}>Observation Replay</h2>
    <p style={{fontSize:13}}>Historical observations streamed via WebSocket. Not live field observations.</p>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
      <button type="button" disabled={running || received === ids.length} onClick={play} style={{padding:'7px 12px',background:'#315f45',color:'white',borderRadius:6}}>{received ? 'Resume' : 'Play'}</button>
      <button type="button" disabled={!running} onClick={pause} style={{padding:'7px 12px'}}>Pause</button>
      <button type="button" onClick={reset} style={{padding:'7px 12px'}}>Reset</button>
      <progress aria-label="Replay progress" max={ids.length} value={received}/><span>{received} / {ids.length}</span>
    </div>
    <p role="status" style={{fontSize:12,marginBottom:0}}>{status}</p>
  </section>;
}
