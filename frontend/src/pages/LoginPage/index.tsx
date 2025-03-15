import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import { login, selectAuthLoading, selectAuthError } from '../../store/slices/authSlice';
import { AppDispatch } from '../../store/types';
import { FiMail, FiLock, FiUser, FiCheck, FiAlertCircle } from 'react-icons/fi';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Attempting login with:', formData.email);
      const result = await dispatch(login({
        email: formData.email,
        password: formData.password
      })).unwrap();
      
      // Debug information
      console.log('Login successful, full result:', result);
      
      // Check if user data exists and log it
      if (result.user) {
        console.log('User data:', result.user);
        console.log('User role:', result.user.role);
        
        // Redirect based on user role
        if (result.user.role === 'admin') {
          console.log('User is admin, redirecting to /admin');
          navigate('/admin');
        } else {
          console.log('User is not admin, redirecting to /profile');
          navigate('/profile');
        }
      } else {
        console.error('No user data in response:', result);
        navigate('/profile'); // Default fallback
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="auth-page">
      <Helmet>
        <title>{t('login.pageTitle')} | Mart.az</title>
        <meta name="description" content={t('login.metaDescription')} />
      </Helmet>

      <div className="auth-container">
        <div className="auth-form-container">
          <h1 className="auth-title">{t('login.title')}</h1>
          <p className="auth-subtitle">{t('login.subtitle')}</p>

          {error && (
            <div className="alert alert-danger" role="alert">
              <FiAlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">{t('login.emailLabel')}</label>
              <div className="input-icon-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder={t('login.emailPlaceholder')}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('login.passwordLabel')}</label>
              <div className="input-icon-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder={t('login.passwordPlaceholder')}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-extras">
              <div className="remember-me custom-checkbox">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                <label htmlFor="remember">{t('login.rememberMe')}</label>
              </div>
              <Link to="/forgot-password" className="forgot-password-link">
                {t('login.forgotPassword')}
              </Link>
            </div>

            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? t('common.loading') : t('login.loginButton')}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {t('login.noAccount')}{' '}
              <Link to="/register" className="auth-link">
                {t('login.registerNow')}
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-benefits">
          <h2>{t('login.benefitsTitle')}</h2>
          <ul>
            <li>{t('login.benefit1')}</li>
            <li>{t('login.benefit2')}</li>
            <li>{t('login.benefit3')}</li>
            <li>{t('login.benefit4')}</li>
          </ul>
        </div>
      </div>

     
    </div>
  );
};

export default LoginPage; 