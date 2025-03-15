import React from 'react';
import './Container.scss';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fluid';
  as?: React.ElementType;
}

const Container: React.FC<ContainerProps> = ({
  children,
  className = '',
  size = 'lg',
  as: Component = 'div',
}) => {
  return (
    <Component className={`container container--${size} ${className}`}>
      {children}
    </Component>
  );
};

export default Container;
