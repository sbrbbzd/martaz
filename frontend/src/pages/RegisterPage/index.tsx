import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { register, selectAuthLoading, selectAuthError } from '../../store/slices/authSlice';
import { AppDispatch } from '../../store/types';
import { FiUser, FiMail, FiPhone, FiLock, FiAlertCircle, FiCheck } from 'react-icons/fi';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    agreeTerms?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is changed
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = t('register.firstNameRequired');
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = t('register.lastNameRequired');
    }
    
    if (!formData.email.trim()) {
      errors.email = t('register.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('register.emailInvalid');
    }
    
    if (formData.phone && !/^\+?\d{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = t('register.phoneInvalid');
    }
    
    if (!formData.password) {
      errors.password = t('register.passwordRequired');
    } else if (formData.password.length < 8) {
      errors.password = t('register.passwordTooShort');
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('register.passwordsDoNotMatch');
    }
    
    if (!formData.agreeTerms) {
      errors.agreeTerms = t('register.termsRequired');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await dispatch(register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      })).unwrap();
      navigate('/login?registered=true');
    } catch (err: any) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="auth-page">
      <Helmet>
        <title>{t('register.pageTitle')} | Mart.az</title>
        <meta name="description" content={t('register.metaDescription')} />
      </Helmet>

      <div className="auth-container">
        <div className="auth-form-container">
          <h1 className="auth-title">{t('register.title')}</h1>
          <p className="auth-subtitle">{t('register.subtitle')}</p>

          {error && (
            <div className="alert alert-danger" role="alert">
              <FiAlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">{t('register.firstNameLabel')}</label>
                <div className="input-icon-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`form-control ${formErrors.firstName ? 'is-invalid' : ''}`}
                    placeholder={t('register.firstNamePlaceholder')}
                  />
                </div>
                {formErrors.firstName && (
                  <div className="invalid-feedback">{formErrors.firstName}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">{t('register.lastNameLabel')}</label>
                <div className="input-icon-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`form-control ${formErrors.lastName ? 'is-invalid' : ''}`}
                    placeholder={t('register.lastNamePlaceholder')}
                  />
                </div>
                {formErrors.lastName && (
                  <div className="invalid-feedback">{formErrors.lastName}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('register.emailLabel')}</label>
              <div className="input-icon-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                  placeholder={t('register.emailPlaceholder')}
                />
              </div>
              {formErrors.email && (
                <div className="invalid-feedback">{formErrors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone">{t('register.phoneLabel')}</label>
              <div className="input-icon-wrapper">
                <FiPhone className="input-icon" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                  placeholder={t('register.phonePlaceholder')}
                />
              </div>
              {formErrors.phone && (
                <div className="invalid-feedback">{formErrors.phone}</div>
              )}
              <small className="form-text">{t('register.phoneHelp')}</small>
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('register.passwordLabel')}</label>
              <div className="input-icon-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                  placeholder={t('register.passwordPlaceholder')}
                />
              </div>
              {formErrors.password && (
                <div className="invalid-feedback">{formErrors.password}</div>
              )}
              <small className="form-text">{t('register.passwordHelp')}</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">{t('register.confirmPasswordLabel')}</label>
              <div className="input-icon-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-control ${formErrors.confirmPassword ? 'is-invalid' : ''}`}
                  placeholder={t('register.confirmPasswordPlaceholder')}
                />
              </div>
              {formErrors.confirmPassword && (
                <div className="invalid-feedback">{formErrors.confirmPassword}</div>
              )}
            </div>

            <div className="form-group terms-checkbox">
              <div className={`custom-checkbox ${formErrors.agreeTerms ? 'is-invalid' : ''}`}>
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
                <label htmlFor="agreeTerms">
                  {t('register.termsLabel')}{' '}
                  <Link to="/terms" target="_blank" rel="noopener noreferrer">
                    {t('register.termsLinkText')}
                  </Link>
                </label>
              </div>
              {formErrors.agreeTerms && (
                <div className="invalid-feedback">{formErrors.agreeTerms}</div>
              )}
            </div>

            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? t('common.loading') : t('register.registerButton')}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {t('register.haveAccount')}{' '}
              <Link to="/login" className="auth-link">
                {t('register.loginNow')}
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-benefits">
          <h2>{t('register.whyRegister')}</h2>
          <ul>
            <li>{t('register.benefit1')}</li>
            <li>{t('register.benefit2')}</li>
            <li>{t('register.benefit3')}</li>
            <li>{t('register.benefit4')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 