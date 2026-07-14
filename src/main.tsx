import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ProductGallery } from './components/ProductGallery'

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <ProductGallery />
    </StrictMode>,
  )
}
