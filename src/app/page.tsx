export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
        Issue &rarr; PR
      </p>
      <h1 className="text-2xl font-semibold">Frontend — clean slate</h1>
      <p className="max-w-md text-sm text-neutral-500">
        The previous UI has been removed. The new frontend for the issue-to-PR agent
        will be built here from scratch.
      </p>
    </main>
  );
}
