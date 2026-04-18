import React from 'react';
import { Link } from 'react-router-dom';
import { Ruler, User, Star, BadgeCheck, Info } from 'lucide-react';

const ItemCard = ({ item }) => {
  return (
    <Link to={`/item/${item.id}`} className="item-card">
      <div className="item-image-wrapper">
        <div className="item-category-badge">{item.category}</div>
        <img
          className="item-image"
          src={item.images[0]}
          alt={item.title}
        />
      </div>
      <div className="item-content">
        <div className="item-header">
          <div className="item-title" title={item.title}>{item.title}</div>
          <div className="item-price">
            ${item.price}
            <span className="item-price-sub">/ 2 days</span>
          </div>
        </div>
        <div className="item-details">
          <div className="detail-pill">
            <Ruler size={14} />
            Size {item.size}
          </div>
          <div className="detail-pill" title={item.fitDescription || item.condition}>
            {item.category === 'Suit' ? <User size={14} /> : <Info size={14} />}
            {item.category === 'Suit' ? (item.fitDescription?.split(',')[0] || item.fitDescription) : item.condition}
          </div>
        </div>
        <div className="item-footer">
          <div className="owner-info">
            <img
              src={item.owner.avatar}
              alt={item.owner.name}
              className="owner-avatar"
            />
            <span className="owner-name">{item.owner.name}</span>
            {item.owner.isVerified && (
              <div className="verified-icon" title="Verified Student">
                <BadgeCheck size={14} />
              </div>
            )}
          </div>
          <div className="rating-info">
            <Star size={14} color="#fbbf24" fill="#fbbf24" />
            {item.owner.rating ? item.owner.rating.toFixed(1) : 'New'}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
