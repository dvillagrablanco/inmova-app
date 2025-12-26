"use client";

import { notFound } from "next/navigation";
import { PresentationViewer } from "@/components/presentation/PresentationViewer";
import { PRESENTATIONS } from "@/lib/presentations/data";

interface PageProps {
  params: {
    slug: string;
  };
}

export default function PresentationPage({ params }: PageProps) {
  const presentation = PRESENTATIONS[params.slug];

  if (!presentation) {
    notFound();
  }

  return (
    <PresentationViewer presentation={presentation} />
  );
}
