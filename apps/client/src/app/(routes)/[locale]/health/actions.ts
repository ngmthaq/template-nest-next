import 'server-only';

import { httpUtils } from '@/shared/utils/httpUtils';
import {
  HttpUtilsNetworkError,
  HttpUtilsResponseError,
  HttpUtilsTimeoutError,
} from '@/shared/utils/httpUtilsHelper';
import { logUtils } from '@/shared/utils/logUtils';

import { apiEndpoints } from './_constants/apiEndpoints';
import { type HealthResult, healthResultSchema } from './_schemas/healthResponseSchema';

/** A `503` still carries the full report in its body; a network failure means "unreachable". */
export async function fetchHealthReport(): Promise<HealthResult | null> {
  try {
    return await httpUtils.get(apiEndpoints.get.health, undefined, { schema: healthResultSchema });
  } catch (error) {
    if (error instanceof HttpUtilsResponseError && error.status === 503) {
      try {
        return await httpUtils.parse(healthResultSchema, error.body);
      } catch (parseError) {
        logUtils.error(parseError);
        return null;
      }
    }
    if (error instanceof HttpUtilsNetworkError || error instanceof HttpUtilsTimeoutError) {
      return null;
    }
    logUtils.error(error);
    return null;
  }
}
