import { useEffect, useMemo, useState } from 'react';
import BrandBar from '../components/BrandBar.jsx';
import { getJSONAdmin, excelUrl, clearAdminKey } from '../api.js';
import { heat, heatBadPct } from '../constants.js';

const fmt = (v) => (v === null || v === undefined ? '—' : v);
const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);

function SectionTitle({ children }) {
  return <h2 className="text-[15px] font-bold text-kldark border-l-4 border-klred pl-2.5 mt-8 mb-3">{children}</h2>;
}

function Th({ children, left }) {
  return <th className={`bg-kldark text-white text-[11px] font-semibold px-2.5 py-2 whitespace-nowrap ${left ? 'text-left' : 'text-center'}`}>{children}</th>;
}
function Td({ children, style, left, className = '' }) {
  return <td style={style} className={`border border-stone-200 px-2.5 py-1.5 text-[12px] whitespace-nowrap ${left ? 'text-left' : 'text-center'} ${className}`}>{children}</td>;
}

function SentBar({ d }) {
  const t = d.positive + d.neutral + d.negative || 1;
  return (
    <div className="flex h-4 rounded-full overflow-hidden bg-stone-100 min-w-28">
      <div className="bg-emerald-600" style={{ width: `${(d.positive / t) * 100}%` }} />
      <div className="bg-stone-400" style={{ width: `${(d.neutral / t) * 100}%` }} />
      <div className="bg-klred" style={{ width: `${(d.negative / t) * 100}%` }} />
    </div>
  );
}

export default function AdminReport() {
  const [A, setA] = useState(null);
  const [R, setR] = useState([]);
  const [err, setErr] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  async function load() {
    try {
      const [a, r] = await Promise.all([getJSONAdmin('/api/analytics'), getJSONAdmin('/api/responses')]);
      setA(a); setR(r); setErr('');
    } catch (e) {
      if (e.message === 'unauthorized') { window.location.reload(); return; }
      setErr('Could not load data from the backend: ' + e.message);
    }
  }
  useEffect(() => { load(); }, []);

  const active = useMemo(() => (A ? A.branches.filter((b) => A.branchCounts[b] > 0) : []), [A]);

  if (err) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <BrandBar compact />
        <div className="bg-red-50 border border-red-200 text-klred rounded-xl p-5 mt-4 text-sm">{err}</div>
      </div>
    );
  }
  if (!A) return <div className="text-center py-20 text-neutral-500">Loading report…</div>;

  const allSent = { positive: 0, neutral: 0, negative: 0 };
  for (const s of Object.values(A.sentiment)) {
    allSent.positive += s.distribution.positive;
    allSent.neutral += s.distribution.neutral;
    allSent.negative += s.distribution.negative;
  }
  const totalSent = allSent.positive + allSent.neutral + allSent.negative;
  const groups = [...new Set(A.questionWise.map((q) => q.group))];
  const filtered = branchFilter ? R.filter((r) => r.branch === branchFilter) : R;

  const interp = (q, v) => {
    if (v === null || v === undefined) return '';
    if (q.higherIsBetter) return v >= 7 ? 'Strength' : v <= 5 ? 'Needs Improvement' : 'Moderate';
    return v >= 6 ? 'High Difficulty' : v <= 4 ? 'Comfortable' : 'Moderate';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 print-sheet">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <BrandBar compact />
        <div className="flex gap-2 no-print">
          <button onClick={load} className="px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-sm font-bold">&#8635; Refresh</button>
          <a href={excelUrl()} className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-bold">&#8681; Excel</a>
          <button onClick={() => window.print()} className="px-4 py-2.5 rounded-xl bg-klred text-white text-sm font-bold">&#128424; Print / PDF</button>
          <button onClick={() => { clearAdminKey(); window.location.reload(); }} className="px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-sm font-bold text-neutral-500">Logout</button>
        </div>
      </div>

      <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-kldeep via-kldark to-klred mb-5">
        <h1 className="text-xl font-bold">CRT Feedback — Analysis Report</h1>
        <p className="text-[12.5px] opacity-90">
          {A.total} responses &bull; {active.length} branches &bull; Generated {new Date(A.generatedAt).toLocaleString('en-IN')}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { v: A.total, l: 'Total Responses' },
          { v: active.length, l: 'Branches' },
          { v: totalSent ? pct(allSent.positive, totalSent) + '%' : '—', l: 'Positive Sentiment', c: 'text-emerald-700' },
          { v: totalSent ? pct(allSent.negative, totalSent) + '%' : '—', l: 'Negative Sentiment', c: 'text-klred' },
          { v: A.weaknesses.length, l: 'Weakness Areas', c: 'text-klred' },
        ].map((k, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-xl p-3.5 text-center">
            <div className={`text-2xl font-black ${k.c || 'text-kldark'}`}>{k.v}</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">{k.l}</div>
          </div>
        ))}
      </div>

      {/* 1. Overall parameter summary table */}
      <SectionTitle>1. Overall Summary — All Parameters (heat: red = low / difficult, green = strong)</SectionTitle>
      <div className="overflow-x-auto bg-white rounded-xl border border-stone-200">
        <table className="w-full border-collapse">
          <thead><tr><Th left>Group</Th><Th left>Parameter</Th><Th>Average /10</Th><Th>Responses</Th><Th>Interpretation</Th></tr></thead>
          <tbody>
            {A.overall.filter((p) => p.average !== null).map((p) => {
              const it = interp({ higherIsBetter: p.higherIsBetter !== false }, p.average);
              return (
                <tr key={p.key} className="odd:bg-stone-50/50">
                  <Td left className="text-neutral-500">{p.group}</Td>
                  <Td left>{p.label}</Td>
                  <Td style={heat(p.average, p.higherIsBetter !== false)}>{p.average}</Td>
                  <Td>{p.count}</Td>
                  <Td className={it === 'Strength' || it === 'Comfortable' ? 'text-emerald-700 font-bold' : it === 'Needs Improvement' || it === 'High Difficulty' ? 'text-klred font-bold' : 'text-neutral-500'}>{it}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Branch-wise heatmap */}
      <SectionTitle>2. Branch-wise Heat Table — every question &times; every branch</SectionTitle>
      {groups.map((g) => {
        const qs = A.questionWise.filter((q) => q.group === g && q.overall !== null);
        if (!qs.length) return null;
        return (
          <div key={g} className="mb-4">
            <h3 className="text-[13px] font-bold text-neutral-600 mb-1.5">{g}</h3>
            <div className="overflow-x-auto bg-white rounded-xl border border-stone-200">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th left>Question</Th>
                    {active.map((b) => <Th key={b}>{b}<br /><span className="opacity-70">n={A.branchCounts[b]}</span></Th>)}
                    <Th>Overall</Th>
                  </tr>
                </thead>
                <tbody>
                  {qs.map((q) => (
                    <tr key={q.key}>
                      <Td left>{q.label.replace(/^.*?: /, '')}</Td>
                      {active.map((b) => (
                        <Td key={b} style={heat(q.byBranch[b], q.higherIsBetter)}>{fmt(q.byBranch[b])}</Td>
                      ))}
                      <Td style={heat(q.overall, q.higherIsBetter)} className="font-black">{fmt(q.overall)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* 3. Weak topics */}
      <SectionTitle>3. Weak Topics — students who rated a topic &le; 4</SectionTitle>
      <div className="overflow-x-auto bg-white rounded-xl border border-stone-200">
        <table className="w-full border-collapse">
          <thead><tr><Th left>Subject</Th><Th left>Topic</Th><Th>Weak Students</Th><Th>% of Total</Th></tr></thead>
          <tbody>
            {Object.values(A.weakTopics).flatMap((def) =>
              Object.entries(def.counts).map(([topic, count]) => (
                <tr key={def.label + topic} className="odd:bg-stone-50/50">
                  <Td left className="text-neutral-500">{def.label}</Td>
                  <Td left>{topic}</Td>
                  <Td>{count}</Td>
                  <Td style={heatBadPct(pct(count, A.total))}>{pct(count, A.total)}%</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Sentiment report */}
      <SectionTitle>4. Feedback Sentiment Analysis — Positive / Neutral / Negative</SectionTitle>
      <div className="overflow-x-auto bg-white rounded-xl border border-stone-200 mb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th left>Feedback Question</Th><Th>Answered</Th>
              <Th>&#128522; Positive</Th><Th>&#128528; Neutral</Th><Th>&#128577; Negative</Th><Th left>Distribution</Th>
            </tr>
          </thead>
          <tbody>
            {Object.values(A.sentiment).map((s) => (
              <tr key={s.label} className="odd:bg-stone-50/50">
                <Td left className="font-semibold">{s.label}</Td>
                <Td>{s.answered}</Td>
                <Td className="text-emerald-700 font-bold">{s.distribution.positive} ({pct(s.distribution.positive, s.answered)}%)</Td>
                <Td className="text-neutral-500 font-bold">{s.distribution.neutral} ({pct(s.distribution.neutral, s.answered)}%)</Td>
                <Td className="text-klred font-bold">{s.distribution.negative} ({pct(s.distribution.negative, s.answered)}%)</Td>
                <Td left><SentBar d={s.distribution} /></Td>
              </tr>
            ))}
            <tr className="bg-stone-100 font-black">
              <Td left>OVERALL</Td>
              <Td>{totalSent}</Td>
              <Td className="text-emerald-700">{allSent.positive} ({pct(allSent.positive, totalSent)}%)</Td>
              <Td className="text-neutral-600">{allSent.neutral} ({pct(allSent.neutral, totalSent)}%)</Td>
              <Td className="text-klred">{allSent.negative} ({pct(allSent.negative, totalSent)}%)</Td>
              <Td left><SentBar d={allSent} /></Td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sentiment by branch per question */}
      {Object.values(A.sentiment).map((s) => (
        Object.keys(s.byBranch).length > 0 && (
          <div key={s.label} className="mb-4">
            <h3 className="text-[13px] font-bold text-neutral-600 mb-1.5">{s.label} — branch-wise sentiment</h3>
            <div className="overflow-x-auto bg-white rounded-xl border border-stone-200">
              <table className="w-full border-collapse">
                <thead><tr><Th left>Branch</Th><Th>Positive</Th><Th>Neutral</Th><Th>Negative</Th><Th left>Distribution</Th></tr></thead>
                <tbody>
                  {Object.entries(s.byBranch).map(([b, d]) => (
                    <tr key={b} className="odd:bg-stone-50/50">
                      <Td left className="font-semibold">{b}</Td>
                      <Td className="text-emerald-700 font-bold">{d.positive}</Td>
                      <Td className="text-neutral-500">{d.neutral}</Td>
                      <Td className="text-klred font-bold">{d.negative}</Td>
                      <Td left><SentBar d={d} /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {s.keywords.map((k) => (
                <span key={k.word} className="text-[11px] bg-red-50 text-kldark border border-red-100 rounded-full px-2.5 py-0.5">{k.word} ({k.count})</span>
              ))}
            </div>
          </div>
        )
      ))}

      {/* 5. Strengths & weaknesses */}
      <SectionTitle>5. Strengths &amp; Weaknesses</SectionTitle>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="overflow-x-auto bg-white rounded-xl border border-stone-200 border-t-4 border-t-emerald-600">
          <table className="w-full border-collapse">
            <thead><tr><Th left>&#9650; Strength</Th><Th>Avg</Th><Th left>Why</Th></tr></thead>
            <tbody>
              {A.strengths.length ? A.strengths.map((s, i) => (
                <tr key={i} className="odd:bg-stone-50/50">
                  <Td left className="font-semibold">{s.label}</Td>
                  <Td style={heat(s.average ?? 8, true)}>{fmt(s.average)}</Td>
                  <Td left className="text-neutral-500 !whitespace-normal">{s.why}</Td>
                </tr>
              )) : <tr><Td left>No clear strengths yet.</Td><Td /><Td /></tr>}
            </tbody>
          </table>
        </div>
        <div className="overflow-x-auto bg-white rounded-xl border border-stone-200 border-t-4 border-t-klred">
          <table className="w-full border-collapse">
            <thead><tr><Th left>&#9660; Weakness / Focus Area</Th><Th>Avg</Th><Th left>Why</Th></tr></thead>
            <tbody>
              {A.weaknesses.length ? A.weaknesses.map((w, i) => (
                <tr key={i} className="odd:bg-stone-50/50">
                  <Td left className="font-semibold">{w.label}</Td>
                  <Td style={heat(w.average ?? 3, true)}>{fmt(w.average)}</Td>
                  <Td left className="text-neutral-500 !whitespace-normal">{w.why}</Td>
                </tr>
              )) : <tr><Td left>No major weaknesses flagged.</Td><Td /><Td /></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branch-wise S&W */}
      <div className="overflow-x-auto bg-white rounded-xl border border-stone-200 mt-4">
        <table className="w-full border-collapse">
          <thead><tr><Th left>Branch</Th><Th left>Strengths</Th><Th left>Weaknesses</Th></tr></thead>
          <tbody>
            {Object.entries(A.branchSW).map(([b, sw]) => (
              <tr key={b} className="odd:bg-stone-50/50">
                <Td left className="font-bold">{b}</Td>
                <Td left className="text-emerald-800 !whitespace-normal">{sw.strengths.map((s) => `${s.label} (${s.average})`).join('; ') || '—'}</Td>
                <Td left className="text-klred !whitespace-normal">{sw.weaknesses.map((w) => `${w.label} (${w.average})`).join('; ') || '—'}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 6. Responses */}
      <SectionTitle>6. Responses ({filtered.length})</SectionTitle>
      <div className="no-print mb-2">
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
          className="px-3 py-2 border-[1.5px] border-stone-200 rounded-xl bg-white text-sm">
          <option value="">All branches</option>
          {A.branches.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto bg-white rounded-xl border border-stone-200">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>#</Th><Th left>Reg No</Th><Th left>Name</Th><Th>Branch</Th><Th>Apt</Th><Th>V/QR</Th>
              <Th>Coding</Th><Th>Lang</Th><Th>New-Prob</Th><Th>Source</Th><Th left>Submitted</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.regNo} className="odd:bg-stone-50/50">
                <Td>{i + 1}</Td>
                <Td left>{r.regNo}</Td>
                <Td left>{r.name}</Td>
                <Td>{r.branch}</Td>
                <Td style={heat(r.aptitude, true)}>{fmt(r.aptitude)}</Td>
                <Td style={heat(r.verbalQR, true)}>{fmt(r.verbalQR)}</Td>
                <Td style={heat(r.codingRating, true)}>{fmt(r.codingRating)}</Td>
                <Td>{r.codingLang || '—'}</Td>
                <Td style={heat(r.newProblemFeel, false)}>{fmt(r.newProblemFeel)}</Td>
                <Td>{r.trainingSource || '—'}</Td>
                <Td left>{new Date(r.submittedAt).toLocaleString('en-IN')}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="text-center text-xs text-neutral-500 my-8">
        KL University — CRT Feedback System &bull; Auto-generated report
      </footer>
    </div>
  );
}
