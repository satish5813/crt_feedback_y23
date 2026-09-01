import { useEffect, useRef, useState } from 'react';
import BrandBar from '../components/BrandBar.jsx';
import RatingChips from '../components/RatingChips.jsx';
import Seg from '../components/Seg.jsx';
import { api, getJSON } from '../api.js';
import { BRANCHES_FALLBACK, SECTIONS } from '../constants.js';

const STEPS = [
  { id: 'student',  title: 'Student Details',     icon: '\u{1F464}' },
  { id: 'skills',   title: 'Skill Self-Assessment', icon: '\u{1F4AA}' },
  { id: 'oops',     title: 'OOPs Concepts',       icon: '\u{2699}\u{FE0F}' },
  { id: 'topics',   title: 'Topic-wise Rating',   icon: '\u{1F4DA}' },
  { id: 'written',  title: 'Written Tests',       icon: '\u{1F4DD}' },
  { id: 'training', title: 'Training Feedback',   icon: '\u{1F393}' },
  { id: 'feedback', title: 'Your Feedback',       icon: '\u{1F4AC}' },
];

export default function FeedbackForm() {
  const [branches, setBranches] = useState(BRANCHES_FALLBACK);
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [ratings, setRatings] = useState({});
  const [segs, setSegs] = useState({});
  const [vendorName, setVendorName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [texts, setTexts] = useState({ trainingFeedback: '', overallFeedback: '', failReason: '' });
  const [errors, setErrors] = useState([]);
  const [invalidKeys, setInvalidKeys] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const topRef = useRef(null);

  useEffect(() => {
    getJSON('/api/config').then((c) => c.branches && setBranches(c.branches)).catch(() => {});
  }, []);

  const setRating = (k) => (v) => { setRatings((s) => ({ ...s, [k]: v })); setInvalidKeys((s) => { const n = new Set(s); n.delete(k); return n; }); };
  const setSeg = (k) => (v) => setSegs((s) => ({ ...s, [k]: v }));

  const showVendor = segs.trainingSource === 'External Vendor' || segs.trainingSource === 'Both';
  const showInternal = segs.trainingSource === 'In-house' || segs.trainingSource === 'Both';

  // ---- per-step validation ----
  function validateStep(i) {
    const errs = [];
    const missing = new Set();
    const needRatings = (keys) => keys.forEach((k) => { if (!ratings[k]) missing.add(k); });
    switch (STEPS[i].id) {
      case 'student':
        if (!/^\d{6,15}$/.test(regNo.trim())) errs.push('Register number must be numbers only (6-15 digits)');
        if (!name.trim()) errs.push('Enter your full name');
        if (!branch) errs.push('Select your branch');
        break;
      case 'skills':
        needRatings(SECTIONS.skills.map((x) => x.key));
        if (!segs.codingLang) errs.push('Select your preferred coding language');
        needRatings(['codingRating']);
        break;
      case 'oops':
        if (!segs.oopsLang) errs.push('Select your OOPs language');
        needRatings(SECTIONS.oops.map((x) => x.key));
        break;
      case 'topics':
        needRatings(SECTIONS.topics.flatMap((g) => g.items.map((x) => x.key)));
        break;
      case 'written':
        needRatings([...SECTIONS.written.map((x) => x.key), 'newProblemFeel']);
        break;
      case 'training':
        if (!segs.trainingSource) errs.push('Select how training was received');
        needRatings(SECTIONS.coach.map((x) => x.key));
        break;
      case 'feedback':
        if (!texts.trainingFeedback.trim()) errs.push('Write your training feedback');
        if (!texts.overallFeedback.trim()) errs.push('Write your overall CRT feedback');
        break;
      default: break;
    }
    if (missing.size) errs.push('Answer all the highlighted rating questions');
    setInvalidKeys(missing);
    setErrors(errs);
    return errs.length === 0;
  }

  function goNext() {
    if (!validateStep(step)) { topRef.current?.scrollIntoView({ behavior: 'smooth' }); return; }
    const n = Math.min(step + 1, STEPS.length - 1);
    setStep(n); setMaxStep((m) => Math.max(m, n)); setErrors([]); setInvalidKeys(new Set());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function goBack() {
    setStep((s) => Math.max(0, s - 1)); setErrors([]); setInvalidKeys(new Set());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function jumpTo(i) {
    if (i <= maxStep) { setStep(i); setErrors([]); setInvalidKeys(new Set()); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  async function submit() {
    if (!validateStep(step)) return;
    const payload = {
      regNo: regNo.trim(), name: name.trim(), branch,
      ...ratings, ...segs, vendorName, coachName, ...texts,
    };
    setSubmitting(true);
    try {
      const res = await fetch(api('/api/feedback'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (res.status === 409) {
        setErrors(['Feedback has already been submitted for this register number. Only one submission is allowed per student.']);
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      if (data.ok) { setDone(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else throw new Error((data.errors || ['Submission failed']).join(', '));
    } catch (err) {
      setErrors(['Could not submit: ' + err.message]);
    } finally {
      setSubmitting(false);
    }
  }

  const progress = Math.round(((done ? STEPS.length : step) / STEPS.length) * 100);
  const inputCls = 'w-full px-3.5 py-3 text-[15px] border-[1.5px] border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:border-klred focus:outline-none transition-colors';

  if (done) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <BrandBar />
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm text-center p-12 mt-4">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-50 text-emerald-600 text-4xl flex items-center justify-center animate-bounce">&#10004;</div>
          <h2 className="text-2xl font-bold text-kldark mb-2">Thank you!</h2>
          <p className="text-neutral-600 max-w-md mx-auto">Your feedback has been submitted successfully. It will help us make the CRT program better for everyone.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-5" ref={topRef}>
      <BrandBar />

      {/* Hero + progress */}
      <header className="rounded-2xl mt-3 mb-4 p-5 sm:p-6 text-white bg-gradient-to-br from-kldeep via-kldark to-klred shadow-lg shadow-red-900/25">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="inline-block text-[10.5px] tracking-[0.15em] uppercase bg-white/15 border border-white/25 px-3 py-1 rounded-full mb-2">
              Campus Recruitment Training
            </span>
            <h1 className="text-xl sm:text-2xl font-bold">CRT Student Feedback</h1>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-klgold">{progress}%</div>
            <div className="text-[11px] opacity-80">completed</div>
          </div>
        </div>
        <div className="h-2 bg-white/25 rounded-full mt-3.5 overflow-hidden">
          <div className="h-full bg-klgold rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* Stepper */}
      <nav className="bg-white rounded-2xl border border-stone-200 shadow-sm px-3 py-3 mb-4 overflow-x-auto no-print">
        <ol className="flex items-center min-w-max">
          {STEPS.map((s, i) => {
            const state = i < step ? 'done' : i === step ? 'now' : i <= maxStep ? 'open' : 'locked';
            return (
              <li key={s.id} className="flex items-center">
                {i > 0 && <div className={`w-6 sm:w-9 h-0.5 mx-1 ${i <= step ? 'bg-klred' : 'bg-stone-200'}`} />}
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  disabled={state === 'locked'}
                  className="flex flex-col items-center gap-1 px-1 group"
                  title={s.title}
                >
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition-all
                    ${state === 'done' ? 'bg-emerald-500 border-emerald-500 text-white'
                    : state === 'now' ? 'bg-klred border-klred text-white ring-4 ring-red-100 scale-110'
                    : state === 'open' ? 'bg-white border-klred/40 text-klred'
                    : 'bg-stone-50 border-stone-200 text-stone-400'}`}>
                    {state === 'done' ? '✓' : i + 1}
                  </span>
                  <span className={`text-[9.5px] font-semibold whitespace-nowrap ${i === step ? 'text-klred' : 'text-neutral-400'}`}>
                    {s.title.split(' ')[0]}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step card */}
      <section key={step} className="step-anim bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 mb-4">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-stone-100">
          <span className="text-2xl">{STEPS[step].icon}</span>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Step {step + 1} of {STEPS.length}</div>
            <h2 className="text-lg font-bold text-kldark">{STEPS[step].title}</h2>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[13.5px] mb-4">
            {errors.map((e, i) => <div key={i}>&bull; {e}</div>)}
          </div>
        )}

        {STEPS[step].id === 'student' && (
          <div className="space-y-4">
            <label className="block">
              <span className="block text-[13.5px] font-semibold mb-1.5">Register Number <em className="not-italic text-klred">*</em> <span className="text-[11px] font-medium text-neutral-400">(numbers only)</span></span>
              <input
                className={inputCls} value={regNo} inputMode="numeric" autoComplete="off" maxLength={15}
                onChange={(e) => setRegNo(e.target.value.replace(/\D/g, '').slice(0, 15))}
                placeholder="e.g. 2300031234"
              />
            </label>
            <label className="block">
              <span className="block text-[13.5px] font-semibold mb-1.5">Full Name as per ERP <em className="not-italic text-klred">*</em></span>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name as per ERP" />
            </label>
            <label className="block">
              <span className="block text-[13.5px] font-semibold mb-1.5">Branch / Section <em className="not-italic text-klred">*</em></span>
              <select className={inputCls} value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="">— Select your branch —</option>
                {branches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>
          </div>
        )}

        {STEPS[step].id === 'skills' && (
          <>
            <p className="text-[12.5px] text-neutral-600 mb-3 bg-gradient-to-r from-red-50 to-amber-50 border border-red-100 rounded-xl px-3.5 py-2.5">
              Rate your current expertise. <b className="text-red-600">1–4 Weak</b> &bull; <b className="text-amber-600">5–6 Average</b> &bull; <b className="text-emerald-600">7–10 Strong</b>
            </p>
            {SECTIONS.skills.map((s) => (
              <RatingChips key={s.key} label={s.label} required value={ratings[s.key]} invalid={invalidKeys.has(s.key)} onChange={setRating(s.key)} />
            ))}
            <div className="mt-4">
              <Seg label="Preferred Coding Language" required options={['Java', 'C', 'Python']} value={segs.codingLang} onChange={setSeg('codingLang')} />
            </div>
            <RatingChips label="Coding Skill in that Language" required value={ratings.codingRating} invalid={invalidKeys.has('codingRating')} onChange={setRating('codingRating')} />
          </>
        )}

        {STEPS[step].id === 'oops' && (
          <>
            <Seg label="OOPs Language you know best" required options={['Java', 'C++', 'Python']} value={segs.oopsLang} onChange={setSeg('oopsLang')} />
            {SECTIONS.oops.map((s) => (
              <RatingChips key={s.key} label={s.label} required value={ratings[s.key]} invalid={invalidKeys.has(s.key)} onChange={setRating(s.key)} />
            ))}
          </>
        )}

        {STEPS[step].id === 'topics' && (
          <>
            <p className="text-[12.5px] text-neutral-600 mb-3 bg-gradient-to-r from-red-50 to-emerald-50 border border-red-100 rounded-xl px-3.5 py-2.5">
              Rate your strength in every topic — the color shows your level instantly.
            </p>
            {SECTIONS.topics.map((g) => (
              <div key={g.group} className="mb-2">
                <h3 className="text-sm font-bold text-white bg-gradient-to-r from-kldark to-klred rounded-lg px-3 py-1.5 mt-4 mb-1 inline-block">{g.group}</h3>
                {g.items.map((s) => (
                  <RatingChips key={s.key} label={s.label} required value={ratings[s.key]} invalid={invalidKeys.has(s.key)} onChange={setRating(s.key)} />
                ))}
              </div>
            ))}
          </>
        )}

        {STEPS[step].id === 'written' && (
          <>
            <p className="text-[12.5px] text-neutral-600 mb-3 bg-gradient-to-r from-emerald-50 to-red-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
              How difficult is each area in company written tests? <b className="text-emerald-600">1 = Very Easy</b> &rarr; <b className="text-red-600">10 = Very Difficult</b>
            </p>
            {SECTIONS.written.map((s) => (
              <RatingChips key={s.key} kind="difficulty" label={s.label} required value={ratings[s.key]} invalid={invalidKeys.has(s.key)} onChange={setRating(s.key)} />
            ))}
            <RatingChips
              highlight kind="difficulty"
              label={<>When you see a completely <b>new / unseen problem</b>, how difficult does it feel?</>}
              required value={ratings.newProblemFeel} invalid={invalidKeys.has('newProblemFeel')} onChange={setRating('newProblemFeel')}
            />
          </>
        )}

        {STEPS[step].id === 'training' && (
          <>
            <Seg label="Training received through" required options={['In-house', 'External Vendor', 'Both']} value={segs.trainingSource} onChange={setSeg('trainingSource')} />
            {showVendor && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mt-3">
                <label className="block mb-3">
                  <span className="block text-[13.5px] font-semibold mb-1.5">Vendor Name</span>
                  <input className={inputCls} value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="External vendor / company name" />
                </label>
                <p className="text-[12.5px] text-neutral-500 mb-1">Rate the external vendor training:</p>
                {SECTIONS.vendor.map((s) => (
                  <RatingChips key={s.key} label={s.label} value={ratings[s.key]} onChange={setRating(s.key)} />
                ))}
              </div>
            )}
            {showInternal && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mt-3">
                <p className="text-[12.5px] text-neutral-500 mb-1">Rate the internal (in-house) training:</p>
                {SECTIONS.internal.map((s) => (
                  <RatingChips key={s.key} label={s.label} value={ratings[s.key]} onChange={setRating(s.key)} />
                ))}
              </div>
            )}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mt-3">
              <h3 className="text-sm font-bold text-kldark mb-2">Coding Training / Faculty</h3>
              <label className="block mb-3">
                <span className="block text-[13.5px] font-semibold mb-1.5">Coding Faculty / Trainer Name</span>
                <input className={inputCls} value={coachName} onChange={(e) => setCoachName(e.target.value)} placeholder="Trainer name" />
              </label>
              {SECTIONS.coach.map((s) => (
                <RatingChips key={s.key} label={s.label} required value={ratings[s.key]} invalid={invalidKeys.has(s.key)} onChange={setRating(s.key)} />
              ))}
            </div>
          </>
        )}

        {STEPS[step].id === 'feedback' && (
          <>
            {[
              { key: 'trainingFeedback', label: 'Training Feedback', req: true, ph: 'What went well? What should improve in the training?' },
              { key: 'overallFeedback', label: 'Overall CRT Feedback', req: true, ph: 'Your overall experience of the CRT program...' },
              { key: 'failReason', label: 'In your opinion, why have you (if any) failed in any of the company drives?', req: false, ph: 'Reasons you feel you could not clear the company drives you attempted...' },
            ].map((t) => (
              <label key={t.key} className="block mb-4">
                <span className="block text-[13.5px] font-semibold mb-1.5">{t.label} {t.req && <em className="not-italic text-klred">*</em>}</span>
                <textarea
                  rows={4} className={inputCls} placeholder={t.ph}
                  value={texts[t.key]} onChange={(e) => setTexts((s) => ({ ...s, [t.key]: e.target.value }))}
                />
              </label>
            ))}
          </>
        )}

        {/* Nav buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-stone-100">
          {step > 0 && (
            <button type="button" onClick={goBack}
              className="px-6 py-3.5 rounded-xl border-[1.5px] border-stone-300 text-sm font-bold text-neutral-600 hover:border-klred hover:text-klred transition-colors">
              &larr; Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext}
              className="flex-1 py-3.5 rounded-xl text-[15px] font-bold text-white bg-gradient-to-r from-kldark to-klred shadow-lg shadow-red-200 active:scale-[0.99] transition-all">
              Next: {STEPS[step + 1].title} &rarr;
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={submitting}
              className="flex-1 py-3.5 rounded-xl text-[15px] font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-200 active:scale-[0.99] disabled:opacity-60 transition-all">
              {submitting ? 'Submitting…' : '✓ Submit Feedback'}
            </button>
          )}
        </div>
      </section>

      <footer className="text-center text-xs text-neutral-500 mt-6">KL University — CRT Feedback System</footer>
    </div>
  );
}
