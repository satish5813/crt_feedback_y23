import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Logo chain: kl-logo.png (drop your own) -> kl-logo.svg (bundled) -> KL monogram
export default function BrandBar({ compact = false }) {
  const [src, setSrc] = useState('/kl-logo.png');
  const { pathname } = useLocation();
  const onAdmin = pathname.startsWith('/admin');

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 border-t-4 border-t-klred shadow-sm flex items-center flex-wrap gap-x-3 sm:gap-x-4 gap-y-2.5 ${compact ? 'p-3' : 'p-3.5 sm:p-4'}`}>
      {src ? (
        <img
          src={src}
          alt="KL University"
          className={compact ? 'h-10 w-auto' : 'h-9 sm:h-14 w-auto'}
          onError={() => setSrc(src === '/kl-logo.png' ? '/kl-logo.svg' : '')}
        />
      ) : (
        <div className={`${compact ? 'h-10 w-10 text-lg' : 'h-10 w-10 sm:h-14 sm:w-14 text-lg sm:text-2xl'} rounded-xl bg-gradient-to-br from-klred to-kldark text-white font-black flex items-center justify-center font-serif`}>
          KL
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[8.5px] sm:text-[10.5px] tracking-[0.1em] sm:tracking-[0.14em] uppercase text-neutral-500 font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
          Koneru Lakshmaiah Education Foundation
        </div>
        <div className="font-extrabold text-klred leading-tight text-[15px] sm:text-xl whitespace-nowrap" style={{ fontFamily: 'var(--font-display)' }}>
          KL University{' '}
          <span className="text-[9.5px] sm:text-xs font-semibold text-neutral-700" style={{ fontFamily: 'var(--font-sans)' }}>(Deemed to be University)</span>
        </div>
        {!compact && (
          <div className="hidden sm:block text-[10.5px] text-neutral-500 tracking-wide">
            Knowledge &bull; Leadership &bull; Universality
          </div>
        )}
      </div>
      {!onAdmin && (
        <Link
          to="/admin"
          className="no-print w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-3 py-2.5 sm:px-4 rounded-xl text-[12.5px] sm:text-[13px] font-bold text-klred border-[1.5px] border-klred/40 hover:bg-klred hover:text-white transition-colors"
        >
          &#128274; Admin Login
        </Link>
      )}
    </div>
  );
}
