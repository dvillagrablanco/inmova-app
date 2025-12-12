// Force dynamic rendering for BI
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function BILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
