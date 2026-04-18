import React, { useState } from 'react';
import { X } from 'lucide-react';
import './FilterModal.css';

const FilterModal = ({ isOpen, onClose, currentFilters, onApply }) => {
  // Local draft state — initialised from currentFilters each time modal opens.
  // We use a plain initialiser; the parent controls isOpen so the component
  // unmounts when closed (see early-return below), giving us a fresh slate.
  const [minPrice, setMinPrice] = useState(() => currentFilters.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState(() => currentFilters.maxPrice ?? '');
  const [conditions, setConditions] = useState(() => currentFilters.conditions ?? []);
  const [verifiedOnly, setVerifiedOnly] = useState(() => currentFilters.verifiedOnly ?? false);
  const [university, setUniversity] = useState(() => currentFilters.university ?? '');

  const availableConditions = ['New', 'Like New', 'Good', 'Fair'];

  // Bail early BEFORE any hooks so the component re-mounts (and resets state)
  // every time isOpen transitions from false → true.
  if (!isOpen) return null;

  const handleConditionToggle = (cond) => {
    setConditions(prev => 
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );
  };

  const handleClear = () => {
    setMinPrice('');
    setMaxPrice('');
    setConditions([]);
    setVerifiedOnly(false);
    setUniversity('');
  };

  const handleApply = () => {
    onApply({
      minPrice: minPrice !== '' ? Number(minPrice) : null,
      maxPrice: maxPrice !== '' ? Number(maxPrice) : null,
      conditions,
      verifiedOnly,
      university
    });
    onClose();
  };

  return (
    <div className="filter-modal-overlay" onClick={onClose}>
      <div className="filter-modal-content" onClick={e => e.stopPropagation()}>
        <div className="filter-modal-header">
          <button className="filter-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
          <h2 className="filter-modal-title">Filters</h2>
          <div style={{ width: 32 }}></div> {/* Spacer for centering title */}
        </div>

        <div className="filter-modal-body">
          {/* Price Range */}
          <div className="filter-section">
            <h3 className="filter-section-title">Price range</h3>
            <p className="filter-section-subtitle">Item prices before fees and taxes.</p>
            <div className="price-inputs">
              <div className="price-input-wrapper">
                <label>Minimum</label>
                <div className="price-input-inner">
                  <span>GH₵</span>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={minPrice} 
                    onChange={e => setMinPrice(e.target.value)} 
                    min="0"
                  />
                </div>
              </div>
              <div className="price-divider">-</div>
              <div className="price-input-wrapper">
                <label>Maximum</label>
                <div className="price-input-inner">
                  <span>GH₵</span>
                  <input 
                    type="number" 
                    placeholder="1000+" 
                    value={maxPrice} 
                    onChange={e => setMaxPrice(e.target.value)} 
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Condition */}
          <div className="filter-section">
            <h3 className="filter-section-title">Condition</h3>
            <div className="condition-grid">
              {availableConditions.map(cond => (
                <button 
                  key={cond}
                  className={`condition-btn ${conditions.includes(cond) ? 'active' : ''}`}
                  onClick={() => handleConditionToggle(cond)}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Verified Lenders Only */}
          <div className="filter-section">
            <div className="toggle-row">
              <div>
                <h3 className="filter-section-title" style={{ marginBottom: 4 }}>Verified Lenders Only</h3>
                <p className="filter-section-subtitle" style={{ marginBottom: 0 }}>Show items only from ID-verified students.</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={verifiedOnly} 
                  onChange={e => setVerifiedOnly(e.target.checked)} 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* University */}
          <div className="filter-section" style={{ borderBottom: 'none' }}>
            <h3 className="filter-section-title">University / Location</h3>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Ashesi University" 
              value={university}
              onChange={e => setUniversity(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-modal-footer">
          <button className="filter-clear-btn" onClick={handleClear}>Clear all</button>
          <button className="btn btn-primary filter-show-btn" onClick={handleApply}>Show items</button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
