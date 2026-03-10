import type { Metadata } from 'next';
import { changelogEntries } from '@/lib/help-center';
import { BreadcrumbNav } from '@/components/help-center/BreadcrumbNav';
import { ChangelogEntryCard } from '@/components/help-center/ChangelogEntryCard';

export const metadata: Metadata = {
  title: 'Novedades | Centro de Ayuda',
  description:
    'Descubre las últimas novedades, mejoras y correcciones de Inmova. Mantente al día con las nuevas funcionalidades de la plataforma.',
};

export default function ChangelogPage() {
  const sortedEntries = [...changelogEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="container px-4 py-8">
      <BreadcrumbNav
        items={[
          { label: 'Centro de Ayuda', href: '/ayuda' },
          { label: 'Novedades' },
        ]}
      />

      <h1 className="mt-6 text-3xl font-bold tracking-tight mb-10">
        Novedades y mejoras
      </h1>

      <div className="space-y-6 max-w-3xl">
        {sortedEntries.map((entry) => (
          <ChangelogEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
