// ISR - Revalidate every 5 minutes
export const revalidate = 300;

export default function ProveedoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
