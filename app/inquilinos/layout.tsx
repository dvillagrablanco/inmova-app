// ISR - Revalidate every 5 minutes
export const revalidate = 300;

export default function InquilinosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
