import 'server-only';

export class EnvUtils {
  /** Reads `APP_ENV` on every call, so a mid-process env change is never missed. */
  public isProduction(): boolean {
    return process.env.APP_ENV === 'production';
  }
}

export const envUtils = new EnvUtils();
