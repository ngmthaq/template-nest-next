import { connection } from 'next/server';

import { fetchHealthReport } from '../../actions';
import { HealthStatusPanel } from '../HealthStatusPanel';

/** Reads the live report at request time, kept out of the static shell so the route can prerender. */
export async function HealthReportAsync() {
  await connection();
  const report = await fetchHealthReport();

  return <HealthStatusPanel report={report} />;
}
