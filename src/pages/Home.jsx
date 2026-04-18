import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ItemCard from '../components/ItemCard';
import { ArrowUpDown, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import './Home.css';

const Home = () => {
  const { items, searchQuery } = useAppContext();
  const [filter, setFilter] = useState('All Items');

  const q = searchQuery.toLowerCase().trim();

  const filteredItems = items.filter(item => {
    const categoryMatch = filter === 'All Items' ||
      (CATEGORIES.find(c => c.name === filter)?.subcategories.includes(item.category) ?? false);
    const searchMatch = !q ||
      item.title?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.owner?.university?.toLowerCase().includes(q);
    return categoryMatch && searchMatch;
  });

  return (
    <>
      {/* Hero — collapsed during search */}
      {!searchQuery && (
        <section className="hero animate-fade-in">
          <div className="container">
            <h1 className="hero-title">Rent gear, formal wear &amp; more from students on campus.</h1>
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
            <div className="filter-dropdown">
              <SlidersHorizontal size={13} className="text-muted" /> Filters
            </div>
            <div className="filter-dropdown">
              <ArrowUpDown size={13} className="text-muted" /> Sort <ChevronDown size={13} className="text-muted" />
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
    </>
  );
};

export default Home;
