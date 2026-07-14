/**
 * QA / showcase gallery — every product with its live interactive 3D viewer and
 * the 5 rendered WebP views side by side, to eyeball that the stills and the
 * live model stay consistent. The WebP thumbnails appear after `npm run render`.
 */
import { useState } from 'react'
import { Product3DViewer } from './Product3DViewer'
import { PRODUCTS, type ProductDef } from '@/product-motion/registry'
import { STANDARD_VIEWS } from '@/product-motion/views'

function ViewThumb({ slug, viewId, label }: { slug: string; viewId: string; label: string }) {
  const [ok, setOk] = useState(true)
  const src = `/assets/${slug}/${viewId}.webp`
  return (
    <figure style={{ margin: 0, textAlign: 'center' }}>
      <div
        style={{
          aspectRatio: '1 / 1',
          background: '#fff',
          border: '1px solid #e6e8ec',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {ok ? (
          <img
            src={src}
            alt={`${slug} ${viewId}`}
            loading="lazy"
            onError={() => setOk(false)}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontSize: 10, color: '#aab' }}>belum dirender</span>
        )}
      </div>
      <figcaption style={{ fontSize: 10, color: '#8a91a0', marginTop: 4 }}>{label}</figcaption>
    </figure>
  )
}

function ProductCard({ product }: { product: ProductDef }) {
  return (
    <section
      style={{
        border: '1px solid #e6e8ec',
        borderRadius: 16,
        padding: 16,
        background: '#fff',
        boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
      }}
    >
      <header style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16, color: '#101828' }}>{product.label}</h2>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#667085' }}>
          {product.category} · <code style={{ color: '#98a2b3' }}>{product.slug}</code>
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#98a2b3' }}>{product.material}</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 2fr', gap: 14, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 10, color: '#98a2b3', marginBottom: 4 }}>3D interaktif</div>
          <Product3DViewer slug={product.slug} className="viewer" />
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#98a2b3', marginBottom: 4 }}>5 gambar (WebP)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {STANDARD_VIEWS.map((v) => (
              <ViewThumb key={v.id} slug={product.slug} viewId={v.id} label={v.label} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function ProductGallery() {
  return (
    <main
      style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '32px 20px 64px',
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#101828',
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Aset Produk 3D — UASE</h1>
      <p style={{ color: '#667085', marginTop: 0, fontSize: 14 }}>
        {PRODUCTS.length} produk · masing-masing 1 model 3D interaktif + 5 gambar sudut (latar putih).
        Seret model untuk memutar. Jalankan <code>npm run render</code> untuk menghasilkan gambar WebP.
      </p>
      <div style={{ display: 'grid', gap: 18, marginTop: 24 }}>
        {PRODUCTS.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </main>
  )
}
