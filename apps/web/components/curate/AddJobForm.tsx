'use client';

import { useActionState } from 'react';
import { addCuratedJob, type AddState } from '@/app/[locale]/curate/actions';

const field = 'mt-1 w-full rounded-[4px] border border-agre-sage/40 bg-white px-3 py-2 font-montserrat text-[15px] focus:border-agre-navy focus:outline-none';
const label = 'block font-montserrat text-[13px] font-medium text-agre-ink';

/** Curator inbox form (TR-first; curators are the Agre team). */
export function AddJobForm() {
  const [state, action, pending] = useActionState<AddState, FormData>(addCuratedJob, { ok: false, message: '' });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-poppins text-2xl font-semibold text-agre-ink">İlan ekle</h1>
      <p className="mt-2 font-montserrat text-sm text-agre-muted">
        LinkedIn, Kariyer.net, YeniBirİş veya Indeed’de bulduğun ilanın bağlantısını yapıştır ve temel alanları doldur.
        Sayfa otomatik okunmaz; kart, kullanıcıyı orijinal ilana yönlendirir. Aynı ilan başka kaynaktan gelmişse otomatik birleştirilir.
      </p>

      <form action={action} className="mt-6 grid gap-4">
        <div><label className={label} htmlFor="url">İlan bağlantısı *</label>
          <input className={field} id="url" name="url" type="url" required placeholder="https://www.kariyer.net/is-ilani/..." /></div>
        <div><label className={label} htmlFor="title">Pozisyon *</label>
          <input className={field} id="title" name="title" required /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={label} htmlFor="company">Kurum *</label>
            <input className={field} id="company" name="company" required /></div>
          <div><label className={label} htmlFor="location">Konum *</label>
            <input className={field} id="location" name="location" required placeholder="Bodrum, Muğla" /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className={label} htmlFor="employment">Çalışma şekli</label>
            <select className={field} id="employment" name="employment" defaultValue="">
              <option value="">Tam zamanlı</option><option>Yarı zamanlı</option><option>Sezonluk</option>
              <option>Staj</option><option>Proje / serbest</option><option>Uzaktan</option><option>Hibrit</option>
            </select></div>
          <div><label className={label} htmlFor="postedAt">Yayın tarihi</label>
            <input className={field} id="postedAt" name="postedAt" type="date" /></div>
          <div><label className={label} htmlFor="validThrough">Son başvuru</label>
            <input className={field} id="validThrough" name="validThrough" type="date" /></div>
        </div>
        <div><label className={label} htmlFor="note">Kısa not (karta gösterilmez, en fazla 240 karakter)</label>
          <textarea className={field} id="note" name="note" maxLength={240} rows={2} /></div>

        <button type="submit" disabled={pending}
          className="h-11 justify-self-start rounded-[4px] bg-agre-lime px-5 font-poppins font-medium text-agre-navy disabled:opacity-60">
          {pending ? 'Ekleniyor…' : 'Ekle'}
        </button>
        {state.message && (
          <p role="status" className={`font-montserrat text-sm ${state.ok ? 'text-agre-navy' : 'text-red-700'}`}>{state.message}</p>
        )}
      </form>
    </main>
  );
}
