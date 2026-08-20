'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Product = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  cities: { city: { name: string } }[];
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency }).format(cents / 100);
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then(setProducts);
  }, []);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Store</h1>
      <p className="mb-6 text-sm text-neutral-600">
        Showing apparel available to your section, plus items from the national Polish section.
      </p>

      {!products ? (
        <p>Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-neutral-500">No products available for your section yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p.id} href={`/store/${p.id}`} className="card block hover:shadow-md">
              <div className="mb-3 flex h-40 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="h-full w-full rounded-lg object-cover" />
                ) : (
                  'No image'
                )}
              </div>
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm text-neutral-600 line-clamp-2">{p.description}</p>
              <p className="mt-2 font-bold text-muzenza-red">{money(p.priceCents, p.currency)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
