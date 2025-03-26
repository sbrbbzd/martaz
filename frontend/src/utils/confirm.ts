/**
 * Utility for displaying confirmation dialogs
 */

/**
 * Shows a confirmation dialog to the user
 * 
 * @param message The message to display in the confirmation dialog
 * @param title Optional title for the dialog
 * @returns A promise that resolves to true if the user confirms, false otherwise
 */
export const showConfirm = (message: string, title: string = 'Confirm'): Promise<boolean> => {
  return new Promise((resolve) => {
    // Use browser's native confirm dialog
    const result = window.confirm(message);
    resolve(result);
    
    // In a real implementation, you might want to use a more sophisticated
    // confirmation dialog component from your UI library
  });
}; 