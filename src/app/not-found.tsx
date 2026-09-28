import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg p-10 py-24">
      <p className="eyebrow">404 · Resource not found</p>
      <h1 className="mt-3 text-2xl font-semibold">This trail ends here.</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        The requested page or investigation does not exist.
      </p>
      <Link href="/dashboard" className="mt-6 inline-block text-sm text-primary">
        Return to overview →
      </Link>
    </div>
  );
}
