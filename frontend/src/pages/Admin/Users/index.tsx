import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FiEdit, 
  FiTrash2, 
  FiUserPlus, 
  FiSearch, 
  FiFilter, 
  FiAlertCircle,
  FiCheck, 
  FiUserX,
  FiUserCheck
} from 'react-icons/fi';
import AdminLayout from '../../../components/Admin/AdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useGetAdminUsersQuery, useUpdateUserStatusMutation, useDeleteUserMutation } from '../../../services/api';
import './styles.scss';

interface UserFilters {
  status?: string;
  role?: string;
  search?: string;
}

const UserManagement: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<UserFilters>({});
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  // Fetch users with RTK Query
  const { 
    data: usersData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useGetAdminUsersQuery({ 
    page, 
    limit: 10, 
    ...filters 
  });
  
  // Mutations for user actions
  const [updateUserStatus, { isLoading: isUpdatingStatus }] = useUpdateUserStatusMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  
  // Handle search
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchText }));
    setPage(1);
  };
  
  // Handle filter change
  const handleFilterChange = (filter: string, value: string) => {
    setFilters(prev => ({ ...prev, [filter]: value }));
    setPage(1);
  };
  
  // Handle user status update
  const handleStatusUpdate = async (userId: string, status: string) => {
    try {
      await updateUserStatus({ id: userId, status }).unwrap();
      // Could add notification here
    } catch (err) {
      console.error('Failed to update user status:', err);
      // Could add error notification here
    }
  };
  
  // Handle user deletion with confirmation
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm(t('admin.users.deleteConfirmation', 'Are you sure you want to delete this user? This action cannot be undone.'))) {
      try {
        await deleteUser(userId).unwrap();
        // Could add success notification here
      } catch (err) {
        console.error('Failed to delete user:', err);
        // Could add error notification here
      }
    }
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <LoadingSpinner />
          <p>{t('admin.users.loading', 'Loading users data...')}</p>
        </div>
      </AdminLayout>
    );
  }
  
  // Show error state
  if (isError || !usersData) {
    return (
      <AdminLayout>
        <div className="admin-error">
          <FiAlertCircle size={48} />
          <h2>{t('admin.users.error', 'Error loading users')}</h2>
          <p>
            {error && typeof error === 'object' && 'message' in error
              ? error.message 
              : t('admin.users.serverError', 'The server encountered an error. This could be due to maintenance or high traffic.')}
          </p>
          <button onClick={() => refetch()} className="retry-button">
            {t('admin.users.retry', 'Retry')}
          </button>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="admin-users">
        <div className="page-header">
          <h1>{t('admin.users.title', 'User Management')}</h1>
          <button className="add-button">
            <FiUserPlus />
            {t('admin.users.addNew', 'Add New User')}
          </button>
        </div>
        
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder={t('admin.users.search', 'Search users...')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>
              <FiSearch />
            </button>
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label>{t('admin.users.filterStatus', 'Status')}:</label>
              <select 
                onChange={(e) => handleFilterChange('status', e.target.value)}
                value={filters.status || ''}
              >
                <option value="">{t('admin.all', 'All')}</option>
                <option value="active">{t('admin.users.statusActive', 'Active')}</option>
                <option value="inactive">{t('admin.users.statusInactive', 'Inactive')}</option>
                <option value="suspended">{t('admin.users.statusSuspended', 'Suspended')}</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>{t('admin.users.filterRole', 'Role')}:</label>
              <select 
                onChange={(e) => handleFilterChange('role', e.target.value)}
                value={filters.role || ''}
              >
                <option value="">{t('admin.all', 'All')}</option>
                <option value="user">{t('admin.users.roleUser', 'User')}</option>
                <option value="admin">{t('admin.users.roleAdmin', 'Admin')}</option>
                <option value="moderator">{t('admin.users.roleModerator', 'Moderator')}</option>
              </select>
            </div>
            
            <button className="reset-filters" onClick={() => {
              setFilters({});
              setSearchText('');
            }}>
              {t('admin.resetFilters', 'Reset Filters')}
            </button>
          </div>
        </div>
        
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>{t('admin.users.id', 'ID')}</th>
                <th>{t('admin.users.name', 'Name')}</th>
                <th>{t('admin.users.email', 'Email')}</th>
                <th>{t('admin.users.role', 'Role')}</th>
                <th>{t('admin.users.status', 'Status')}</th>
                <th>{t('admin.users.joinDate', 'Join Date')}</th>
                <th>{t('admin.users.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {usersData?.users?.map((user) => (
                <tr key={user.id} className={selectedUser === user.id ? 'selected' : ''}>
                  <td>{user.id.substring(0, 8)}...</td>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} />
                        ) : (
                          <div className="avatar-placeholder">
                            {user.firstName?.[0] || user.email[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="user-name">{user.firstName} {user.lastName}</p>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td className="actions-cell">
                    <button 
                      className="action-button edit"
                      onClick={() => setSelectedUser(user.id)}
                    >
                      <FiEdit />
                    </button>
                    
                    {user.status === 'active' ? (
                      <button 
                        className="action-button suspend"
                        onClick={() => handleStatusUpdate(user.id, 'suspended')}
                        disabled={isUpdatingStatus}
                      >
                        <FiUserX />
                      </button>
                    ) : (
                      <button 
                        className="action-button activate"
                        onClick={() => handleStatusUpdate(user.id, 'active')}
                        disabled={isUpdatingStatus}
                      >
                        <FiUserCheck />
                      </button>
                    )}
                    
                    <button 
                      className="action-button delete"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={isDeleting}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usersData?.users?.length === 0 && (
            <div className="empty-state">
              <p>{t('admin.users.noUsers', 'No users found matching your criteria.')}</p>
            </div>
          )}
        </div>
        
        <div className="pagination">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
          >
            {t('admin.prev', 'Previous')}
          </button>
          <span>
            {t('admin.page', 'Page')} {page} {t('admin.of', 'of')} {Math.ceil((usersData?.total || 0) / 10)}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= Math.ceil((usersData?.total || 0) / 10)}
          >
            {t('admin.next', 'Next')}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserManagement; 