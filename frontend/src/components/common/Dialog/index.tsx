import React, { useEffect, useRef } from 'react';
import './Dialog.scss';

interface DialogProps {
  children: React.ReactNode;
  open: boolean;
  onClose?: () => void;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  fullWidth?: boolean;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  children,
  open,
  onClose,
  maxWidth = 'md',
  fullWidth = false,
  className = '',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && onClose) {
        onClose();
      }
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node) && open && onClose) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const dialogClasses = [
    'dialog',
    `dialog--${maxWidth}`,
    fullWidth ? 'dialog--full-width' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="dialog-overlay">
      <div 
        className={dialogClasses}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
};

export const DialogTitle: React.FC<DialogTitleProps> = ({ 
  children, 
  className = '' 
}) => {
  const titleClasses = ['dialog__title', className].filter(Boolean).join(' ');
  
  return (
    <div className={titleClasses}>
      {children}
    </div>
  );
};

export const DialogContent: React.FC<DialogContentProps> = ({ 
  children, 
  className = '' 
}) => {
  const contentClasses = ['dialog__content', className].filter(Boolean).join(' ');
  
  return (
    <div className={contentClasses}>
      {children}
    </div>
  );
};

export const DialogActions: React.FC<DialogActionsProps> = ({ 
  children, 
  className = '' 
}) => {
  const actionsClasses = ['dialog__actions', className].filter(Boolean).join(' ');
  
  return (
    <div className={actionsClasses}>
      {children}
    </div>
  );
}; 