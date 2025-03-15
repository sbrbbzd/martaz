const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all SCSS files in the project
const scssFiles = glob.sync('src/**/*.scss');

// Mapping of common Sass variables to CSS custom properties
const variableMapping = {
  // Colors
  '$primary-color': 'var(--primary-color)',
  '$secondary-color': 'var(--secondary-color)',
  '$accent-color': 'var(--accent-color)',
  '$success-color': 'var(--success-color)',
  '$warning-color': 'var(--warning-color)',
  '$danger-color': 'var(--danger-color)',
  '$info-color': 'var(--info-color)',
  
  // Spacing
  '$spacing-xs': 'var(--spacing-xs)',
  '$spacing-sm': 'var(--spacing-sm)',
  '$spacing-md': 'var(--spacing-md)',
  '$spacing-lg': 'var(--spacing-lg)',
  '$spacing-xl': 'var(--spacing-xl)',
  
  // Typography
  '$font-family-base': 'var(--font-family-base)',
  '$font-family-heading': 'var(--font-family-heading)',
  '$font-size-xs': 'var(--font-size-xs)',
  '$font-size-sm': 'var(--font-size-sm)',
  '$font-size-md': 'var(--font-size-md)',
  '$font-size-lg': 'var(--font-size-lg)',
  '$font-size-xl': 'var(--font-size-xl)',
  '$font-size-xxl': 'var(--font-size-xxl)',
  '$font-weight-normal': 'var(--font-weight-normal)',
  '$font-weight-medium': 'var(--font-weight-medium)',
  '$font-weight-bold': 'var(--font-weight-bold)',
  
  // Borders
  '$border-color': 'var(--border-color)',
  '$border-radius': 'var(--border-radius)',
  '$border-radius-sm': 'var(--border-radius-sm)',
  '$border-radius-lg': 'var(--border-radius-lg)',
  
  // Shadows
  '$shadow-sm': 'var(--shadow-sm)',
  '$shadow-md': 'var(--shadow-md)',
  '$shadow-lg': 'var(--shadow-lg)',
  
  // Layout
  '$container-width': 'var(--container-width)',
  '$header-height': 'var(--header-height)',
  '$footer-height': 'var(--footer-height)',
  
  // Grayscale
  '$white': 'var(--white)',
  '$gray-100': 'var(--gray-100)',
  '$gray-200': 'var(--gray-200)',
  '$gray-300': 'var(--gray-300)',
  '$gray-400': 'var(--gray-400)',
  '$gray-500': 'var(--gray-500)',
  '$gray-600': 'var(--gray-600)',
  '$gray-700': 'var(--gray-700)',
  '$gray-800': 'var(--gray-800)',
  '$gray-900': 'var(--gray-900)',
  '$black': 'var(--black)',
  
  // Text colors
  '$text-color': 'var(--text-color)',
  '$headings-color': 'var(--headings-color)',
  
  // Background
  '$bg-color': 'var(--bg-color)',
  '$body-bg': 'var(--bg-color)',
  
  // Z-index
  '$z-index-dropdown': 'var(--z-index-dropdown)',
  '$z-index-modal': 'var(--z-index-modal)',
  '$z-index-tooltip': 'var(--z-index-tooltip)',
};

// Process each file
scssFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace each Sass variable with CSS custom property
    Object.entries(variableMapping).forEach(([sassVar, cssVar]) => {
      if (content.includes(sassVar)) {
        content = content.replace(new RegExp(sassVar.replace('$', '\\$'), 'g'), cssVar);
        modified = true;
        console.log(`Replaced ${sassVar} with ${cssVar} in ${filePath}`);
      }
    });
    
    // Save the file if modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('SCSS variable conversion complete!'); 