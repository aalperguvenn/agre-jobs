import Image from 'next/image';
import { Link } from '@/i18n/routing';

/** Official "agre" wordmark (dusty lime) + "jobs" set in Poppins, divided by a sage rule. */
export function Logo({ byline, large = false }: { byline?: string; large?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5 no-underline" aria-label="Agre Jobs">
      <Image
        src="/brand/logo_dustylime.png"
        alt=""
        width={1805}
        height={612}
        priority
        className={large ? 'h-8 w-auto' : 'h-[26px] w-auto'}
      />
      <span
        aria-hidden="true"
        className={`border-l border-agre-sage pl-2.5 font-poppins leading-none text-agre-lime ${large ? 'text-[22px]' : 'mt-0.5 text-[19px]'}`}
      >
        jobs
      </span>
      {byline && <span className="ml-1 hidden text-[11px] leading-tight text-[#A9AFA0] lg:inline">{byline}</span>}
    </Link>
  );
}
