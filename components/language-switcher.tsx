'use client';

import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { locales, localeNames, type Locale } from '@/lib/i18n/config';
import { useLocale } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';

const localeEmoji: Record<Locale, string> = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 sm:gap-2 font-bold glass-strong hover:bg-muted/80 transition-all duration-200 px-2 sm:px-3"
        >
          <Globe className="h-4 w-4 hidden sm:block" />
          <span className="hidden sm:inline">{localeEmoji[locale]} {locale.toUpperCase()}</span>
          <span className="sm:hidden text-base">{localeEmoji[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="glass-strong border-white/10 rounded-xl p-2 min-w-[160px] space-y-1"
      >
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className={`
              flex items-center justify-between gap-3
              py-3 px-4 rounded-lg cursor-pointer
              transition-all duration-200
              ${locale === loc
                ? 'bg-primary/20 text-primary font-semibold'
                : 'hover:bg-muted/80'
              }
            `}
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">{localeEmoji[loc]}</span>
              <span>{localeNames[loc]}</span>
            </span>
            {locale === loc && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
