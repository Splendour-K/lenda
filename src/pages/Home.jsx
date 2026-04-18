import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import ItemCard from '../components/ItemCard';
import FilterModal from '../components/FilterModal';
import { ArrowUpDown, ChevronDown, SlidersHorizontal, Check } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import './Home.css';

const Home = () => {
  const { items, searchQuery } = useAppContext();
  const [filter, setFilter] = useState('All Items');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Recommended');
  const sortRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const q = searchQuery.toLowerCase().trim();

  let filteredItems = items.filter(item => {
    const categoryMatch = filter === 'All Items' ||
      (CATEGORIES.find(c => c.name === filter)?.subcategories.includes(item.category) ?? false);
    
    const searchMatch = !q ||
      item.title?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.owner?.university?.toLowerCase().includes(q);

    let advancedMatch = true;
    if (advancedFilters.minPrice) advancedMatch = advancedMatch && item.price >= advancedFilters.minPrice;
    if (advancedFilters.maxPrice) advancedMatch = advancedMatch && item.price <= advancedFilters.maxPrice;
    if (advancedFilters.conditions?.length > 0) advancedMatch = advancedMatch && advancedFilters.conditions.includes(item.condition);
    if (advancedFilters.verifiedOnly) advancedMatch = advancedMatch && item.owner?.is_verified;
    if (advancedFilters.university) {
      const u = advancedFilters.university.toLowerCase();
      advancedMatch = advancedMatch && item.owner?.university?.toLowerCase().includes(u);
    }

    return categoryMatch && searchMatch && advancedMatch;
  });

  if (sortBy === 'Price: Low to High') {
    filteredItems.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'Price: High to Low') {
    filteredItems.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'Newest') {
    filteredItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return (
    <>
      {/* Hero — collapsed during search */}
      {!searchQuery && (
        <section className="hero animate-fade-in">
          <div className="container">
            <h1 className="hero-title"><span className="hero-title-dark">Rent gear, formal wear &amp; more from students on </span><span className="hero-title-accent">campus.</span></h1>
            <p className="hero-subtitle">
              Fast, simple, and trusted by your university community.
            </p>
          </div>
        </section>
      )}

      {searchQuery && (
        <div style={{ padding: '10px 16px', background: 'var(--card)', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--muted-foreground)' }}>
          Results for <strong>"{searchQuery}"</strong> — {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </div>
      )}

      <main className="container page-container animate-fade-in">
        {/* Category tabs — horizontally scrollable on mobile */}
        <div className="filters-section">
          <div className="filter-scroll-row">
            {['All Items', ...CATEGORIES.map(c => c.name)].map(tab => (
              <div
                key={tab}
                className={`filter-tab ${filter === tab ? 'active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className="filter-actions-row">
            <button className="filter-dropdown" onClick={() => setIsFilterOpen(true)}>
              <SlidersHorizontal size={13} className="text-muted" /> Filters
              {Object.keys(advancedFilters).some(k => 
                (Array.isArray(advancedFilters[k]) && advancedFilters[k].length > 0) || 
                (!Array.isArray(advancedFilters[k]) && advancedFilters[k])
              ) && <span className="filter-active-dot" />}
            </button>
            <div className="sort-dropdown-container" ref={sortRef}>
              <button className="filter-dropdown" onClick={() => setIsSortOpen(!isSortOpen)}>
                <ArrowUpDown size={13} className="text-muted" /> Sort <ChevronDown size={13} className="text-muted" />
              </button>
              {isSortOpen && (
                <div className="sort-dropdown-menu animate-fade-in">
                  {['Recommended', 'Newest', 'Price: Low to High', 'Price: High to Low'].map(option => (
                    <div 
                      key={option} 
                      className="sort-option" 
                      onClick={() => { setSortBy(option); setIsSortOpen(false); }}
                    >
                      {option} {sortBy === option && <Check size={14} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => <ItemCard key={item.id} item={item} />)
          ) : (
            <div className="text-center text-muted" style={{ gridColumn: '1 / -1', padding: '48px 16px' }}>
              {searchQuery
                ? `No items found for "${searchQuery}". Try a different search.`
                : 'No items available in this category yet.'}
            </div>
          )}
        </div>
      </main>

      <FilterModal 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
        currentFilters={advancedFilters}
        onApply={setAdvancedFilters}
      />
    </>
  );
};

export default Home;
