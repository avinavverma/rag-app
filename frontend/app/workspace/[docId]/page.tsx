interface WorkspacePageProps {
  params: Promise<{
    docId: string;
  }>;
}

export default async function WorkspacePage({
  params,
}: WorkspacePageProps) {
  const { docId } = await params;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Workspace
      </h1>

      <p className="text-gray-500 break-all">
        Document ID: {docId}
      </p>

      <div className="border rounded-lg p-6 text-gray-500">
        PDF viewer and chat interface coming in Segment 8.
      </div>
    </main>
  );
}
