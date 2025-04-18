import { useState, useEffect } from 'react';

// Custom hook for viewport detection
const useViewport = () => {
  const [width, setWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleWindowResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  // Return the width so we can use it in our components
  return { width };
};

export default useViewport; 