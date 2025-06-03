"use client"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Plus, RefreshCw, Search } from "lucide-react"
import { useUserManagement } from "@/src/hooks/users/useUserManagement"
import { ViewUserDialog } from "@/src/components/dashboard/user/ViewUserDialog"
import { UserTable } from "@/src/components/dashboard/user/UserTable"
import { UserStats } from "@/src/components/dashboard/user/UserStats"
import { EditUserDialog } from "@/src/components/dashboard/user/EditUserDialog"
import { DeleteUserDialog } from "@/src/components/dashboard/user/DeleteUserDialog"
import { AddUserDialog } from "@/src/components/dashboard/user/AddUserDialog"
import { useTranslation } from "react-i18next"
import { useLanguage } from "@/src/context/LanguageContext"

export default function UsersPage() {
  const { t, ready } = useTranslation()
  const { isLoaded } = useLanguage()
  
  const {
    // Data
    users,
    filteredUsers,
    userStats,
    selectedUser,
    formData,
    searchTerm,
    activeTab,
    passwordError,
    formError,
    superOwnerExists,
    
    // Loading states
    isLoadingUsers,
    isUpdating,
    isDeleting,
    isCreating,
    
    // Dialog states
    isViewDialogOpen,
    isEditDialogOpen,
    isAddDialogOpen,
    isDeleteDialogOpen,
    setIsViewDialogOpen,
    setIsEditDialogOpen,
    setIsAddDialogOpen,
    setIsDeleteDialogOpen,
    
    // Password visibility
    showPassword,
    showConfirmPassword,
    toggleShowPassword,
    toggleShowConfirmPassword,
    
    // State setters
    setSearchTerm,
    setActiveTab,
    
    // Form handlers
    handleChange,
    handleRoleChange,
    handleStatusChange,
    
    // Dialog handlers
    handleViewUser,
    handleEditUser,
    handleDeleteUser,
    handleAddUserDialog,
    
    // Form submission
    submitDeleteUser,
    submitEditUser,
    submitAddUser,
    
    // User role helpers
    getCurrentUserRole,
    canModifyOwnerUser,
    
    // Data management
    refetchUsers
  } = useUserManagement();

  // Show loading state if translations aren't ready
  if (!ready || !isLoaded) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Page header with stats */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-1">
              {t('Users.title', 'User Management')}
            </h1>
            <p className="text-muted-foreground">
              {t('Users.subtitle', 'Manage user accounts, roles and permissions')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('Users.search.placeholder', 'Search users...')}
                className="w-full md:w-[300px] pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => refetchUsers()}
              title={t('Users.buttons.refresh', 'Refresh')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleAddUserDialog} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('Users.buttons.addUser', 'Add User')}
            </Button>
          </div>
        </div>

        {/* User statistics cards */}
        <UserStats 
          stats={userStats}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          t={t} // Pass translation function to child component
        />
      </div>

      {/* Users table */}
      <UserTable
        users={users}
        filteredUsers={filteredUsers}
        isLoading={isLoadingUsers}
        activeTab={activeTab}
        searchTerm={searchTerm}
        setActiveTab={setActiveTab}
        onViewUser={handleViewUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        currentUserRole={getCurrentUserRole()}
        t={t} // Pass translation function to child component
      />

      {/* View User Dialog */}
      <ViewUserDialog
        user={selectedUser}
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        canEditOwner={selectedUser ? canModifyOwnerUser(selectedUser) : false}
      />

      {/* Add User Dialog */}
      <AddUserDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={submitAddUser}
        formData={formData}
        onChange={handleChange}
        onRoleChange={handleRoleChange}
        onStatusChange={handleStatusChange}
        passwordError={passwordError}
        formError={formError}
        isCreating={isCreating}
        superOwnerExists={superOwnerExists}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        toggleShowPassword={toggleShowPassword}
        toggleShowConfirmPassword={toggleShowConfirmPassword}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={submitEditUser}
        formData={formData}
        onChange={handleChange}
        onRoleChange={handleRoleChange}
        onStatusChange={handleStatusChange}
        passwordError={passwordError}
        formError={formError}
        isUpdating={isUpdating}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        toggleShowPassword={toggleShowPassword}
        toggleShowConfirmPassword={toggleShowConfirmPassword}
      />

      {/* Delete User Dialog */}
      <DeleteUserDialog
        user={selectedUser}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={submitDeleteUser}
        isDeleting={isDeleting}
      />
    </div>
  );
}