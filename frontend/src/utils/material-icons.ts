/**
 * Utility to ensure Material Icons are loaded properly
 */

interface Category {
  name?: string;
  slug?: string;
  [key: string]: any;
}

export const ensureMaterialIconsLoaded = (): void => {
  // Check if regular Material Icons are loaded
  if (!document.querySelector('link[href*="fonts.googleapis.com/icon?family=Material+Icons"]')) {
    const regularLink = document.createElement('link');
    regularLink.rel = 'stylesheet';
    regularLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    document.head.appendChild(regularLink);
  }

  // Check if Outlined Material Icons are loaded
  if (!document.querySelector('link[href*="fonts.googleapis.com/icon?family=Material+Icons+Outlined"]')) {
    const outlinedLink = document.createElement('link');
    outlinedLink.rel = 'stylesheet';
    outlinedLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined';
    document.head.appendChild(outlinedLink);
  }

  // Create a test span to ensure icons are rendered
  const testIcon = document.createElement('span');
  testIcon.className = 'material-icons';
  testIcon.textContent = 'check_circle';
  testIcon.style.position = 'absolute';
  testIcon.style.opacity = '0';
  testIcon.style.pointerEvents = 'none';
  document.body.appendChild(testIcon);

  // Clean up test element after a short delay
  setTimeout(() => {
    if (document.body.contains(testIcon)) {
      document.body.removeChild(testIcon);
    }
  }, 1000);
};

// Function to get appropriate icon name based on category
export const getCategoryMaterialIcon = (category: Category): string => {
  const name = (category.name || '').toLowerCase();
  const slug = (category.slug || '').toLowerCase();

  // Map category names/slugs to appropriate Material Icon names
  if (name.includes('electronic') || slug.includes('electronic')) return 'devices';
  if (name.includes('vehicle') || slug.includes('vehicle')) return 'directions_car';
  if (name.includes('home') || slug.includes('home') || 
      name.includes('furniture') || slug.includes('furniture')) return 'chair';
  if (name.includes('fashion') || slug.includes('fashion') || 
      name.includes('cloth') || slug.includes('cloth')) return 'checkroom';
  if (name.includes('job') || slug.includes('job')) return 'work';
  if (name.includes('service') || slug.includes('service')) return 'miscellaneous_services';
  
  // Default icon
  return 'category';
}; 