import { useEffect, useMemo, useRef, useState } from 'react';
import BrandBar from '../components/BrandBar.jsx';
import RatingChips from '../components/RatingChips.jsx';
import Seg from '../components/Seg.jsx';
import { api, getJSON } from '../api.js';
import { BRANCHES_FALLBACK, SECTIONS, REQUIRED_RATINGS } from '../constants.js';

function Card({ n, title, children }) {
  return (
    <section className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 mb-4">
      <h2 className="flex items-center gap-2.5 text-[17px] font-bold text-kldark mb-3">
        <span className="w-7 h-7 rounded-full bg-kldark text-white text-sm flex items-center justify-center shrink-0">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function FeedbackForm() {
  const [branches, setBranches] = useState(BRANCHES_FALLBACK);
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
  const errRef = useRef(null);

  useEffect(() => {
    getJSON('/api/config').then((c) => c.branches && setBranches(c.branches)).catch(() => {});
  }, []);

  const setRating = (k) => (v) => setRatings((s) => ({ ...s, [k]: v }));
  const setSeg = (k) => (v) => setSegs((s) => ({ ...s, [k]: v }));

  const progress = useMemo(() => {
    const total = REQUIRED_RATINGS.length + 3;
    let d = REQUIRED_RATINGS.filter((k) => ratings[k]).length;
    if (segs.codingLang) d++;
    if (segs.oopsLang) d++;
    if (segs.trainingSource) d++;
    return Math.min(100, Math.round((d / total) * 100));
  }, [ratings, segs]);

  const showVendor = segs.trainingSource === 'External Vendor' || segs.trainingSource === 'Both';
  const showInternal = segs.trainingSource === 'In-house' || segs.trainingSource === 'Both';

  async function submit(e) {
    e.preventDefault();
    const errs = [];
    if (!regNo.trim()) errs.push('Enter your register number');
    if (!name.trim()) errs.push('Enter your name');
    if (!branch) errs.push('Select your branch');
    if (!segs.codingLang) errs.push('Select your preferred coding language (Section 2)');
    if (!segs.oopsLang) errs.push('Select your OOPs language (Section 3)');
    if (!segs.trainingSource) errs.push('Select how training was received (Section 6)');
    if (!texts.trainingFeedback.trim()) errs.push('Write your training feedback (Section 7)');
    if (!texts.overallFeedback.trim()) errs.push('Write your overall CRT feedback (Section 7)');
    const missing = new Set(REQUIRED_RATINGS.filter((k) => !ratings[k]));
    if (missing.size) errs.push('Please answer all required (*) rating questions — missing ones are highlighted in red');
    setInvalidKeys(missing);
    setErrors(errs);
    if (errs.length) {
      setTimeout(() => errRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }

    const payload = {
      regNo: regNo.trim(), name: name.trim(), branch,
      ...ratings, ...segs, vendorName, coachName, ...texts,
    };
    setSubmitting(true);
    try {
      let res = await fetch(api('/api/feedback'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (res.status === 409) {
        if (window.confirm('Feedback was already submitted for this register number. Replace the previous submission?')) {
          res = await fetch(api('/api/feedback'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, allowResubmit: true }),
          });
        } else { setSubmitting(false); return; }
      }
      const data = await res.json();
      if (data.ok) { setDone(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else throw new Error((data.errors || ['Submission failed']).join(', '));
    } catch (err) {
      setErrors(['Could not submit: ' + err.message]);
      setTimeout(() => errRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <BrandBar />
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm text-center p-12 mt-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 text-klred text-3xl flex items-center justify-center">&#10004;</div>
          <h2 className="text-xl font-bold text-kldark mb-2">Thank you!</h2>
          <p className="text-neutral-600">Your feedback has been submitted successfully. It will help us make the CRT program better.</p>
        </div>
      </div>
    );
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-[15px] border-[1.5px] border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:border-klred focus:outline-none transition-colors';

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <BrandBar />

      <header className="rounded-2xl mt-3 mb-4 p-6 text-white bg-gradient-to-br from-kldeep via-kldark to-klred shadow-lg shadow-red-900/25 sticky top-0 z-20">
        <span className="inline-block text-[11px] tracking-[0.15em] uppercase bg-white/15 border border-white/25 px-3 py-1 rounded-full mb-2">
          Campus Recruitment Training
        </span>
        <h1 className="text-2xl font-bold mb-1">CRT Student Feedback Form</h1>
        <p className="text-[13px] opacity-90">Your honest feedback helps us improve the training program. All ratings are on a scale of 1 (low) to 10 (high).</p>
        <div className="h-1.5 bg-white/25 rounded-full mt-3.5 overflow-hidden">
          <div className="h-full bg-klgold rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <form onSubmit={submit} noValidate>
        <Card n={1} title="Student Details">
          <div className="grid sm:grid-cols-2 gap-3 mb-3.5">
            <label className="block">
              <span className="block text-[13.5px] font-semibold mb-1.5">Register Number <em className="not-italic text-klred">*</em></span>
              <input className={inputCls} value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="e.g. 22B81A0501" />
            </label>
            <label className="block">
              <span className="block text-[13.5px] font-semibold mb-1.5">Full Name as per ERP <em className="not-italic text-klred">*</em></span>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name as per ERP" />
            </label>
          </div>
          <label className="block">
            <span className="block text-[13.5px] font-semibold mb-1.5">Branch / Section <em className="not-italic text-klred">*</em></span>
            <select className={inputCls} value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">— Select your branch —</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
        </Card>

        <Card n={2} title="Skill Self-Assessment">
          <p className="text-[12.5px] text-neutral-500 mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            Rate your current expertise level. <b>1 = Beginner</b>, <b>10 = Expert</b>
          </p>
          {SECTIONS.skills.map((s) => (
            <RatingChips key={s.key} label={s.label} required value={ratings[s.key]} invalid={invalidKeys.has(s.key)} onChange={setRating(s.key)} />
          ))}
          <div className="mt-3">
            <Seg label="Preferred Coding Language" required options={['Java', 'C', 'Python']} value={segs.codingLang} onChange={setSeg('codingLang')} />
          </div>
          <RatingChips label="Coding Skill in that Language" required value={ratings.codingRating} invalid={invalidKeys.has('codingRating')} onChange={setRating('codingRating')} />
        </Card>

        <Card n={3} title="OOPs — Concept-wise Rating">
          <Seg label="OOPs Language you know best" required options={['Java', 'C++', 'Python']} value={segs.oopsLang} onChange={setSeg('oopsLang')} />
          {SECTIONS.oops.map((s) => (
            <RatingChips key={s.key} label={s.label} required value={ratings[s.key]} invalid={invalidKeys.has(s.key)} onChange={setRating(s.key)} />
          ))}
        </Card>

        <Card n={4} title="Subject Topic-wise Rating (Strength / Weakness)">
          <p className="text-[12.5px] text-neutral-500 mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            Rate your strength in every topic. <b>1–4 = Weak</b>, <b>5–6 = Average</b>, <b>7–10 = Strong</b>.
          </p>
          {SECTIONS.topics.map((g) => (
            <div key={g.group} className="mb-3">
              <h3 className="text-sm font-bold text-kldark mt-3 mb-1">{g.group}</h3>
              {g.items.map((s) => (
                <RatingChips key={s.key} label={s.label} required showTag value={ratings[s.key]} invalid={invalidKeys.has(s.key)} onChange={setRating(s.key)} />
              ))}
            </div>
          ))}
        </Card>

        <Card n={5} title="Company Written Test Experience">
          <p className="text-[12.5px] text-neutral-500 mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            How difficult do you find each area in company written tests? <b>1 = Very Easy</b>, <b>10 = Very Difficult</b>
          </p>
          {SECTIONS.written.map((s) => (
            <RatingChips key={s.key} label={s.label} required value={ratings[s.key]} invalid={invalidKeys.has(s.key)} onChange={setRating(s.key)} />
          ))}
          <RatingChips
            highlight
            label={<>When you see a completely <b>new / unseen problem</b>, how difficult does it feel?</>}
            required value={ratings.newProblemFeel} invalid={invalidKeys.has('newProblemFeel')} onChange={setRating('newProblemFeel')}
          />
        </Card>

        <Card n={6} title="Training Feedback">
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
        </Card>

        <Card n={7} title="Your Feedback">
          {[
            { key: 'trainingFeedback', label: 'Training Feedback', req: true, ph: 'What went well? What should improve in the training?' },
            { key: 'overallFeedback', label: 'Overall CRT Feedback', req: true, ph: 'Your overall experience of the CRT program...' },
            { key: 'failReason', label: 'In your opinion, why have you (if any) failed in any of the company drives?', req: false, ph: 'Reasons you feel you could not clear the company drives you attempted...' },
          ].map((t) => (
            <label key={t.key} className="block mb-3.5">
              <span className="block text-[13.5px] font-semibold mb-1.5">{t.label} {t.req && <em className="not-italic text-klred">*</em>}</span>
              <textarea
                rows={4} className={inputCls} placeholder={t.ph}
                value={texts[t.key]} onChange={(e) => setTexts((s) => ({ ...s, [t.key]: e.target.value }))}
              />
            </label>
          ))}
        </Card>

        {errors.length > 0 && (
          <div ref={errRef} className="bg-red-50 border border-red-200 text-klred rounded-xl px-4 py-3 text-[13.5px] mb-3">
            {errors.map((e, i) => <div key={i}>&bull; {e}</div>)}
          </div>
        )}

        <button
          type="submit" disabled={submitting}
          className="w-full py-4 text-base font-bold text-white rounded-2xl bg-gradient-to-r from-kldark to-klred shadow-lg shadow-red-300 active:scale-[0.99] disabled:opacity-60 transition-all"
        >
          {submitting ? 'Submitting…' : 'Submit Feedback'}
        </button>
      </form>

      <footer className="text-center text-xs text-neutral-500 mt-6">KL University — CRT Feedback System</footer>
    </div>
  );
}
