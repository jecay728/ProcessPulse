import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowDownToLine, ChevronDown, ChevronLeft, ChevronRight, CircleHelp,
  Clock3, FileVideo2, Gauge, Lightbulb, MoreHorizontal, Pause, Play, Plus,
  RotateCcw, Scissors, Settings2, Sparkles, Upload, X,
} from 'lucide-react';

const initialElements = [
  { id: 1, name: 'Pick up component', start: 0.8, end: 3.4, type: 'Value Added', color: 'blue' },
  { id: 2, name: 'Position component in fixture', start: 3.8, end: 7.2, type: 'Value Added', color: 'blue' },
  { id: 3, name: 'Reach for hand tool', start: 7.7, end: 9.1, type: 'Non-Value Added', color: 'amber' },
  { id: 4, name: 'Fasten component', start: 9.5, end: 15.8, type: 'Value Added', color: 'blue' },
  { id: 5, name: 'Inspect assembly', start: 16.4, end: 19.6, type: 'Necessary NVA', color: 'violet' },
];

const formatTime = (seconds = 0) => {
  if (!Number.isFinite(seconds)) return '00:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1).padStart(4, '0');
  return `${String(mins).padStart(2, '0')}:${secs}`;
};

function App() {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoName, setVideoName] = useState('Assembly line — Cycle 01.mp4');
  const [duration, setDuration] = useState(42.4);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elements, setElements] = useState(initialElements);
  const [selectedId, setSelectedId] = useState(2);
  const [notice, setNotice] = useState('');
  const [isRealVideo, setIsRealVideo] = useState(false);

  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

  const totalTime = useMemo(() => elements.reduce((sum, item) => sum + Math.max(0, item.end - item.start), 0), [elements]);
  const vaTime = useMemo(() => elements.filter((item) => item.type === 'Value Added').reduce((sum, item) => sum + Math.max(0, item.end - item.start), 0), [elements]);
  const nvaPercent = totalTime ? Math.round((1 - vaTime / totalTime) * 100) : 0;
  const selected = elements.find((item) => item.id === selectedId) || elements[0];

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 2800);
    return () => clearTimeout(timer);
  }, [notice]);

  const onFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setNotice('Please choose a video file.');
      return;
    }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoName(file.name);
    setIsRealVideo(true);
    setCurrentTime(0);
    setPlaying(false);
    setNotice('Video loaded locally in your browser.');
  };

  const togglePlay = async () => {
    if (!isRealVideo || !videoRef.current) {
      setPlaying((value) => !value);
      return;
    }
    if (videoRef.current.paused) {
      try { await videoRef.current.play(); } catch { setNotice('Video playback could not start.'); }
    } else videoRef.current.pause();
  };

  const seek = (value) => {
    const time = Math.max(0, Math.min(Number(value) || 0, duration || 0));
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
  };

  const stepFrame = (direction) => {
    const fps = 30;
    seek(currentTime + direction / fps);
  };

  const addElement = (suggested = false) => {
    const start = suggested ? Math.max(0, currentTime) : currentTime;
    const end = Math.min(duration || start + 2, start + 2);
    const item = {
      id: Date.now(),
      name: suggested ? 'Review suggested action' : 'New process element',
      start,
      end: Math.max(start + 0.2, end),
      type: 'Unclassified',
      color: 'gray',
    };
    setElements((items) => [...items, item].sort((a, b) => a.start - b.start));
    setSelectedId(item.id);
    if (suggested) setNotice('Draft suggestion added — confirm the action and timing.');
  };

  const updateElement = (id, field, value) => {
    setElements((items) => items.map((item) => {
      if (item.id !== id) return item;
      if (field === 'start' || field === 'end') return { ...item, [field]: Math.max(0, Number(value) || 0) };
      return { ...item, [field]: value };
    }));
  };

  const removeElement = (id) => {
    setElements((items) => items.filter((item) => item.id !== id));
    if (selectedId === id) setSelectedId(elements.find((item) => item.id !== id)?.id ?? null);
  };

  const exportCsv = () => {
    const rows = [['Process element', 'Start (seconds)', 'End (seconds)', 'Duration (seconds)', 'Classification'], ...elements.map((e) => [e.name, e.start.toFixed(2), e.end.toFixed(2), Math.max(0, e.end - e.start).toFixed(2), e.type])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'processpulse-time-study.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice('Study exported as CSV.');
  };

  const generateSuggestions = () => {
    addElement(true);
  };

  const timelinePosition = (seconds) => `${duration ? (seconds / duration) * 100 : 0}%`;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="ProcessPulse home"><span className="brand-mark"><Activity size={19} strokeWidth={2.7} /></span><span>process<span className="brand-light">pulse</span></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-switch"><span className="workspace-icon">M</span><span className="workspace-copy"><b>Manufacturing</b><small>Personal workspace</small></span><ChevronDown size={15} /></button>
        <div className="nav-label">STUDY</div>
        <button className="nav-item active"><Gauge size={17} />Time study</button>
        <button className="nav-item" onClick={() => setNotice('Study history will be available in a future version.')}><Clock3 size={17} />Study history</button>
        <div className="sidebar-bottom"><div className="help-card"><span className="help-icon"><CircleHelp size={17} /></span><b>Need a hand?</b><p>Learn how to run your first time study.</p><button onClick={() => setNotice('Help guide coming soon.')}>View quick guide <ChevronRight size={14} /></button></div><div className="profile"><span className="avatar">JC</span><span><b>J. Chen</b><small>Time study analyst</small></span><MoreHorizontal size={19} /></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumb"><span>Studies</span><ChevronRight size={14} /><b>New time study</b></div><div className="top-actions"><span className="saved-status"><span /> All changes saved</span><button className="icon-button" title="Settings" onClick={() => setNotice('Study settings coming soon.')}><Settings2 size={18} /></button><button className="export-button" onClick={exportCsv}><ArrowDownToLine size={16} />Export study</button></div></header>
        <section className="page-heading"><div><div className="eyebrow">TIME STUDY <span>•</span> DRAFT</div><h1>Assembly — Final fastening</h1><p className="subtitle">Capture and analyze each element of the work cycle.</p></div><button className="more-button" aria-label="More options"><MoreHorizontal /></button></section>

        <section className="study-summary"><div className="summary-title"><span className="summary-icon"><Clock3 size={17} /></span><div><h2>Cycle overview</h2><p>One observed cycle <span>·</span> Workstation 04</p></div></div><div className="summary-metrics"><div><span className="metric-label">CYCLE TIME</span><b>{formatTime(totalTime)}</b></div><div><span className="metric-label">PROCESS ELEMENTS</span><b>{String(elements.length).padStart(2, '0')}</b></div><div><span className="metric-label">NON-VALUE ADDED</span><b>{nvaPercent}<small>%</small></b></div></div><button className="summary-edit" onClick={() => setNotice('Study details editor coming soon.')}>Edit details <ChevronRight size={15} /></button></section>

        <div className="work-grid">
          <section className="panel video-panel">
            <div className="panel-heading"><div><h2>Video review</h2><p>Review the cycle and mark each process element.</p></div><button className="subtle-icon" title="Video options" onClick={() => fileInputRef.current?.click()}><MoreHorizontal size={19} /></button></div>
            <input ref={fileInputRef} className="visually-hidden" type="file" accept="video/*" onChange={(e) => onFile(e.target.files?.[0])} />
            {videoUrl && <video ref={videoRef} className="native-video" src={videoUrl} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)} onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />}
            {!videoUrl && <div className="video-stage"><div className="stage-grid" /><div className="stage-label"><span className="live-dot" />CYCLE 01 <span>·</span> STATION 04</div><div className="machine machine-left"><div className="machine-screen" /><div className="machine-line" /><div className="machine-base" /></div><div className="workbench"><div className="bench-top" /><div className="bench-leg left" /><div className="bench-leg right" /></div><div className="worker"><div className="worker-head" /><div className="worker-body" /><div className="worker-arm" /><div className="worker-leg leg-left" /><div className="worker-leg leg-right" /></div><div className="component"><div /></div><div className="stage-stamp">PREVIEW MODE <span>·</span> UPLOAD A VIDEO</div><button className="center-play" onClick={() => fileInputRef.current?.click()} aria-label="Upload video"><Upload size={19} /></button></div>}
            <div className="video-controls"><button className="control-plain" onClick={() => seek(0)} title="Restart"><RotateCcw size={16} /></button><button className="control-plain" onClick={() => stepFrame(-1)} title="Previous frame"><ChevronLeft size={17} /><span className="tiny-frame">1f</span></button><button className="play-button" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button><button className="control-plain" onClick={() => stepFrame(1)} title="Next frame"><span className="tiny-frame">1f</span><ChevronRight size={17} /></button><span className="video-time"><b>{formatTime(currentTime)}</b><span> / {formatTime(duration)}</span></span><button className="control-plain speed-control" onClick={() => setNotice('Playback speed controls coming soon.')}>1×</button><button className="control-plain" onClick={() => fileInputRef.current?.click()} title="Upload video"><Upload size={16} /></button></div>
            <div className="seek-wrap"><input aria-label="Video position" type="range" min="0" max={duration || 1} step="0.01" value={Math.min(currentTime, duration || 0)} onChange={(e) => seek(e.target.value)} /><div className="seek-track"><div className="seek-fill" style={{ width: timelinePosition(currentTime) }} /></div></div>
            <div className="video-file-row"><div className="file-info"><span className="file-icon"><FileVideo2 size={17} /></span><span><b>{videoName}</b><small>{isRealVideo ? 'Local video · stored in this browser session' : 'Sample study · upload your video to begin'}</small></span></div><button className="text-button" onClick={() => fileInputRef.current?.click()}>{isRealVideo ? 'Replace video' : 'Upload video'} <Upload size={14} /></button></div>
            <button className="drop-hint" onClick={() => fileInputRef.current?.click()}><Upload size={15} /><span>Choose a video from your device</span><span className="hint-format">MP4, MOV, WebM</span></button>
          </section>

          <section className="panel elements-panel">
            <div className="panel-heading elements-title-row"><div><h2>Process elements <span className="count-pill">{elements.length}</span></h2><p>Break the cycle into observable actions.</p></div><button className="add-button" onClick={() => addElement()}><Plus size={16} />Add element</button></div>
            <div className="element-list-head"><span>ELEMENT</span><span>START</span><span>END</span><span>TYPE</span><span /></div>
            <div className="element-list">
              {elements.map((item, index) => <div key={item.id} className={`element-row ${selectedId === item.id ? 'selected' : ''}`} onClick={() => setSelectedId(item.id)}>
                <div className="element-name-cell"><span className={`element-number ${item.color}`}>{String(index + 1).padStart(2, '0')}</span><input aria-label="Process element name" value={item.name} onClick={(e) => e.stopPropagation()} onChange={(e) => updateElement(item.id, 'name', e.target.value)} /></div>
                <input className="time-input" aria-label="Start time in seconds" type="number" min="0" step="0.1" value={item.start.toFixed(1)} onClick={(e) => e.stopPropagation()} onChange={(e) => updateElement(item.id, 'start', e.target.value)} />
                <input className="time-input" aria-label="End time in seconds" type="number" min="0" step="0.1" value={item.end.toFixed(1)} onClick={(e) => e.stopPropagation()} onChange={(e) => updateElement(item.id, 'end', e.target.value)} />
                <select className={`type-select ${item.color}`} aria-label="Classification" value={item.type} onClick={(e) => e.stopPropagation()} onChange={(e) => updateElement(item.id, 'type', e.target.value)}><option>Value Added</option><option>Non-Value Added</option><option>Necessary NVA</option><option>Unclassified</option></select>
                <button className="row-more" aria-label={`Delete ${item.name}`} onClick={(e) => { e.stopPropagation(); removeElement(item.id); }}><X size={15} /></button>
              </div>)}
              {elements.length === 0 && <div className="empty-elements">No elements yet. Add one or ask for a suggestion.</div>}
            </div>
            <button className="suggestion-button" onClick={generateSuggestions}><span className="sparkle-icon"><Sparkles size={16} /></span><span><b>Suggest process elements</b><small>AI-assisted suggestions are drafts to review</small></span><ChevronRight size={16} /></button>
            <div className="selected-detail"><div className="detail-top"><span className="detail-kicker">SELECTED ELEMENT</span><button className="subtle-icon" onClick={() => selected && removeElement(selected.id)} title="Remove selected element"><Scissors size={15} /></button></div>{selected ? <><div className="detail-name"><span className={`detail-dot ${selected.color}`} /><b>{selected.name}</b></div><div className="detail-fields"><label>START TIME <div className="detail-input-wrap"><input type="number" min="0" step="0.1" value={selected.start.toFixed(1)} onChange={(e) => updateElement(selected.id, 'start', e.target.value)} /><span>sec</span><button title="Set start to current video time" onClick={() => updateElement(selected.id, 'start', currentTime)}>Set current</button></div></label><label>END TIME <div className="detail-input-wrap"><input type="number" min="0" step="0.1" value={selected.end.toFixed(1)} onChange={(e) => updateElement(selected.id, 'end', e.target.value)} /><span>sec</span><button title="Set end to current video time" onClick={() => updateElement(selected.id, 'end', currentTime)}>Set current</button></div></label></div><div className="duration-note"><Clock3 size={14} /> Element duration <b>{Math.max(0, selected.end - selected.start).toFixed(1)} sec</b><button title="Jump to element start" onClick={() => seek(selected.start)}>Go to start</button></div></> : <p className="no-selection">Select an element to edit details.</p>}</div>
          </section>
        </div>

        <section className="panel timeline-panel"><div className="panel-heading timeline-heading"><div><h2>Cycle timeline</h2><p>Click a segment to review that process element.</p></div><button className="timeline-menu" onClick={() => setNotice('Timeline settings coming soon.')}><Settings2 size={16} />Timeline settings</button></div><div className="timeline-ruler"><span>00:00</span><span>00:10</span><span>00:20</span><span>00:30</span><span>{formatTime(duration)}</span></div><div className="timeline-content"><div className="timeline-name"><span className="timeline-lane-mark" />Work cycle</div><div className="timeline-track"><div className="track-grid"><i /><i /><i /><i /><i /></div>{elements.map((item, index) => <button key={item.id} className={`timeline-segment ${item.color} ${selectedId === item.id ? 'active' : ''}`} style={{ left: timelinePosition(item.start), width: `${Math.max(1.7, ((item.end - item.start) / (duration || 1)) * 100)}%` }} title={`${item.name}: ${formatTime(item.start)}–${formatTime(item.end)}`} onClick={() => { setSelectedId(item.id); seek(item.start); }}><span>{index + 1}. {item.name}</span></button>)}<div className="playhead" style={{ left: timelinePosition(currentTime) }}><span /></div></div></div><div className="timeline-footer"><span><i className="legend-dot blue" />Value added</span><span><i className="legend-dot amber" />Non-value added</span><span><i className="legend-dot violet" />Necessary NVA</span><span><i className="legend-dot gray" />Unclassified</span><button onClick={() => seek(currentTime + 1)}><Plus size={13} />Mark at playhead</button></div></section>

        <footer className="page-footer"><span><Lightbulb size={15} /> Video is processed locally for preview; uploaded files are not sent to a server.</span><span>PROCESSPULSE <i>•</i> TIME STUDY WORKSPACE</span></footer>
      </main>
      {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
    </div>
  );
}

export default App;
