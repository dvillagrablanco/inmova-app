// ISR - Revalidate every 5 minutes
export const revalidate = 300;

export default function PagosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
