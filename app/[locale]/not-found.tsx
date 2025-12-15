'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function LocaleNotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-black text-gradient">{t('title')}</h1>
        <p className="text-xl text-muted-foreground">{t('description')}</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 gradient-primary text-white rounded-lg font-bold"
        >
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
