'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';

type Product = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  sizes: string[];
  canBuy: boolean;
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency }).format(cents / 100);
}

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((p) => {
        setProduct(p);
        setSize(p.sizes?.[0] || '');
      });
  }, [productId]);

  if (!product) return <p>Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex h-64 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full rounded-xl object-cover" />
        ) : (
          'No image'
        )}
      </div>
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="mt-1 text-lg font-semibold text-muzenza-red">{money(product.priceCents, product.currency)}</p>
      <p className="mt-3 text-neutral-700">{product.description}</p>

      {!product.canBuy ? (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          This product is not available for purchase from your section.
        </p>
      ) : (
        <div className="mt-6 card">
          <label className="label">Size</label>
          <select className="input mb-4" value={size} onChange={(e) => setSize(e.target.value)}>
            {product.sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label className="label">Quantity</label>
          <input
            className="input mb-4"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
          />

          <button
            className="btn-primary w-full"
            onClick={() => {
              addItem({ productId: product.id, name: product.name, priceCents: product.priceCents, size, quantity: qty });
              setAdded(true);
              setTimeout(() => router.push('/cart'), 500);
            }}
          >
            {added ? 'Added! Going to cart…' : 'Add to cart'}
          </button>
        </div>
      )}
    </div>
  );
}
