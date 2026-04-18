import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ItemCard from '../components/ItemCard';
import { Ruler, ArrowUpDown, ChevronDown } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import './Home.css';

const Home = () => {
  const { items, searchQuery } = useAppContext();
  const [filter, setFilter] = useState('All Items');

  const q = searchQuery.toLowerCase().trim();

  const filteredItems = items.filter(item => {
    // Category tab filter
    const categoryMatch = filter === 'All Items' ||
      (CATEGORIES.find(c => c.name === filter)?.subcategories.includes(item.category) ?? false);

    // Search query filter: match title, category, or owner university
    const searchMatch = !q ||
      item.title?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.owner?.university?.toLowerCase().includes(q);

    return categoryMatch && searchMatch;
  });

  return (
    <>
      <section className="hero animate-fade-in">
        <div className="container">
          <h1 className="hero-title">Rent gear, formal wear & more from students on campus.</h1>
          <p className="hero-subtitle">
            {searchQuery
              ? `Showing results for "${searchQuery}"`
              : 'Get everything you need for your next event, project, or trip without breaking the bank. Fast, simple, and trusted by your university community.'}
          </p>
        </div>
      </section>

      <main className="container page-container animate-fade-in">
        <div className="filters-section">
          <div className="filter-group" style={{ flexWrap: 'wrap' }}>
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
          <div className="filter-group">
            <div className="filter-dropdown">
              <Ruler size={16} className="text-muted" />
              Size
              <ChevronDown size={16} className="text-muted" />
            </div>
            <div className="filter-dropdown">
              <ArrowUpDown size={16} className="text-muted" />
              Sort by
              <ChevronDown size={16} className="text-muted" />
            </div>
          </div>
        </div>

        <div className="grid">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))
          ) : (
            <div className="text-center text-muted" style={{ gridColumn: '1 / -1', padding: '40px' }}>
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
