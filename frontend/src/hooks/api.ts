/**
 * API Hooks
 * 
 * This file re-exports the API hooks from services/api.ts to provide a cleaner import path
 * for components. It also provides any additional custom hooks built on top of the base API.
 */

import { 
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetCategoriesQuery,
  useGetCategoryTreeQuery,
  useGetCategoryQuery,
  useGetListingsQuery,
  useGetListingQuery,
  useGetFeaturedListingsQuery,
  useGetMyListingsQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
  useChangeListingStatusMutation,
  useToggleFavoriteMutation,
  useGetAdminDashboardDataQuery,
  useGetAdminUsersQuery,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  useGetAdminListingsQuery,
  useApproveListingMutation,
  useAdminDeleteListingMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useImportFromUrlMutation,
  useGetSupportedImportSourcesQuery,
  useFeatureListingMutation
} from '../services/api';

// Re-export all hooks
export {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetCategoriesQuery,
  useGetCategoryTreeQuery,
  useGetCategoryQuery,
  useGetListingsQuery,
  useGetListingQuery,
  useGetFeaturedListingsQuery,
  useGetMyListingsQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
  useChangeListingStatusMutation,
  useToggleFavoriteMutation,
  useGetAdminDashboardDataQuery,
  useGetAdminUsersQuery,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  useGetAdminListingsQuery,
  useApproveListingMutation,
  useDeleteListingMutation as useRejectListingMutation,
  useAdminDeleteListingMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useImportFromUrlMutation,
  useGetSupportedImportSourcesQuery,
  useFeatureListingMutation
};

// Additional custom hooks can be defined here 