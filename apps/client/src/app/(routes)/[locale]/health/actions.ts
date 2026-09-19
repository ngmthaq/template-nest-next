import 'server-only';

import type { HealthResult } from '@/components/organisms/HealthStatusPanel';
import { apiEndpoints } from '@/constants/apiEndpoints';
import { httpUtils } from '@/utils/httpUtils';
import {
  HttpUtilsNetworkError,
  HttpUtilsResponseError,
  HttpUtilsTimeoutError,
} from '@/utils/httpUtilsHelper';
import { logUtils } from '@/utils/logUtils';

/** A `503` still carries the full report in its body; a network failure means "unreachable". */
export async function fetchHealthReport(): Promise<HealthResult | null> {
  try {
    return await httpUtils.get<HealthResult>(apiEndpoints.get.health);
  } catch (error) {
    if (error instanceof HttpUtilsResponseError && error.status === 503) {
      return error.body as HealthResult;
    }
    if (error instanceof HttpUtilsNetworkError || error instanceof HttpUtilsTimeoutError) {
      return null;
    }
    logUtils.error(error);
    return null;
  }
}
