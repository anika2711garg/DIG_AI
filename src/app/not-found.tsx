import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#64748B]">404</p>
      <h1 className="text-2xl font-semibold">This route is not in the state machine.</h1>
      <Button href="/" variant="white">
        Back to NEONE
      </Button>
    </main>
  );
}
