// Force dynamic rendering for operator portal
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function OperadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
