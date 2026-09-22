'use client';

import { useFormik } from 'formik';
import { Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/libs/shadcn-ui/alert-dialog';
import { Button } from '@/libs/shadcn-ui/button';
import { Field, FieldError, FieldLabel } from '@/libs/shadcn-ui/field';
import { Input } from '@/libs/shadcn-ui/input';
import { Spinner } from '@/libs/shadcn-ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/libs/shadcn-ui/table';
import { Typography } from '@/libs/shadcn-ui/typography';
import { logUtils } from '@/shared/utils/logUtils';

import type { CacheSearchFormValues } from '../../_schemas/cacheSearchSchema';
import {
  createCacheSearchSchema,
  MAX_CACHE_PATTERN_LENGTH,
} from '../../_schemas/cacheSearchSchema';

/** A single cache entry returned by `GET /cache?pattern=`. */
export interface CacheEntry {
  key: string;
  value: unknown;
}

/** Result of deleting a single cache entry by exact key. */
export interface CacheDeleteResult {
  key: string;
  deleted: boolean;
}

/** Outcome of a cache Server Action: typed success, or a short reason the client maps to text. */
export type CacheActionResult<T> =
  { ok: true; data: T } | { ok: false; error: 'production' | 'unexpected' };

export interface CacheExplorerProps {
  searchAction: (pattern: string) => Promise<CacheActionResult<CacheEntry[]>>;
  deleteAction: (key: string) => Promise<CacheActionResult<CacheDeleteResult>>;
}

export function CacheExplorer(props: CacheExplorerProps) {
  const { searchAction, deleteAction } = props;
  const t = useTranslations('cache');
  const [results, setResults] = useState<CacheEntry[] | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const validationSchema = createCacheSearchSchema(t);

  const formik = useFormik<CacheSearchFormValues>({
    initialValues: { pattern: '' },
    validationSchema,
    onSubmit: (values) => {
      startSearch(async () => {
        try {
          const result = await searchAction(values.pattern);
          if (result.ok) {
            setResults(result.data);
            return;
          }
          toast.error(
            result.error === 'production' ? t('errorsProduction') : t('errorsSearchFailed'),
          );
        } catch (error) {
          logUtils.error(error);
          toast.error(t('errorsSearchFailed'));
        }
      });
    },
  });

  const handleDelete = async (key: string) => {
    setDeletingKey(key);
    try {
      const result = await deleteAction(key);
      if (!result.ok) {
        toast.error(
          result.error === 'production' ? t('errorsProduction') : t('errorsDeleteFailed'),
        );
        return;
      }
      setResults((current) => current?.filter((entry) => entry.key !== key) ?? current);
      if (result.data.deleted) {
        toast.success(t('deleteSuccess', { key }));
      } else {
        toast.info(t('deleteNotFound', { key }));
      }
    } catch (error) {
      logUtils.error(error);
      toast.error(t('errorsDeleteFailed'));
    } finally {
      setDeletingKey(null);
    }
  };

  const hasPatternError = !!(formik.touched.pattern && formik.errors.pattern);

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-4">
        <Field className="max-w-md" data-invalid={hasPatternError}>
          <FieldLabel htmlFor="cache-pattern">{t('formPatternLabel')}</FieldLabel>
          <Input
            id="cache-pattern"
            name="pattern"
            placeholder={t('formPatternPlaceholder')}
            maxLength={MAX_CACHE_PATTERN_LENGTH}
            value={formik.values.pattern}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={hasPatternError}
          />
          <FieldError errors={hasPatternError ? [{ message: formik.errors.pattern }] : []} />
        </Field>
        <Button type="submit" disabled={isSearching} className="w-fit">
          {isSearching ? <Spinner /> : null}
          {t('formSearch')}
        </Button>
      </form>

      {results !== null &&
        (results.length === 0 ? (
          <Typography variant="muted">{t('empty')}</Typography>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableKey')}</TableHead>
                <TableHead>{t('tableValue')}</TableHead>
                <TableHead className="text-right">{t('tableActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((entry) => (
                <TableRow key={entry.key}>
                  <TableCell className="font-mono">{entry.key}</TableCell>
                  <TableCell>
                    <pre className="max-w-md overflow-x-auto text-xs">
                      {JSON.stringify(entry.value, null, 2)}
                    </pre>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          aria-label={t('deleteAria', { key: entry.key })}
                          disabled={deletingKey === entry.key}
                        >
                          {deletingKey === entry.key ? <Spinner /> : <Trash2Icon />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('deleteConfirmDescription', { key: entry.key })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void handleDelete(entry.key)}>
                            {t('confirmDelete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))}
    </div>
  );
}
