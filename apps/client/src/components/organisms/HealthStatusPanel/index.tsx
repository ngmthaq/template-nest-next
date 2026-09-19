import { useTranslations } from 'next-intl';

import { Badge } from '@/libs/shadcn-ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/libs/shadcn-ui/table';
import { Typography } from '@/libs/shadcn-ui/typography';

/** Liveness result for a single dependency, as returned by `GET /health`. */
export interface IndicatorStatus {
  status: 'up' | 'down';
  error?: string;
  uptime?: number;
}

/** Aggregated health report across every checked dependency. */
export interface HealthResult {
  status: 'ok' | 'error';
  info: Record<string, IndicatorStatus>;
}

export interface HealthStatusPanelProps {
  /** `null` means the API could not be reached at all (network error, timeout). */
  report: HealthResult | null;
}

export function HealthStatusPanel(props: HealthStatusPanelProps) {
  const { report } = props;
  const t = useTranslations('health');

  if (!report) {
    return (
      <output className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
        <Badge variant="destructive">{t('unreachableTitle')}</Badge>
        <Typography variant="muted">{t('unreachableDescription')}</Typography>
      </output>
    );
  }

  const indicatorNames = Object.keys(report.info);
  const indicatorLabels: Record<string, string> = {
    server: t('indicatorsServer'),
    mysql: t('indicatorsMysql'),
    redis: t('indicatorsRedis'),
  };

  return (
    <div className="flex flex-col gap-4">
      <output className="flex items-center gap-2">
        <Badge variant={report.status === 'ok' ? 'default' : 'destructive'}>
          {report.status === 'ok' ? t('overallOk') : t('overallError')}
        </Badge>
      </output>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('tableIndicator')}</TableHead>
            <TableHead>{t('tableStatus')}</TableHead>
            <TableHead>{t('tableUptime')}</TableHead>
            <TableHead>{t('tableError')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {indicatorNames.map((name) => {
            const indicator = report.info[name];
            const label = indicatorLabels[name] ?? name;

            return (
              <TableRow key={name}>
                <TableCell>{label}</TableCell>
                <TableCell>
                  <Badge variant={indicator.status === 'up' ? 'default' : 'destructive'}>
                    {indicator.status === 'up' ? t('statusUp') : t('statusDown')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {typeof indicator.uptime === 'number'
                    ? t('uptimeValue', { seconds: Math.round(indicator.uptime) })
                    : t('notAvailable')}
                </TableCell>
                <TableCell>{indicator.error ?? t('notAvailable')}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
