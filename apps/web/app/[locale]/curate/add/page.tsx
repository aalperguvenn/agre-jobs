import { requireCurator } from '@/lib/auth';
import { AddJobForm } from '@/components/curate/AddJobForm';

export const dynamic = 'force-dynamic';

/** Curator inbox: only curators see the form (see lib/auth.ts). */
export default async function AddCuratedJobPage() {
  await requireCurator();
  return <AddJobForm />;
}
