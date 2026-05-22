import { GameClient } from "@/components/GameClient";

export default async function GamePage({
  params,
}: {
  params: Promise<{ songId: string }>;
}) {
  const { songId } = await params;
  return <GameClient songId={songId} />;
}
