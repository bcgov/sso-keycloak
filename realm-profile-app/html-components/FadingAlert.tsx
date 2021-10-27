import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Alert from '@button-inc/bcgov-theme/Alert';

interface props {
  variant?: string;
  size?: string;
  closable?: boolean;
  content?: string;
  fadeOut?: number;
  children?: React.ReactNode;
}

const FadingAlert = ({ children, variant, size, closable, content, fadeOut }: props) => {
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    const timeout = fadeOut
      ? setTimeout(() => {
          setFaded(true);
        }, fadeOut)
      : null;

    return () => {
      timeout && clearTimeout(timeout);
    };
  }, []);

  if (faded) return null;

  return (
    <Alert variant={variant} size={size} closable={closable} content={content}>
      {children}
    </Alert>
  );
};

export default FadingAlert;
