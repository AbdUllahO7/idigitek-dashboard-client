"use client"

import { useState, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/src/components/ui/card"
import { TableLoader } from "@/src/components/ui/loader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/src/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert"
import { Badge } from "@/src/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { cn } from "@/src/lib/utils"
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserCircle, 
  Shield, 
  User as UserIcon, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  ShieldAlert,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  Mail,
  Calendar,
  RefreshCw,
  Lock,
  UsersIcon
} from "lucide-react"
import { useAuth } from "@/src/context/AuthContext"
import useUsers from "@/src/hooks/users/use-users"
import { useToast } from "@/src/hooks/use-toast"

// User status enum
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

// User interface - modified to match your actual backend model
interface User {
  id: string; // Backend uses id
  _id?: string; // Frontend might use _id in some places
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
  status: UserStatus;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}


// Type for creating/updating a user
interface UserFormData extends Omit<User, '_id' | 'id'> {
  id?: string; // Make id optional
  password?: string;
  confirmPassword?: string;
}

/**
 * Enhanced Users page component
 * Displays a list of users with their details and provides CRUD functionality
 */
export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all") // "all", "active", "inactive", "pending", "suspended"
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [superOwnerExists, setSuperOwnerExists] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
    status: UserStatus.ACTIVE,
    password: "",
    confirmPassword: ""
  })
  
  const { 
    useGetAll,
    useDelete,
    useUpdate,
    useCreate,
  } = useUsers()

  const { 
    data: usersResponse, 
    isLoading: isLoadingUsers,
    refetch: refetchUsers
  } = useGetAll()

  const deleteUserMutation = useDelete()
  const updateUserMutation = useUpdate()
  const createUserMutation = useCreate()
  const { toast } = useToast()

  const users = usersResponse?.data || []
  const user = useAuth()

  // Check if a owner already exists
  useEffect(() => {
    if (users && users.length > 0) {
      const hasOwnerAdmin = users.some((user: User) => 
        user.role?.toLowerCase() === 'owner'
      );
      setSuperOwnerExists(hasOwnerAdmin);
    }
  }, [users]);

  // Get full name
  const getFullName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    }
    return "-";
  }

  // Get initials for avatar
  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    } else if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    } else if (user.lastName) {
      return user.lastName.charAt(0).toUpperCase();
    }
    return user.email.charAt(0).toUpperCase() || 'U';
  }

  // Filter users based on search term and active tab
  const filteredUsers = users.filter((user: User) => {
    const fullName = getFullName(user).toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.status?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply tab filter
    if (activeTab !== "all") {
      return matchesSearch && user.status === activeTab;
    }
    
    return matchesSearch;
  });

  // Get user statistics 
  const userStats = {
    total: users.length,
    active: users.filter((user: User) => user.status === UserStatus.ACTIVE).length,
    inactive: users.filter((user: User) => user.status === UserStatus.INACTIVE).length,
    pending: users.filter((user: User) => user.status === UserStatus.PENDING).length,
    suspended: users.filter((user: User) => user.status === UserStatus.SUSPENDED).length,
  };

  // Get avatar background color based on role
  const getAvatarColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'owner' : 
      return  "bg-gradient-to-br from-yellow-500 to-rose-900 text-white" ;
      case 'superAdmin':
        return "bg-gradient-to-br from-red-500 to-rose-600 text-white";
      case 'admin':
        return "bg-gradient-to-br from-purple-500 to-indigo-600 text-white";
      default:
        return "bg-gradient-to-br from-blue-500 to-cyan-600 text-white";
    }
  };

  const isOwner = (user: User) => {
    return user.role?.toLowerCase() === 'owner';
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear password error when user types
    if (name === "password" || name === "confirmPassword") {
      setPasswordError("")
    }
    
    // Clear form error
    setFormError(null)
  }

  // Handle role selection
  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }))
    
    // Clear form error
    setFormError(null)
    
    // Show warning if selecting owner and one already exists
    if (value.toLowerCase() === 'owner' && superOwnerExists && isAddDialogOpen) {
      setFormError("A owner user already exists in the system. Only one owner is allowed.");
    }
  }

  // Handle status selection
  const handleStatusChange = (value: UserStatus) => {
    setFormData((prev) => ({ ...prev, status: value }))
    setFormError(null)
  }

  const getCurrentUserRole = () => {
    return user?.user?.role.toString();
  };
 
  // View user details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };
  
  const canModifyOwnerUser = (targetUser: User) => {
    const currentUserRole = getCurrentUserRole();
    
    // If the target user is an owner, only another owner can modify them
    if (targetUser.role?.toLowerCase() === 'owner') {
      return currentUserRole?.toLowerCase() === 'owner';
    }
    
    // Non-owner users can be modified by anyone
    return true;
  };
  // Handle edit user
  const handleEditUser = (user: User) => {
    // Check if trying to edit an owner user when current user is not an owner
    if (user.role?.toLowerCase() === 'owner' && !canModifyOwnerUser(user)) {
      toast({
        title: "Permission denied",
        description: "Only owner users can edit owner accounts",
        variant: "destructive"
      });
      return;
    }
  
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      role: user.role || "user",
      status: user.status || UserStatus.ACTIVE,
      password: "",
      confirmPassword: ""
    });
    setPasswordError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormError(null);
    setIsEditDialogOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Handle add user dialog
  const handleAddUserDialog = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "user",
      status: UserStatus.ACTIVE,
      password: "",
      confirmPassword: ""
    })
    setPasswordError("")
    setFormError(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
    setIsAddDialogOpen(true)
  }

  // Validate password match
  const validatePasswords = () => {
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match")
      return false
    }
    if ((formData.password || "").length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return false
    }
    return true
  }

  // Submit delete user
  const submitDeleteUser = async () => {
    // Use id if available, otherwise fall back to _id
    const userId = selectedUser?.id || selectedUser?._id;
    
    if (!userId) return;
    
    // Extra safety check to prevent deletion of owner users
    if (selectedUser && isOwner(selectedUser)) {
      toast({
        title: "Operation not allowed",
        description: "Owner users cannot be deleted",
        variant: "destructive"
      });
      setIsDeleteDialogOpen(false);
      return;
    }
    
    try {
      await deleteUserMutation.mutateAsync(userId);
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully",
        variant: "default"
      });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Submit edit user
  const submitEditUser = async () => {
    // Use id if available, otherwise fall back to _id
    const userId = selectedUser?.id || selectedUser?._id;
    
    if (!userId) return;
    
    // Check if trying to change role to owner when one already exists
    if (
      formData.role?.toLowerCase() === 'owner' && 
      superOwnerExists && 
      selectedUser?.role?.toLowerCase() !== 'owner'
    ) {
      setFormError("A Owner user already exists in the system. Only one Owner is allowed.");
      return;
    }

    // Validate password if it's being changed
    if (formData.password && !validatePasswords()) {
      return;
    }
    
    // Remove confirmPassword before sending to API
    const userData = { ...formData };
    if (!userData.password) {
      delete userData.password;
    }
    delete userData.confirmPassword;
    
    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        data: userData
      });
      toast({
        title: "User updated",
        description: "The user has been updated successfully",
        variant: "default"
      });
      setIsEditDialogOpen(false);
    } catch (error: any) {
      // Check for the specific owner error
      if (error?.response?.data?.message?.includes("owner user already exists") || 
          error?.message?.includes("owner user already exists")) {
        setFormError("A owner user already exists in the system. Only one owner is allowed.");
      } else {
        toast({
          title: "Error",
          description: error?.response?.data?.message || error?.message || "Failed to update user. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  // Submit add user
  const submitAddUser = async () => {
    // Validate password match
    if (!validatePasswords()) return;
    
    // Check if trying to create a owner when one already exists
    if (formData.role?.toLowerCase() === 'owner' && superOwnerExists) {
      setFormError("A owner user already exists in the system. Only one owner is allowed.");
      return;
    }
    
    // Create a copy of form data without confirmPassword
    const userData = { ...formData };
    delete userData.confirmPassword;
    
    try {
      await createUserMutation.mutateAsync(userData as any)
      toast({
        title: "User added",
        description: "The new user has been added successfully",
        variant: "default"
      })
      setIsAddDialogOpen(false)
    } catch (error: any) {
      // Check for the specific owner error
      if (error?.response?.data?.message?.includes("owner user already exists") || 
          error?.message?.includes("owner user already exists")) {
        setFormError("A owner user already exists in the system. Only one owner is allowed.");
      } else {
        toast({
          title: "Error",
          description: error?.response?.data?.message || error?.message || "Failed to add user. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return <Shield className="h-4 w-4 text-red-900 mr-2" />
      case 'superadmin':
        return <Shield className="h-4 w-4 text-red-500 mr-2" />
      case 'admin':
        return <Shield className="h-4 w-4 text-purple-500 mr-2" />
      default:
        return <UserIcon className="h-4 w-4 text-blue-500 mr-2" />
    }
  }

  // Get status badge
  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Active</span>
          </Badge>
        )
      case UserStatus.INACTIVE:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Inactive</span>
          </Badge>
        )
      case UserStatus.SUSPENDED:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Suspended</span>
          </Badge>
        )
      case UserStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending</span>
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Unknown</span>
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header with stats */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-1">
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles and permissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="w-full md:w-[300px] pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetchUsers()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddUserDialog} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* User stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
                <p className="text-2xl font-bold">{userStats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "shadow-sm hover:shadow-md transition-shadow cursor-pointer",
            activeTab === "active" ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-white dark:bg-slate-950"
          )} onClick={() => setActiveTab(activeTab === "active" ? "all" : "active")}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Active</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{userStats.active}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "shadow-sm hover:shadow-md transition-shadow cursor-pointer",
            activeTab === "inactive" ? "bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800" : "bg-white dark:bg-slate-950"
          )} onClick={() => setActiveTab(activeTab === "inactive" ? "all" : "inactive")}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Inactive</p>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-400">{userStats.inactive}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "shadow-sm hover:shadow-md transition-shadow cursor-pointer",
            activeTab === "pending" ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800" : "bg-white dark:bg-slate-950"
          )} onClick={() => setActiveTab(activeTab === "pending" ? "all" : "pending")}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{userStats.pending}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "shadow-sm hover:shadow-md transition-shadow cursor-pointer",
            activeTab === "suspended" ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" : "bg-white dark:bg-slate-950"
          )} onClick={() => setActiveTab(activeTab === "suspended" ? "all" : "suspended")}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Suspended</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{userStats.suspended}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Users table */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-slate-50 dark:bg-slate-900 rounded-t-lg border-b px-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center">
                <UsersIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                Users
                {activeTab !== "all" && (
                  <Badge className="ml-2 capitalize">
                    {activeTab}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1.5">
                {searchTerm ? `Search results for "${searchTerm}"` : "Showing all users"}
                {filteredUsers.length > 0 && ` (${filteredUsers.length} ${filteredUsers.length === 1 ? 'user' : 'users'})`}
              </CardDescription>
            </div>
            {activeTab !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("all")}>
                Clear filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingUsers ? (
            <div className="p-8">
              <TableLoader />
            </div>
          ) : (
            <div className="rounded-b-lg overflow-hidden">
              <Table className="border-collapse">
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead className="w-[250px] font-medium">Name</TableHead>
                    <TableHead className="w-[250px] font-medium">Email</TableHead>
                    <TableHead className="font-medium">Role</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium">Created</TableHead>
                    <TableHead className="text-right font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {searchTerm || activeTab !== "all" ? (
                          <div className="flex flex-col items-center justify-center text-muted-foreground py-8">
                            <Search className="h-10 w-10 mb-3 text-muted-foreground/50" />
                            <p className="text-lg mb-1">No users found</p>
                            <p className="text-sm text-muted-foreground/70">
                              {searchTerm && activeTab !== "all" 
                                ? `No ${activeTab} users match "${searchTerm}"` 
                                : searchTerm 
                                  ? `No users match "${searchTerm}"`
                                  : `No users with status: ${activeTab}`}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground py-8">
                            <UsersIcon className="h-10 w-10 mb-3 text-muted-foreground/50" />
                            <p className="text-lg mb-1">No users yet</p>
                            <p className="text-sm text-muted-foreground/70">Create your first user to get started</p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user: User) => (
                      <TableRow 
                        key={user.id} 
                        className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                        onClick={() => handleViewUser(user)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center mr-3 text-sm font-semibold",
                              getAvatarColor(user.role)
                            )}>
                              {getInitials(user)}
                            </div>
                            <span>{getFullName(user)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getRoleIcon(user.role || "")}
                            <span className="capitalize">{user.role || "user"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.status as UserStatus)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(user.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              {(user.role?.toLowerCase() !== 'owner' || getCurrentUserRole()?.toLowerCase() === 'owner') && (
                                  <DropdownMenuItem 
                                    onClick={() => handleEditUser(user)}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                )}

                              
                              {/* Only show delete option if user is not a owner */}
                              {user.role?.toLowerCase() !== 'owner' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteUser(user)}
                                    className="cursor-pointer text-red-600 focus:text-red-600 dark:focus:text-red-400 dark:text-red-400"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogTitle></DialogTitle>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
          <div className="relative">
            {/* Header gradient background */}
            <div className="absolute inset-0 h-40 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700" />
            
            {/* User card with avatar that overlaps the gradient */}
            <div className="relative pt-16 px-6">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white dark:border-slate-900 shadow-lg",
                  selectedUser ? getAvatarColor(selectedUser.role) : "bg-blue-500"
                )}>
                  {selectedUser ? getInitials(selectedUser) : "U"}
                </div>
                <h2 className="mt-4 text-2xl font-bold">
                  {selectedUser ? getFullName(selectedUser) : "User"}
                </h2>
                <div className="flex items-center mt-1 text-muted-foreground">
                  <Mail className="h-4 w-4 mr-1.5" />
                  <span>{selectedUser?.email}</span>
                </div>
                <div className="mt-3">
                  {selectedUser && getStatusBadge(selectedUser.status as UserStatus)}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Role</h3>
                    <div className="flex items-center">
                      {selectedUser && getRoleIcon(selectedUser.role || "")}
                      <span className="font-medium capitalize">{selectedUser?.role || "User"}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Account Created</h3>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{selectedUser ? formatDate(selectedUser.createdAt) : "-"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
                    <div className="flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{selectedUser ? formatDate(selectedUser.updatedAt) : "-"}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Email Verification</h3>
                    <div className="flex items-center">
                      {selectedUser?.isEmailVerified ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                          <span className="text-amber-600 dark:text-amber-400">Not verified</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t">
              <div className="flex items-center justify-between w-full">
                <div>
                  {/* Only show Delete button if user is not owner */}
                  {selectedUser?.role?.toLowerCase() !== 'owner' && (
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleDeleteUser(selectedUser!);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                  
                  {/* Only show Edit button if current user is owner or target user is not owner */}
                  {(selectedUser?.role?.toLowerCase() !== 'owner' || getCurrentUserRole()?.toLowerCase() === 'owner') ? (
                    <Button 
                      onClick={() => {
                        setIsViewDialogOpen(false);
                        handleEditUser(selectedUser!);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </Button>
                  ) : null}
                </div>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600 dark:text-red-500">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center mr-4 text-white",
                selectedUser ? getAvatarColor(selectedUser.role) : "bg-blue-500"
              )}>
                {selectedUser ? getInitials(selectedUser) : 'U'}
              </div>
              <div>
                <p className="font-medium">{selectedUser ? getFullName(selectedUser) : 'Unnamed User'}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 mr-1" />
                  <span>{selectedUser?.email}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={submitDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl flex items-center">
              <Edit className="h-5 w-5 mr-2 text-blue-500" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Make changes to the user's information below.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-2">
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm">First Name</Label>
                  <div className="relative">
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      className="pl-9"
                    />
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                  <div className="relative">
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last name"
                      className="pl-9"
                    />
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                    className="pl-9"
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
             
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm">Role</Label>
                
                  <Select
                    value={formData.role}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger id="role" className="pl-9">
                      <div className="absolute left-3 top-2 h-4 w-4 text-muted-foreground">
                        {getRoleIcon(formData.role || "")}
                      </div>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superAdmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={UserStatus.INACTIVE}>Inactive</SelectItem>
                      <SelectItem value={UserStatus.SUSPENDED}>Suspended</SelectItem>
                      <SelectItem value={UserStatus.PENDING}>Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.role?.toLowerCase() === 'owner' && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 mb-1 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      This user is currently a owner
                    </div>
                  )}

              {/* Password reset section */}
              <div className="mt-4 pt-4 border-t border-dashed dark:border-slate-700">
                <h3 className="text-base font-medium mb-3 flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                  Reset Password
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Leave these fields empty if you don't want to change the password
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-password" className="text-sm">New Password</Label>
                    <div className="relative">
                      <Input
                        id="edit-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter new password"
                        className="pl-9 pr-10"
                      />
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-confirm-password" className="text-sm">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="edit-confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm new password"
                        className="pl-9 pr-10"
                      />
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                      </Button>
                    </div>
                    {passwordError && (
                      <p className="text-sm text-red-500 mt-1">{passwordError}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-900 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitEditUser}
              disabled={updateUserMutation.isPending || !!formError}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500"
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl flex items-center">
              <Plus className="h-5 w-5 mr-2 text-blue-500" />
              Add New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account by filling out the form below.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="p-6 pt-2 max-h-[calc(80vh-220px)]">
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-firstName" className="text-sm">First Name</Label>
                  <div className="relative">
                    <Input
                      id="new-firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      className="pl-9"
                    />
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-lastName" className="text-sm">Last Name</Label>
                  <div className="relative">
                    <Input
                      id="new-lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last name"
                      className="pl-9"
                    />
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email" className="text-sm">Email</Label>
                <div className="relative">
                  <Input
                    id="new-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                    className="pl-9"
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="pl-9 pr-10"
                  />
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-confirm-password" className="text-sm">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="new-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="pl-9 pr-10"
                  />
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-500 mt-1">{passwordError}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-role" className="text-sm">Role</Label>
                  
                  <Select
                    value={formData.role}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger id="new-role" className="pl-9">
                      <div className="absolute left-3 top-2 h-4 w-4 text-muted-foreground">
                        {getRoleIcon(formData.role || "")}
                      </div>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superAdmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-status" className="text-sm">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger id="new-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={UserStatus.INACTIVE}>Inactive</SelectItem>
                      <SelectItem value={UserStatus.SUSPENDED}>Suspended</SelectItem>
                      <SelectItem value={UserStatus.PENDING}>Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {superOwnerExists && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 mb-1 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      A owner already exists in the system
                    </div>
                  )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-900 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitAddUser}
              disabled={createUserMutation.isPending || !!formError}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  }