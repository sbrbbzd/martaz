import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Footer.scss';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__content">
          <div className="footer__logo">
            <Link to="/" className="footer__logo-link">
              <img src="/assets/images/logo.svg" alt="Mart.az" className="footer__logo-img" />
            </Link>
            <p className="footer__tagline">
              Mart.az - Azərbaycanda alqı-satqı üçün marketplace
            </p>
            <div className="footer__social">
              <a href="https://facebook.com" aria-label="Facebook" className="footer__social-link">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com" aria-label="Twitter" className="footer__social-link">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://instagram.com" aria-label="Instagram" className="footer__social-link">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://youtube.com" aria-label="YouTube" className="footer__social-link">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
          
          <div className="footer__columns">
            <div className="footer__column">
              <h3 className="footer__heading">HAQQIMIZDA</h3>
              <ul className="footer__list">
                <li className="footer__item">
                  <Link to="/about" className="footer__link">Haqqımızda</Link>
                </li>
                <li className="footer__item">
                  <Link to="/terms" className="footer__link">İstifadə Qaydaları</Link>
                </li>
                <li className="footer__item">
                  <Link to="/privacy" className="footer__link">Məxfilik Siyasəti</Link>
                </li>
                <li className="footer__item">
                  <Link to="/cookies" className="footer__link">Kukilər Siyasəti</Link>
                </li>
              </ul>
            </div>
            
            <div className="footer__column">
              <h3 className="footer__heading">DƏSTƏK</h3>
              <ul className="footer__list">
                <li className="footer__item">
                  <Link to="/help" className="footer__link">Yardım Mərkəzi</Link>
                </li>
                <li className="footer__item">
                  <Link to="/safety" className="footer__link">Təhlükəsizlik Mərkəzi</Link>
                </li>
                <li className="footer__item">
                  <Link to="/contact" className="footer__link">Bizimlə Əlaqə</Link>
                </li>
                <li className="footer__item">
                  <Link to="/faq" className="footer__link">Tez-tez verilən suallar</Link>
                </li>
              </ul>
            </div>
            
            <div className="footer__column">
              <h3 className="footer__heading">KATEQORİYALAR</h3>
              <ul className="footer__list">
                <li className="footer__item">
                  <Link to="/categories/electronics" className="footer__link">Elektronika</Link>
                </li>
                <li className="footer__item">
                  <Link to="/categories/vehicles" className="footer__link">Nəqliyyat</Link>
                </li>
                <li className="footer__item">
                  <Link to="/categories/real-estate" className="footer__link">Daşınmaz Əmlak</Link>
                </li>
                <li className="footer__item">
                  <Link to="/categories/jobs" className="footer__link">İş Elanları</Link>
                </li>
                <li className="footer__item">
                  <Link to="/categories" className="footer__link footer__link--view-all">Bütün Kateqoriyalar</Link>
                </li>
              </ul>
            </div>
            
            <div className="footer__column">
              <h3 className="footer__heading">XƏBƏRLƏRƏ ABUNƏ OLUN</h3>
              <p className="footer__text">Ən son elanlar və təkliflərdən xəbərdar olun</p>
              <div className="footer__newsletter">
                <form className="footer__form">
                  <input 
                    type="email" 
                    className="footer__input" 
                    placeholder="E-poçt ünvanınızı daxil edin"
                    aria-label="E-poçt ünvanınızı daxil edin"
                  />
                  <button type="submit" className="footer__button">Abunə ol</button>
                </form>
              </div>
              <div className="footer__apps">
                <a href="#" className="footer__app-link">
                  <img src="/assets/images/app-store.png" alt="App Store" className="footer__app-image" />
                </a>
                <a href="#" className="footer__app-link">
                  <img src="/assets/images/google-play.png" alt="Google Play" className="footer__app-image" />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; {currentYear} Mart.az. Bütün hüquqlar qorunur.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 