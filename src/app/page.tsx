import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="text-3xl font-bold">Muzenza Group Polska</h1>
      <p className="mt-3 text-neutral-600">
        Student portal: manage your graduation timeline, check into class with a daily QR code, and shop
        official Muzenza apparel for your section.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/register" className="btn-primary">
          Create your account
        </Link>
        <Link href="/login" className="btn-secondary">
          Log in
        </Link>
      </div>
    </div>
  );
}
