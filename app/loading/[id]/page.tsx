import LoadingState from "@/components/LoadingState";

export default function LoadingPage({
  params,
}: {
  params: { id: string };
}) {
  return <LoadingState jobId={params.id} />;
}
