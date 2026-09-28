"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-6 py-24">
      <p className="eyebrow">Connection interrupted</p>
      <h1 className="mt-3 text-2xl font-semibold">We couldn’t load this view.</h1>
      <p className="my-5 text-sm leading-relaxed text-muted-foreground">
        Please retry. If the problem continues, check that the application and database are running.
        Your saved investigations are preserved.
      </p>
      <div className="flex items-center gap-5">
        <Button onClick={reset}>Try again</Button>
        <Link className="text-sm text-primary" href="/login">
          Return to sign in
        </Link>
      </div>
    </div>
  );
}
