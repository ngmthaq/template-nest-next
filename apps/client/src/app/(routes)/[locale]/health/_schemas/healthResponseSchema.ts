import type { InferType } from 'yup';
import * as Yup from 'yup';

/** Liveness result for a single dependency, as returned by `GET /health`. */
export const indicatorStatusSchema = Yup.object({
  status: Yup.string()
    .oneOf(['up', 'down'] as const)
    .required(),
  error: Yup.string(),
  uptime: Yup.number(),
});

export type IndicatorStatus = InferType<typeof indicatorStatusSchema>;

/** Builds an object schema that validates every key found on `value` as an indicator status. */
function buildInfoSchema(value: unknown): Yup.ObjectSchema<Record<string, IndicatorStatus>> {
  const keys = value && typeof value === 'object' ? Object.keys(value) : [];
  const shape = Object.fromEntries(keys.map((key) => [key, indicatorStatusSchema]));
  return Yup.object(shape).required() as unknown as Yup.ObjectSchema<
    Record<string, IndicatorStatus>
  >;
}

/** Aggregated health report across every checked dependency, as returned by `GET /health`. */
export const healthResultSchema = Yup.object({
  status: Yup.string()
    .oneOf(['ok', 'error'] as const)
    .required(),
  info: Yup.lazy(buildInfoSchema),
});

export type HealthResult = InferType<typeof healthResultSchema>;
