import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowUpRight, BookOpen, FileSearch, MessageCircle, Plus, Square, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { GREEN_TEXTILE_DEMO, getGreenTextileDemoState, isGreenTextileUser } from '../demo/greenTextileDemo';
import './AssistantChat.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const mascot = '/mascots/eko.png';
const screens = { '/dashboard': 'Ana Sayfa', '/integration': 'Veri Entegrasyonu', '/tsrs-report': 'Raporlama Merkezi', '/simulator': 'g-ROI Simülatörü', '/bank/dashboard': 'Kredi Tahsis' };
const suggestions = [
  { icon: FileSearch, text: 'Belgelerimi nerede bulabilirim?' },
  { icon: BookOpen, text: 'Kapsam 1 ve Kapsam 2 ne demek?' },
  { icon: MessageCircle, text: 'Bu ekranda neler yapabilirim?' },
];

function demoContext(user) {
  if (!isGreenTextileUser(user)) return undefined;
  const state = getGreenTextileDemoState();
  return {
    documents: GREEN_TEXTILE_DEMO.sourceDocuments.filter(doc => state.documentsImported || state.loaded || state.documents?.[doc.id]).map(doc => ({
      title: `${doc.title} (${doc.fileName})`,
      status: state.documents?.[doc.id]?.status || 'Demo kaynak paketinde',
      detail: doc.detail,
    })),
    report_generated: Boolean(state.tsrsReportGenerated),
    report: state.tsrsReportGenerated ? GREEN_TEXTILE_DEMO.reportMarkdown : '',
  };
}

export default function AssistantChat({ currentUser }) {
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retryHistory, setRetryHistory] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const requestRef = useRef(null);
  const mounted = useRef(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isDemo = isGreenTextileUser(currentUser);
  const allowedRoutes = Object.keys(screens).filter(path => path.startsWith('/bank') === (currentUser?.role === 'bank'));
  const screen = screens[location.pathname] || (currentUser?.role === 'bank' ? 'Başvuru ayrıntıları' : 'Şirket paneli');

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; requestRef.current?.abort(); };
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = event => { if (event.key === 'Escape') { setOpen(false); launcherRef.current?.focus(); } };
    window.addEventListener('keydown', closeOnEscape);
    if (window.matchMedia('(min-width: 761px)').matches) inputRef.current?.focus();
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);
  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy, error, open]);

  const visit = path => {
    if (!allowedRoutes.includes(path)) return;
    navigate(path);
    setOpen(false);
  };

  const send = async (question = draft, retry = null) => {
    if (requestRef.current || (!retry && !question.trim())) return;
    const history = retry || [...messages, { role: 'user', content: question.trim() }];
    if (!retry) { setMessages(history); setDraft(''); }
    setError(''); setRetryHistory(history); setBusy(true);
    const controller = new AbortController();
    requestRef.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 100000);
    try {
      const response = await fetch(`${API_URL}/api/assistant/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({
          ticker: currentUser.companyTicker, portal: currentUser.role === 'bank' ? 'bank' : 'kobi',
          page: location.pathname, reporting_year: new Date().getFullYear() - 1,
          messages: history.slice(-12).map(({ role, content }) => ({ role, content: content.slice(0, 5000) })),
          demo: demoContext(currentUser),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Yanıt alınamadı. Lütfen tekrar deneyin.');
      if (!data.answer) throw new Error('Boş bir yanıt geldi. Tekrar deneyebilirsiniz.');
      if (!mounted.current) return;
      setMessages([...history, { role: 'assistant', content: data.answer, sources: data.sources || [] }]);
      setRetryHistory(null);
    } catch (err) {
      if (!mounted.current) return;
      setError(err.name === 'AbortError' ? (timedOut ? 'Yanıt beklenenden uzun sürdü. Yeniden deneyebilirsiniz.' : 'Yanıt durduruldu.') : err.message === 'Failed to fetch' ? 'Sunucuya ulaşılamıyor. Backend bağlantısını kontrol edip yeniden deneyin.' : err.message);
    } finally {
      window.clearTimeout(timeout);
      requestRef.current = null;
      if (mounted.current) setBusy(false);
    }
  };

  if (!currentUser?.companyTicker) return null;
  return createPortal(
    <div className="eko-assistant">
      <AnimatePresence>
      {open && <motion.section id="eko-chat" className="eko-chat" role="dialog" aria-label="Eko uygulama yardımcısı"
        initial={{ opacity: 0, y: reducedMotion ? 0 : 20, scale: reducedMotion ? 1 : 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reducedMotion ? 0 : 12, scale: reducedMotion ? 1 : 0.98 }}
        transition={{ duration: reducedMotion ? 0 : 0.22, ease: 'easeOut' }}>
        <header className="eko-chat-header">
          <div className="eko-avatar"><img src={mascot} alt="" /></div>
          <div className="eko-header-copy"><strong>Eko <span>YARDIMCINIZ</span></strong><small>Belgeler, raporlar ve bir sonraki adım.</small></div>
          <button type="button" className="eko-icon-button" title="Yeni sohbet" aria-label="Yeni sohbet" disabled={busy} onClick={() => { setMessages([]); setError(''); setRetryHistory(null); }}><Plus size={18} /></button>
          <button type="button" className="eko-icon-button" aria-label="Sohbeti kapat" onClick={() => { setOpen(false); launcherRef.current?.focus(); }}><X size={19} /></button>
        </header>
        <div className="eko-context"><span className="eko-context-dot" /> {screen}<span>{isDemo ? 'Demo şirket' : currentUser.companyTicker}</span></div>
        <div ref={scrollRef} className="eko-conversation" role="log" aria-live="polite" aria-relevant="additions text" aria-busy={busy}>
          {!messages.length && <div className="eko-welcome">
            <img src={mascot} alt="El sallayan yapraklı Eko maskotu" />
            <span className="eko-eyebrow">BİRLİKTE BAKALIM</span>
            <h2>Merhaba, ben Eko.</h2>
            <p>Bir belge mi arıyorsunuz, raporda bir terime mi takıldınız? Buradayım.</p>
            <div className="eko-suggestions">{suggestions.map(({ icon: Icon, text }) => <button type="button" key={text} onClick={() => send(text)}><Icon size={16} /><span>{text}</span><ArrowUpRight size={15} /></button>)}</div>
          </div>}
          {messages.map((message, index) => <motion.article key={index} className={`eko-message eko-message--${message.role}`}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.25 }}>
            <span className="eko-message-author">{message.role === 'user' ? 'Siz' : 'Eko'}</span>
            <div className="eko-message-body"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              a: ({ children, href }) => allowedRoutes.includes(href) ? <button type="button" className="eko-inline-link" onClick={() => visit(href)}>{children}<ArrowUpRight size={12} /></button> : <span>{children}</span>,
              img: ({ alt }) => <span>{alt || ''}</span>,
              table: ({ children }) => <div className="eko-table-scroll"><table>{children}</table></div>,
            }}>{message.content}</ReactMarkdown></div>
            {!!message.sources?.length && <div className="eko-sources"><small>İlgili ekranlar</small>{message.sources.filter(source => allowedRoutes.includes(source.url)).map((source, i) => <button type="button" key={i} onClick={() => visit(source.url)}><BookOpen size={12} />{source.title}<ArrowUpRight size={12} /></button>)}</div>}
          </motion.article>)}
          {busy && <div className="eko-thinking" role="status"><span /><span /><span /><small>Eko kaynaklara bakıyor…</small></div>}
          {error && <div className="eko-error" role="alert"><p>{error}</p>{retryHistory && <button type="button" onClick={() => send('', retryHistory)}>Yeniden dene</button>}</div>}
        </div>
        <form className="eko-composer" onSubmit={event => { event.preventDefault(); send(); }}>
          <label htmlFor="eko-question" className="eko-sr-only">Eko'ya sorun</label>
          <textarea id="eko-question" ref={inputRef} rows={2} maxLength={2000} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Bir belge, işlem ya da terim sorun…" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && window.matchMedia('(min-width: 761px)').matches) { event.preventDefault(); send(); } }} />
          {busy ? <button className="eko-send" type="button" aria-label="Yanıtı durdur" onClick={() => requestRef.current?.abort()}><Square size={16} /></button> : <button className="eko-send" type="submit" aria-label="Mesajı gönder" disabled={!draft.trim()}><ArrowUp size={20} /></button>}
        </form>
        <p className="eko-footnote">{isDemo ? 'Yeşil Tekstil belgeleri sentetik demo verisidir.' : 'Yanıtlar yapay zekâ ile hazırlanır; kaynaklarla karşılaştırın.'}</p>
      </motion.section>}
      </AnimatePresence>
      <button ref={launcherRef} type="button" className={`eko-launcher ${open ? 'is-open' : ''}`} aria-label={open ? 'Eko sohbetini kapat' : 'Eko yardımcı sohbetini aç'} aria-expanded={open} aria-controls="eko-chat" onClick={() => setOpen(value => !value)}>
        {open ? <X size={23} /> : <><img src={mascot} alt="" /><span><strong>Eko'ya sor</strong><small>Birlikte bulalım</small></span><MessageCircle size={18} /></>}
      </button>
    </div>, document.body,
  );
}
