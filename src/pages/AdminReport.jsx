import { useEffect, useMemo, useState } from 'react';
import BrandBar from '../components/BrandBar.jsx';
import { getJSONAdmin, excelUrl, clearAdminKey } from '../api.js';
import { heat, heatBadPct } from '../constants.js';

const fmt = (v) => (v === null || v === undefined ? '—' : v);
const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);
const TEXT_LABELS = {
  trainingFeedback: 'Training Feedback',
  overallFeedback: 'Overall CRT Feedback',
  failReason: 'Company Drive Failure Reason',
};

/* ---------- design primitives ---------- */
function SectionCard({ n, title, subtitle, children }) {
  return (
    <section className="bg-white rounded-2xl border border-stone-200 shadow-sm mb-5 overflow-hidden">
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 bg-gradient-to-r from-kldeep via-kldark to-klred">
        <span className="w-7 h-7 rounded-lg bg-white/15 border border-white/25 text-white text-[13px] font-bold flex items-center justify-center shrink-0">{n}</span>
        <div>
          <h2 className="text-[15px] font-bold text-white leading-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-white/70">{subtitle}</p>}
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
function Tbl({ children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200">
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}
function Th({ children, left, sticky }) {
  return <th className={`bg-kldark text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 whitespace-nowrap ${left ? 'text-left' : 'text-center'} ${sticky ? 'sticky left-0 z-10 bg-kldark' : ''}`}>{children}</th>;
}
function Td({ children, style, left, className = '', sticky }) {
  return <td style={style} className={`border-t border-stone-100 px-3 py-2 text-[12.5px] whitespace-nowrap ${left ? 'text-left' : 'text-center'} ${sticky ? 'sticky left-0 z-10 bg-white' : ''} ${className}`}>{children}</td>;
}
function Row({ children }) {
  return <tr className="odd:bg-stone-50/60 hover:bg-blue-50/40 transition-colors">{children}</tr>;
}
function SentChip({ s }) {
  if (!s) return <span className="text-neutral-300 text-[11px]">—</span>;
  const cfg = {
    positive: ['😊 Positive', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
    neutral: ['😐 Neutral', 'bg-stone-100 text-neutral-600 border-stone-200'],
    negative: ['🙁 Negative', 'bg-red-50 text-red-700 border-red-200'],
  }[s];
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${cfg[1]}`}>{cfg[0]}</span>;
}
function SentBar({ d }) {
  const t = d.positive + d.neutral + d.negative || 1;
  return (
    <div className="flex h-3.5 rounded-full overflow-hidden bg-stone-100 min-w-24">
      <div className="bg-emerald-500" style={{ width: `${(d.positive / t) * 100}%` }} />
      <div className="bg-stone-400" style={{ width: `${(d.neutral / t) * 100}%` }} />
      <div className="bg-red-500" style={{ width: `${(d.negative / t) * 100}%` }} />
    </div>
  );
}

export default function AdminReport() {
  const [A, setA] = useState(null);
  const [R, setR] = useState([]);
  const [err, setErr] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [selStudent, setSelStudent] = useState('');

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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 mt-4 text-sm">{err}</div>
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
  const stu = R.find((r) => r.regNo === selStudent) || null;

  const interp = (hib, v) => {
    if (v === null || v === undefined) return '';
    if (hib) return v >= 7 ? 'Strength' : v <= 5 ? 'Needs Improvement' : 'Moderate';
    return v >= 6 ? 'High Difficulty' : v <= 4 ? 'Comfortable' : 'Moderate';
  };
  const interpCls = (t) =>
    t === 'Strength' || t === 'Comfortable' ? 'text-emerald-700 font-bold'
    : t === 'Needs Improvement' || t === 'High Difficulty' ? 'text-red-600 font-bold'
    : 'text-neutral-500';

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 print-sheet">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <BrandBar compact />
        <div className="flex gap-2 flex-wrap no-print">
          <button onClick={load} className="px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-sm font-bold hover:border-klred">&#8635; Refresh</button>
          <a href={excelUrl()} className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-bold">&#8681; Excel</a>
          <button onClick={() => window.print()} className="px-4 py-2.5 rounded-xl bg-klred text-white text-sm font-bold">&#128424; Print / PDF</button>
          <button onClick={() => { clearAdminKey(); window.location.reload(); }} className="px-4 py-2.5 rounded-xl bg-white border border-stone-300 text-sm font-bold text-neutral-500">Logout</button>
        </div>
      </div>

      <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-kldeep via-kldark to-klred mb-5 shadow-lg shadow-kldeep/25">
        <h1 className="text-xl font-bold">CRT Feedback — Analysis Report</h1>
        <p className="text-[12.5px] opacity-85">
          {A.total} responses &bull; {active.length} branches &bull; Generated {new Date(A.generatedAt).toLocaleString('en-IN')}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {[
          { v: A.total, l: 'Total Responses', i: '\u{1F4CB}' },
          { v: active.length, l: 'Branches', i: '\u{1F3EB}' },
          { v: totalSent ? pct(allSent.positive, totalSent) + '%' : '—', l: 'Positive Sentiment', c: 'text-emerald-600', i: '\u{1F60A}' },
          { v: totalSent ? pct(allSent.negative, totalSent) + '%' : '—', l: 'Negative Sentiment', c: 'text-red-600', i: '\u{1F641}' },
          { v: A.weaknesses.length, l: 'Weakness Areas', c: 'text-red-600', i: '\u{26A0}\u{FE0F}' },
        ].map((k, i) => (
          <div key={i} className="bg-white border border-stone-200 rounded-2xl p-4 text-center shadow-sm">
            <div className="text-lg mb-0.5">{k.i}</div>
            <div className={`text-2xl font-black ${k.c || 'text-kldark'}`}>{k.v}</div>
            <div className="text-[10.5px] text-neutral-500 mt-0.5 font-semibold uppercase tracking-wide">{k.l}</div>
          </div>
        ))}
      </div>

      {/* 1. Overall summary */}
      <SectionCard n={1} title="Overall Summary — All Parameters" subtitle="Heat colors: red = low / difficult, green = strong">
        <Tbl>
          <thead><tr><Th left>Group</Th><Th left>Parameter</Th><Th>Average /10</Th><Th>Responses</Th><Th>Interpretation</Th></tr></thead>
          <tbody>
            {A.overall.filter((p) => p.average !== null).map((p) => {
              const it = interp(p.higherIsBetter !== false, p.average);
              return (
                <Row key={p.key}>
                  <Td left className="text-neutral-400 text-[11.5px]">{p.group}</Td>
                  <Td left className="font-semibold">{p.label}</Td>
                  <Td style={heat(p.average, p.higherIsBetter !== false)}>{p.average}</Td>
                  <Td>{p.count}</Td>
                  <Td className={interpCls(it)}>{it}</Td>
                </Row>
              );
            })}
          </tbody>
        </Tbl>
      </SectionCard>

      {/* 2. Branch-wise heat */}
      <SectionCard n={2} title="Branch-wise Heat Table" subtitle="Every question × every branch">
        {groups.map((g) => {
          const qs = A.questionWise.filter((q) => q.group === g && q.overall !== null);
          if (!qs.length) return null;
          return (
            <div key={g} className="mb-4 last:mb-0">
              <h3 className="text-[12px] font-bold text-kldark uppercase tracking-wider mb-1.5">{g}</h3>
              <Tbl>
                <thead>
                  <tr>
                    <Th left sticky>Question</Th>
                    {active.map((b) => <Th key={b}>{b}<br /><span className="opacity-60 normal-case">n={A.branchCounts[b]}</span></Th>)}
                    <Th>Overall</Th>
                  </tr>
                </thead>
                <tbody>
                  {qs.map((q) => (
                    <Row key={q.key}>
                      <Td left sticky className="font-semibold">{q.label.replace(/^.*?: /, '')}</Td>
                      {active.map((b) => (
                        <Td key={b} style={heat(q.byBranch[b], q.higherIsBetter)}>{fmt(q.byBranch[b])}</Td>
                      ))}
                      <Td style={heat(q.overall, q.higherIsBetter)} className="font-black">{fmt(q.overall)}</Td>
                    </Row>
                  ))}
                </tbody>
              </Tbl>
            </div>
          );
        })}
      </SectionCard>

      {/* 3. Weak topics */}
      <SectionCard n={3} title="Weak Topics" subtitle={`Students who rated a topic 4 or below`}>
        <Tbl>
          <thead><tr><Th left>Subject</Th><Th left>Topic</Th><Th>Weak Students</Th><Th>% of Total</Th></tr></thead>
          <tbody>
            {Object.values(A.weakTopics).flatMap((def) =>
              Object.entries(def.counts).map(([topic, count]) => (
                <Row key={def.label + topic}>
                  <Td left className="text-neutral-400 text-[11.5px]">{def.label}</Td>
                  <Td left className="font-semibold">{topic}</Td>
                  <Td>{count}</Td>
                  <Td style={heatBadPct(pct(count, A.total))}>{pct(count, A.total)}%</Td>
                </Row>
              ))
            )}
          </tbody>
        </Tbl>
      </SectionCard>

      {/* 4. Sentiment overview */}
      <SectionCard n={4} title="Feedback Sentiment Analysis" subtitle="Positive / Neutral / Negative per feedback question">
        <Tbl>
          <thead>
            <tr>
              <Th left>Feedback Question</Th><Th>Answered</Th>
              <Th>Positive</Th><Th>Neutral</Th><Th>Negative</Th><Th left>Distribution</Th>
            </tr>
          </thead>
          <tbody>
            {Object.values(A.sentiment).map((s) => (
              <Row key={s.label}>
                <Td left className="font-semibold">{s.label}</Td>
                <Td>{s.answered}</Td>
                <Td className="text-emerald-700 font-bold">{s.distribution.positive} ({pct(s.distribution.positive, s.answered)}%)</Td>
                <Td className="text-neutral-500 font-bold">{s.distribution.neutral} ({pct(s.distribution.neutral, s.answered)}%)</Td>
                <Td className="text-red-600 font-bold">{s.distribution.negative} ({pct(s.distribution.negative, s.answered)}%)</Td>
                <Td left><SentBar d={s.distribution} /></Td>
              </Row>
            ))}
            <tr className="bg-stone-100 font-black">
              <Td left>OVERALL</Td>
              <Td>{totalSent}</Td>
              <Td className="text-emerald-700">{allSent.positive} ({pct(allSent.positive, totalSent)}%)</Td>
              <Td className="text-neutral-600">{allSent.neutral} ({pct(allSent.neutral, totalSent)}%)</Td>
              <Td className="text-red-600">{allSent.negative} ({pct(allSent.negative, totalSent)}%)</Td>
              <Td left><SentBar d={allSent} /></Td>
            </tr>
          </tbody>
        </Tbl>
        {Object.values(A.sentiment).map((s) => (
          Object.keys(s.byBranch).length > 0 && (
            <div key={s.label} className="mt-4">
              <h3 className="text-[12px] font-bold text-kldark uppercase tracking-wider mb-1.5">{s.label} — branch-wise</h3>
              <Tbl>
                <thead><tr><Th left>Branch</Th><Th>Positive</Th><Th>Neutral</Th><Th>Negative</Th><Th left>Distribution</Th></tr></thead>
                <tbody>
                  {Object.entries(s.byBranch).map(([b, d]) => (
                    <Row key={b}>
                      <Td left className="font-semibold">{b}</Td>
                      <Td className="text-emerald-700 font-bold">{d.positive}</Td>
                      <Td className="text-neutral-500">{d.neutral}</Td>
                      <Td className="text-red-600 font-bold">{d.negative}</Td>
                      <Td left><SentBar d={d} /></Td>
                    </Row>
                  ))}
                </tbody>
              </Tbl>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {s.keywords.map((k) => (
                  <span key={k.word} className="text-[11px] bg-stone-100 text-kldark border border-stone-200 rounded-full px-2.5 py-0.5">{k.word} ({k.count})</span>
                ))}
              </div>
            </div>
          )
        ))}
      </SectionCard>

      {/* 5. Strengths & weaknesses */}
      <SectionCard n={5} title="Strengths & Weaknesses" subtitle="Overall and branch-wise focus areas">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl border border-stone-200 border-t-4 border-t-emerald-500 overflow-hidden">
            <table className="w-full border-collapse">
              <thead><tr><Th left>&#9650; Strength</Th><Th>Avg</Th><Th left>Why</Th></tr></thead>
              <tbody>
                {A.strengths.length ? A.strengths.map((s, i) => (
                  <Row key={i}>
                    <Td left className="font-semibold">{s.label}</Td>
                    <Td style={heat(s.average ?? 8, true)}>{fmt(s.average)}</Td>
                    <Td left className="text-neutral-500 !whitespace-normal text-[11.5px]">{s.why}</Td>
                  </Row>
                )) : <Row><Td left>No clear strengths yet.</Td><Td /><Td /></Row>}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-stone-200 border-t-4 border-t-red-500 overflow-hidden">
            <table className="w-full border-collapse">
              <thead><tr><Th left>&#9660; Weakness / Focus Area</Th><Th>Avg</Th><Th left>Why</Th></tr></thead>
              <tbody>
                {A.weaknesses.length ? A.weaknesses.map((w, i) => (
                  <Row key={i}>
                    <Td left className="font-semibold">{w.label}</Td>
                    <Td style={heat(w.average ?? 3, true)}>{fmt(w.average)}</Td>
                    <Td left className="text-neutral-500 !whitespace-normal text-[11.5px]">{w.why}</Td>
                  </Row>
                )) : <Row><Td left>No major weaknesses flagged.</Td><Td /><Td /></Row>}
              </tbody>
            </table>
          </div>
        </div>
        <Tbl>
          <thead><tr><Th left>Branch</Th><Th left>Strengths</Th><Th left>Weaknesses</Th></tr></thead>
          <tbody>
            {Object.entries(A.branchSW).map(([b, sw]) => (
              <Row key={b}>
                <Td left className="font-bold">{b}</Td>
                <Td left className="text-emerald-800 !whitespace-normal text-[11.5px]">{sw.strengths.map((s) => `${s.label} (${s.average})`).join('; ') || '—'}</Td>
                <Td left className="text-red-600 !whitespace-normal text-[11.5px]">{sw.weaknesses.map((w) => `${w.label} (${w.average})`).join('; ') || '—'}</Td>
              </Row>
            ))}
          </tbody>
        </Tbl>
      </SectionCard>

      {/* 6. Student comments & sentiment */}
      <SectionCard n={6} title="Student Comments & Sentiment" subtitle="Every student's written feedback with sentiment analysis">
        {R.length === 0 ? <p className="text-neutral-400 text-sm">No responses yet.</p> : (
          <Tbl>
            <thead>
              <tr>
                <Th left sticky>Student</Th>
                <Th left>Training Feedback</Th>
                <Th left>Overall CRT Feedback</Th>
                <Th left>Failure Reason</Th>
              </tr>
            </thead>
            <tbody>
              {R.map((r) => (
                <Row key={r.regNo}>
                  <Td left sticky className="align-top">
                    <div className="font-bold text-kldark">{r.name}</div>
                    <div className="text-[10.5px] text-neutral-400">{r.regNo} &bull; {r.branch}</div>
                  </Td>
                  {['trainingFeedback', 'overallFeedback', 'failReason'].map((k) => (
                    <Td key={k} left className="!whitespace-normal align-top min-w-56 max-w-80">
                      <div className="mb-1"><SentChip s={r._sentiments?.[k]} /></div>
                      <div className="text-[12px] text-neutral-700 leading-relaxed">{(r[k] || '').trim() || <span className="text-neutral-300">Not answered</span>}</div>
                    </Td>
                  ))}
                </Row>
              ))}
            </tbody>
          </Tbl>
        )}
      </SectionCard>

      {/* 7. Student-wise detailed report */}
      <SectionCard n={7} title="Student-wise Detailed Report" subtitle="All parameters of one student compared with the class average">
        <div className="mb-4 no-print">
          <select
            value={selStudent} onChange={(e) => setSelStudent(e.target.value)}
            className="w-full sm:w-96 px-3.5 py-2.5 border-[1.5px] border-stone-200 rounded-xl bg-stone-50 text-sm font-semibold focus:border-klred focus:outline-none"
          >
            <option value="">— Select a student —</option>
            {R.map((r) => <option key={r.regNo} value={r.regNo}>{r.regNo} — {r.name} ({r.branch})</option>)}
          </select>
        </div>

        {!stu ? (
          <p className="text-neutral-400 text-sm">Select a student to see their complete parameter-wise report.</p>
        ) : (
          <div>
            {/* student header */}
            <div className="rounded-xl bg-gradient-to-r from-kldeep via-kldark to-klred text-white p-4 mb-4 flex flex-wrap items-center gap-x-6 gap-y-1.5">
              <div>
                <div className="text-lg font-bold">{stu.name}</div>
                <div className="text-[12px] opacity-80">{stu.regNo} &bull; {stu.branch}</div>
              </div>
              <div className="text-[12px] opacity-90">
                Coding: <b>{stu.codingLang || '—'}</b> &bull; OOPs: <b>{stu.oopsLang || '—'}</b> &bull; Training: <b>{stu.trainingSource || '—'}</b>
                {stu.coachName ? <> &bull; Faculty: <b>{stu.coachName}</b></> : null}
              </div>
              <div className="text-[11px] opacity-70 ml-auto">Submitted {new Date(stu.submittedAt).toLocaleString('en-IN')}</div>
            </div>

            {/* parameter tables per group */}
            {groups.map((g) => {
              const qs = A.questionWise.filter((q) => q.group === g && stu[q.key] !== undefined && stu[q.key] !== null);
              if (!qs.length) return null;
              return (
                <div key={g} className="mb-4">
                  <h3 className="text-[12px] font-bold text-kldark uppercase tracking-wider mb-1.5">{g}</h3>
                  <Tbl>
                    <thead><tr><Th left>Parameter</Th><Th>Student Rating</Th><Th>Class Average</Th><Th>Vs Class</Th><Th>Interpretation</Th></tr></thead>
                    <tbody>
                      {qs.map((q) => {
                        const v = stu[q.key];
                        const avg = q.overall;
                        const diff = avg !== null ? Math.round((v - avg) * 10) / 10 : null;
                        const it = interp(q.higherIsBetter, v);
                        return (
                          <Row key={q.key}>
                            <Td left className="font-semibold">{q.label.replace(/^.*?: /, '')}</Td>
                            <Td style={heat(v, q.higherIsBetter)}>{v}</Td>
                            <Td className="text-neutral-500">{fmt(avg)}</Td>
                            <Td className={diff === null ? '' : (q.higherIsBetter ? diff >= 0 : diff <= 0) ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                              {diff === null ? '—' : (diff > 0 ? '+' : '') + diff}
                            </Td>
                            <Td className={interpCls(it)}>{it}</Td>
                          </Row>
                        );
                      })}
                    </tbody>
                  </Tbl>
                </div>
              );
            })}

            {/* student comments */}
            <h3 className="text-[12px] font-bold text-kldark uppercase tracking-wider mb-1.5">Comments &amp; Sentiment</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {['trainingFeedback', 'overallFeedback', 'failReason'].map((k) => (
                <div key={k} className="rounded-xl border border-stone-200 p-3.5 bg-stone-50/50">
                  <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide mb-1.5">{TEXT_LABELS[k]}</div>
                  <div className="mb-2"><SentChip s={stu._sentiments?.[k]} /></div>
                  <p className="text-[12.5px] text-neutral-700 leading-relaxed">{(stu[k] || '').trim() || <span className="text-neutral-300">Not answered</span>}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* 8. Responses */}
      <SectionCard n={8} title={`All Responses (${filtered.length})`} subtitle="Key ratings per student — heat colored">
        <div className="no-print mb-3">
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3.5 py-2.5 border-[1.5px] border-stone-200 rounded-xl bg-stone-50 text-sm font-semibold focus:border-klred focus:outline-none">
            <option value="">All branches</option>
            {A.branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <Tbl>
          <thead>
            <tr>
              <Th>#</Th><Th left>Reg No</Th><Th left>Name</Th><Th>Branch</Th><Th>Apt</Th><Th>V/QR</Th>
              <Th>Coding</Th><Th>Lang</Th><Th>New-Prob</Th><Th>Source</Th><Th left>Submitted</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <Row key={r.regNo}>
                <Td>{i + 1}</Td>
                <Td left className="font-semibold">{r.regNo}</Td>
                <Td left>
                  <button className="text-klred font-semibold hover:underline no-print" onClick={() => { setSelStudent(r.regNo); document.querySelectorAll('section')[6]?.scrollIntoView({ behavior: 'smooth' }); }}>
                    {r.name}
                  </button>
                  <span className="hidden print:inline">{r.name}</span>
                </Td>
                <Td>{r.branch}</Td>
                <Td style={heat(r.aptitude, true)}>{fmt(r.aptitude)}</Td>
                <Td style={heat(r.verbalQR, true)}>{fmt(r.verbalQR)}</Td>
                <Td style={heat(r.codingRating, true)}>{fmt(r.codingRating)}</Td>
                <Td>{r.codingLang || '—'}</Td>
                <Td style={heat(r.newProblemFeel, false)}>{fmt(r.newProblemFeel)}</Td>
                <Td>{r.trainingSource || '—'}</Td>
                <Td left className="text-neutral-500 text-[11.5px]">{new Date(r.submittedAt).toLocaleString('en-IN')}</Td>
              </Row>
            ))}
          </tbody>
        </Tbl>
      </SectionCard>

      <footer className="text-center text-xs text-neutral-500 my-8">
        KL University — CRT Feedback System &bull; Auto-generated report
      </footer>
    </div>
  );
}
