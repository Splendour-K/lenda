import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ItemCard from '../components/ItemCard';
import { Ruler, ArrowUpDown, ChevronDown } from 'lucide-react';
import './Home.css';

const Home = () => {
  const { items } = useAppContext();
  const [filter, setFilter] = useState('All Items');

  const filteredItems = items.filter(item => {
    if (filter === 'All Items') return true;
    if (filter === 'Suits') return item.category === 'Suit';
    if (filter === 'Shoes') return item.category === 'Shoes';
    return true;
  });

  return (
    <>
      <section className="hero animate-fade-in">
        <div className="container">
          <h1 className="hero-title">Rent suits & shoes from students on campus.</h1>
          <p className="hero-subtitle">
            Look sharp for your next formal event without breaking the bank.
            Fast, simple, and trusted by your university community.
          </p>
        </div>
      </section>

      <main className="container page-container animate-fade-in">
        <div className="filters-section">
          <div className="filter-group">
            {['All Items', 'Suits', 'Shoes'].map(tab => (
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
              No items available at the moment.
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Home;
