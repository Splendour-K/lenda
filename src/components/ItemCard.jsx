import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, ShieldCheck, Heart } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const ItemCard = ({ item }) => {
  const { formatPrice } = useAppContext();
  const [imgIdx, setImgIdx] = useState(0);
  const touchStart = useRef(null);
  const touchEnd   = useRef(null);
  const MIN_SWIPE  = 40;

  const images = item.images?.length ? item.images : null;
  const total  = images?.length || 1;

  const prev = (e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(i => (i - 1 + total) % total); };
  const next = (e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(i => (i + 1) % total); };

  const onTouchStart = (e) => { touchStart.current = e.targetTouches[0].clientX; };
  const onTouchMove  = (e) => { touchEnd.current   = e.targetTouches[0].clientX; };
  const onTouchEnd   = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const diff = touchStart.current - touchEnd.current;
    if (Math.abs(diff) > MIN_SWIPE) diff > 0 ? setImgIdx(i => (i + 1) % total) : setImgIdx(i => (i - 1 + total) % total);
    touchStart.current = null;
    touchEnd.current   = null;
  };

  return (
    <Link to={`/item/${item.id}`} className="item-card">
      {/* ── Image area ── */}
      <div
        className="item-image-wrapper"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {images ? (
          <img
            className="item-image"
            src={images[imgIdx]}
            alt={item.title}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
            No image
          </div>
        )}

        <button className="item-wishlist-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* TODO: wishlist */ }}>
          <Heart size={20} color="white" />
        </button>

        {item.is_sponsored && (
          <div className="item-sponsored-badge">
            <Star size={10} fill="currentColor" />
            Sponsored
          </div>
        )}

        <div className="item-category-badge">{item.category}</div>

        {/* Prev/Next arrows (only if multiple images) */}
        {images && total > 1 && (
          <>
            <button className="item-img-arrow left" onClick={prev} aria-label="Previous image">
              <ChevronLeft size={14} />
            </button>
            <button className="item-img-arrow right" onClick={next} aria-label="Next image">
              <ChevronRight size={14} />
            </button>
            <div className="item-image-dots">
              {images.map((_, i) => (
                <div key={i} className={`image-dot ${i === imgIdx ? 'active' : ''}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Card body ── */}
      <div className="item-content">
        <div className="item-header">
          <div className="item-title">{item.title}</div>
          <div className="item-price">
            {formatPrice(item.price, item.currency)}
            <span className="item-price-sub">/ 2d</span>
          </div>
        </div>

        <div className="item-details">
          <span className="detail-pill">Size {item.size}</span>
          <span className="detail-pill" style={{ color: 'var(--muted-foreground)' }}>·</span>
          <span className="detail-pill">{item.condition}</span>
        </div>

        <div className="item-footer">
          <div className="owner-info">
            {item.owner?.avatar ? (
              <img src={item.owner.avatar} alt={item.owner.name} className="owner-avatar" />
            ) : (
              <div className="owner-avatar" style={{ background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700 }}>
                {(item.owner?.name || 'U')[0]}
              </div>
            )}
            <span className="owner-name">{item.owner?.name}</span>
            {item.owner?.is_verified && (
              <span className="verified-icon"><ShieldCheck size={12} /></span>
            )}
          </div>
          <div className="rating-info">
            <Star size={12} color="#fbbf24" fill="#fbbf24" />
            {item.owner?.rating ? Number(item.owner.rating).toFixed(1) : 'New'}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
