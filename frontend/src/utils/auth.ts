/**
 * Authentication utility functions for user management
 */

/**
 * Checks if a user is an admin
 * @param user The user object to check
 * @returns Boolean indicating if the user is an admin
 */
export const isUserAdmin = (user: any): boolean => {
  return user.role === 'admin';
};

/**
 * Checks if a user is authenticated
 * @param user The user object to check
 * @returns Boolean indicating if the user is authenticated
 */
export const isAuthenticated = (user: any): boolean => {
  return !!user;
};

/**
 * Gets the user's display name (first name + last name)
 * @param user The user object
 * @returns The user's display name
 */
export const getUserDisplayName = (user: any): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  } else if (user.username) {
    return user.username;
  } else {
    return user.email;
  }
};

/**
 * Gets the user's initials for avatar display
 * @param user The user object
 * @returns The user's initials (up to 2 characters)
 */
export const getUserInitials = (user: any): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  } else if (user.username) {
    return user.username.charAt(0).toUpperCase();
  } else {
    return user.email.charAt(0).toUpperCase();
  }
}; 