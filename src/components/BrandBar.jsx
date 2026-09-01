import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Logo chain: kl-logo.png (drop your own) -> kl-logo.svg (bundled) -> KL monogram
export default function BrandBar({ compact = false }) {
  const [src, setSrc] = useState('/kl-logo.png');
  const { pathname } = useLocation();
  const onAdmin = pathname.startsWith('/admin');

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 border-t-4 border-t-klred shadow-sm flex items-center gap-4 ${compact ? 'p-3' : 'p-4'}`}>
      {src ? (
        <img
          src={src}
          alt="KL University"
          className={compact ? 'h-10 w-auto' : 'h-14 w-auto'}
          onError={() => setSrc(src === '/kl-logo.png' ? '/kl-logo.svg' : '')}
        />
      ) : (
        <div className={`${compact ? 'h-10 w-10 text-lg' : 'h-14 w-14 text-2xl'} rounded-xl bg-gradient-to-br from-klred to-kldark text-white font-black flex items-center justify-center font-serif`}>
          KL
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[10.5px] tracking-[0.14em] uppercase text-neutral-500 font-semibold">
          Koneru Lakshmaiah Education Foundation
        </div>
        <div className={`font-display font-extrabold text-klred leading-tight ${compact ? 'text-base' : 'text-xl'}`} style={{ fontFamily: 'var(--font-display)' }}>
          KL University{' '}
          <span className="text-xs font-semibold text-neutral-700" style={{ fontFamily: 'var(--font-sans)' }}>(Deemed to be University)</span>
        </div>
        {!compact && (
          <div className="text-[10.5px] text-neutral-500 tracking-wide">
            Knowledge &bull; Leadership &bull; Universality
          </div>
        )}
      </div>
      {!onAdmin && (
        <Link
          to="/admin"
          className="no-print shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold text-klred border-[1.5px] border-klred/40 hover:bg-klred hover:text-white transition-colors"
        >
          &#128274; Admin Login
        </Link>
      )}
    </div>
  );
}
