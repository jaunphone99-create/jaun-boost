'use client';

import { Product } from '@/lib/types';

interface ProductCardProps {
    product: Product;
    onClick: (product: Product) => void;
    mode?: 'withdraw' | 'restock';
}

export default function ProductCard({ product, onClick, mode = 'withdraw' }: ProductCardProps) {
    const stockLevel = product.stock_quantity;
    const stockColor =
        stockLevel <= 0
            ? 'stock-empty'
            : stockLevel <= 5
                ? 'stock-low'
                : stockLevel <= 15
                    ? 'stock-medium'
                    : 'stock-high';

    return (
        <button
            onClick={() => onClick(product)}
            className={`product-card ${mode === 'restock' ? 'product-card-restock' : ''}`}
            disabled={mode === 'withdraw' && stockLevel <= 0}
        >
            <div className="product-emoji">
                {product.image_url && (product.image_url.startsWith('data:') || product.image_url.startsWith('http')) ? (
                    <img src={product.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
                ) : (
                    product.image_url || '📦'
                )}
            </div>
            <div className="product-name">{product.name}</div>
            <div className={`product-stock ${stockColor}`}>
                {stockLevel <= 0 ? 'หมด' : `${stockLevel} ${product.unit}`}
            </div>
            {product.barcode && (
                <div className="product-barcode-badge">📊</div>
            )}
        </button>
    );
}
