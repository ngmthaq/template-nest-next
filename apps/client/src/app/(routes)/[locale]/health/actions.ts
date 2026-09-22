import 'server-only';

import { httpUtils } from '@/shared/utils/httpUtils';
import {
  HttpUtilsNetworkError,
  HttpUtilsResponseError,
  HttpUtilsTimeoutError,
} from '@/shared/utils/httpUtilsHelper';
import { logUtils } from '@/shared/utils/logUtils';

import type { HealthResult } from './_components/HealthStatusPanel';
import { apiEndpoints } from './_constants/apiEndpoints';

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
