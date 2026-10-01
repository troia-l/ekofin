import { useEffect, useState } from 'react';
import { Newspaper, RefreshCw, ExternalLink } from 'lucide-react';
import './EsgNews.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const demoNews = [
  { id: 'demo-energy', title: 'Yeşil Tekstil’de çatı GES ve su geri kazanımı', source: 'Sentetik demo senaryosu', nlp: { pillar: 'Environmental', sentiment: 'Pozitif', explanation: 'Demo belgelerinde çatı GES üretimi ve proses suyunun yeniden kullanımı yer alıyor. Gerçek bir haber veya bağımsız doğrulama değildir.' } },
  { id: 'demo-social', title: 'Çalışan ve iş güvenliği göstergelerinin takibi', source: 'Sentetik demo senaryosu', nlp: { pillar: 'Social', sentiment: 'Nötr', explanation: 'Örnek çalışan ve İSG göstergeleri sosyal boyutta izlenir. Bu kayıt yalnızca analiz görünümünü göstermek içindir.' } },
];
const pillars = { Environmental: 'Çevresel', Social: 'Sosyal', Governance: 'Yönetişim', E: 'Çevresel', S: 'Sosyal', G: 'Yönetişim' };
const safeUrl = value => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; } };

export default function EsgNews({ ticker, demo }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (demo) { setItems(demoNews); setLoading(false); setError(''); return; }
    if (!ticker) { setItems([]); return; }
    const controller = new AbortController();
    let disposed = false;
    setItems([]); setLoading(true); setError('');
    const timeout = setTimeout(() => controller.abort(), 60000);
    fetch(`${API_URL}/api/esg/news/${encodeURIComponent(ticker)}${refresh ? '/refresh' : ''}`, { method: refresh ? 'POST' : 'GET', signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('news'); const data = await response.json(); const news = Array.isArray(data) ? data : data.news; if (!Array.isArray(news)) throw new Error('format'); setItems(news); })
      .catch(() => { if (!disposed) setError('Haber analizi şu anda alınamadı. Yeniden deneyebilirsiniz.'); })
      .finally(() => { clearTimeout(timeout); if (!disposed) setLoading(false); });
    return () => { disposed = true; clearTimeout(timeout); controller.abort(); };
  }, [ticker, demo, refresh]);
  return <section className="esg-news" aria-labelledby="esg-news-title">
    <header className="esg-news-header"><div><h2 id="esg-news-title"><Newspaper size={20} />ESG Haber Analizi</h2><p>Şirket haberleri ve çevresel, sosyal, yönetişim değerlendirmeleri.</p></div>
      {!demo && <button type="button" disabled={loading || !ticker} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={15} className={loading ? 'esg-news-spin' : ''} />{loading ? 'Yükleniyor' : 'Yenile'}</button>}
    </header>
    {demo && <p className="esg-news-demo">Sentetik demo · Bu kayıtlar gerçek haber değildir.</p>}
    {loading ? <p className="esg-news-state" role="status">Haberler ve analizler getiriliyor…</p> : error ? <p className="esg-news-state" role="alert">{error}</p> : !items.length ? <p className="esg-news-state">Bu şirket için henüz haber analizi bulunmuyor.</p> : <div className="esg-news-list">{items.map((item, index) => {
      const url = safeUrl(item.url); const analysis = item.nlp;
      const date = item.publishedDate && new Date(item.publishedDate);
      return <article key={item.id || item.url || index} className="esg-news-item">
        <div className="esg-news-meta"><span>{item.source || 'Haber kaynağı'}</span>{date && !Number.isNaN(date.getTime()) && <time>{date.toLocaleDateString('tr-TR')}</time>}</div>
        <h3>{url ? <a href={url} target="_blank" rel="noopener noreferrer">{item.title}<ExternalLink size={14} /></a> : item.title}</h3>
        {analysis ? <><div className="esg-news-tags"><span>{pillars[analysis.pillar] || analysis.pillar || 'ESG'}</span><span>{analysis.sentiment || 'Değerlendirilmedi'}</span></div><p>{analysis.explanation || 'Analiz açıklaması bulunmuyor.'}</p></> : <p>Bu haber için analiz henüz bulunmuyor.</p>}
      </article>;
    })}</div>}
    <footer>Haber analizi bağımsız güvence veya kesin şirket ESG skoru değildir.</footer>
  </section>;
}
