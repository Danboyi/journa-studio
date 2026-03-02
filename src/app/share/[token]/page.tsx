import { ShareViewer } from "@/components/share-viewer";

export default async function SharedCompositionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <ShareViewer token={token} />;
}
