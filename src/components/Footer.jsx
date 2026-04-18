import React from 'react';
import { Globe, Facebook, Twitter, Instagram } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-global">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-column">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Safety information</a></li>
              <li><a href="#">Cancellation options</a></li>
              <li><a href="#">Our COVID-19 Response</a></li>
              <li><a href="#">Report a concern</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4>Community</h4>
            <ul>
              <li><a href="#">Lenda.org: disaster relief</a></li>
              <li><a href="#">Support verified students</a></li>
              <li><a href="#">Combating discrimination</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4>Lending</h4>
            <ul>
              <li><a href="#">Try lending</a></li>
              <li><a href="#">LendaCover for Lenders</a></li>
              <li><a href="#">Explore lending resources</a></li>
              <li><a href="#">Visit our community forum</a></li>
              <li><a href="#">How to lend responsibly</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4>Lenda</h4>
            <ul>
              <li><a href="#">Newsroom</a></li>
              <li><a href="#">Learn about new features</a></li>
              <li><a href="#">Letter from our founders</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Investors</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span>© 2026 Lenda, Inc.</span>
            <span className="dot">·</span>
            <a href="#">Privacy</a>
            <span className="dot">·</span>
            <a href="#">Terms</a>
            <span className="dot">·</span>
            <a href="#">Sitemap</a>
          </div>
          <div className="footer-bottom-right">
            <button className="footer-lang-btn">
              <Globe size={16} /> English (US)
            </button>
            <button className="footer-lang-btn">
              GH₵ GHS
            </button>
            <div className="footer-socials">
              <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
              <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
