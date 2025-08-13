import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  Settings, 
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CreateAdminDialog from './createAdminDialog';
import EditAdminDialog from './editAdminDialog';
import supabase from '../../../../lib/supabase';

function AdminView() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  
  // Stats
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [activeAdmins, setActiveAdmins] = useState(0);
  const [superAdmins, setSuperAdmins] = useState(0);
  const [inactiveAdmins, setInactiveAdmins] = useState(0);
  const [adminActions, setAdminActions] = useState([]);

  useEffect(() => {
    fetchAdmins();
    fetchRecentAdminActions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch recent admin actions for activity tracking
  const fetchRecentAdminActions = async () => {
    try {
      // Simplified query first to see if admin_actions table exists
      const { data: actions, error } = await supabase
        .from('admin_actions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      console.log('Admin actions data:', actions); // Debug log
      console.log('Admin actions error:', error); // Debug log

      if (!error && actions) {
        setAdminActions(actions);
      } else {
        console.log('No admin actions found or table does not exist');
        setAdminActions([]);
      }
    } catch (error) {
      console.error('Error fetching admin actions:', error);
      setAdminActions([]); // Set empty array on error
    }
  };

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      // Query admin_profiles table to get the actual admin data
      const { data: adminProfiles, error: profilesError } = await supabase
        .from('admin_profiles')
        .select(`
          id,
          full_name,
          email,
          phone_number,
          nin,
          address,
          created_at
        `)
        .order('created_at', { ascending: false });

      console.log('Admin profiles data:', adminProfiles); // Debug log
      console.log('Admin profiles error:', profilesError); // Debug log

      if (profilesError) {
        console.error('Error fetching admin profiles:', profilesError);
        setAdmins([]);
        setTotalAdmins(0);
        setActiveAdmins(0);
        setSuperAdmins(0);
        setInactiveAdmins(0);
        return;
      }

      if (!adminProfiles || adminProfiles.length === 0) {
        console.log('No admin profiles found in database');
        setAdmins([]);
        setTotalAdmins(0);
        setActiveAdmins(0);
        setSuperAdmins(0);
        setInactiveAdmins(0);
        return;
      }

      // Now get the admin records to get role, status and other information
      // Link admin_profiles.id with admins.id (both are uuid strings)
      const profileIds = adminProfiles.map(profile => profile.id);
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id, role, verified, status, privileges, created_by, created_at')
        .in('id', profileIds)
        .order('created_at', { ascending: false });

      console.log('Admin data:', adminData); // Debug log
      console.log('Admin error:', adminError); // Debug log

      // Create a map of admin data by id for easy lookup
      const adminMap = {};
      if (adminData && !adminError) {
        adminData.forEach(admin => {
          adminMap[admin.id] = admin;
        });
      }

      // Transform and merge the data
      const transformedAdmins = adminProfiles.map(profile => {
        const adminInfo = adminMap[profile.id] || {}; // Use profile.id to match admin.id
        const nameParts = profile.full_name ? profile.full_name.split(' ') : ['Admin', 'User'];
        
        return {
          id: profile.id, // Use profile.id as the main id (which is a uuid)
          uuid: profile.id, // Use profile.id as uuid for compatibility
          first_name: nameParts[0] || 'Admin',
          last_name: nameParts.slice(1).join(' ') || 'User',
          full_name: profile.full_name || 'Admin User',
          email: profile.email || 'No email',
          phone_number: profile.phone_number,
          nin: profile.nin,
          address: profile.address,
          avatar_url: profile.avatar_url,
          role: adminInfo.role || 'admin',
          status: adminInfo.status || 'inactive', // Use status field directly from admins table
          verified: adminInfo.verified || false,
          privileges: adminInfo.privileges || {},
          created_by: adminInfo.created_by,
          created_at: profile.created_at,
          last_login: null, // This would need to come from a sessions table if tracked
          permissions: getPermissionsFromPrivileges(adminInfo.privileges || {})
        };
      });

      console.log('Transformed admins:', transformedAdmins); // Debug log
      
      // Debug: Show all admin roles
      console.log('Admin roles found:', transformedAdmins.map(admin => ({
        name: admin.full_name,
        role: admin.role
      })));

      setAdmins(transformedAdmins);
      
      // Calculate stats based on actual status values
      setTotalAdmins(transformedAdmins.length);
      setActiveAdmins(transformedAdmins.filter(admin => admin.status === 'active').length);
      setSuperAdmins(transformedAdmins.filter(admin => admin.role === 'superadmin').length);
      setInactiveAdmins(transformedAdmins.filter(admin => admin.status === 'inactive').length);
      
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get permissions from privileges object
  const getPermissionsFromPrivileges = (privileges) => {
    if (!privileges || typeof privileges !== 'object') {
      return [];
    }
    
    // Extract keys where value is true
    return Object.keys(privileges).filter(key => privileges[key] === true);
  };

  // Helper function to get permissions based on role (fallback)
  // const getPermissionsByRole = (role) => {
  //   switch (role) {
  //     case 'super_admin':
  //       return ['can_manage_users', 'can_create_groups', 'can_verify_payments', 'can_assign_slots', 'can_manage_admins'];
  //     case 'admin':
  //       return ['can_manage_users', 'can_create_groups', 'can_verify_payments'];
  //     case 'moderator':
  //       return ['can_manage_users', 'can_create_groups'];
  //     default:
  //       return ['can_manage_users'];
  //   }
  // };

  const handleCreateAdmin = () => {
    setShowCreateDialog(true);
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowEditDialog(true);
  };

  const handleViewDetails = (admin) => {
    setSelectedAdmin(admin);
    setShowDetailsDialog(true);
  };

  const handleDeleteAdmin = async (adminId) => {
    if (window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      try {
        // Delete from both tables
        const { error: adminError } = await supabase
          .from('admins')
          .delete()
          .eq('id', adminId);

        if (adminError) {
          console.error('Error deleting from admins table:', adminError);
          alert('Failed to delete admin. Please try again.');
          return;
        }

        // Delete from admin_profiles table (use id field)
        const { error: profileError } = await supabase
          .from('admin_profiles')
          .delete()
          .eq('id', adminId);

        if (profileError) {
          console.error('Error deleting from admin_profiles table:', profileError);
          // Continue anyway since the main admin record is deleted
        }

        // Refresh the admin list
        await fetchAdmins();
        
        // Optional: Show success message
        alert('Admin deleted successfully.');
        
      } catch (error) {
        console.error('Error deleting admin:', error);
        alert('Failed to delete admin. Please try again.');
      }
    }
  };

  const handleToggleVerification = async (adminId, currentStatus) => {
    try {
      // Toggle between active and inactive status
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('admins')
        .update({ 
          status: newStatus,
          verified: newStatus === 'active' // Keep verified in sync with status
        })
        .eq('id', adminId);

      if (error) {
        console.error('Error updating admin status:', error);
        alert('Failed to update admin status. Please try again.');
        return;
      }

      // Refresh the admin list
      await fetchAdmins();
      
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Failed to update admin status. Please try again.');
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || admin.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || admin.status === statusFilter;
    
    // Debug log for role filtering
    if (roleFilter === 'superadmin') {
      console.log('Filtering for superadmin:', {
        adminName: admin.full_name,
        adminRole: admin.role,
        matchesRole: matchesRole
      });
    }
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'moderator':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="transition-transform duration-150 hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex items-center gap-2 lg:gap-3 pb-2 lg:pb-3">
            <div className="bg-blue-500/10 rounded-full p-1.5 lg:p-2">
              <Users size={16} className="lg:w-5 lg:h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base lg:text-lg font-bold">{totalAdmins}</CardTitle>
              <CardDescription className="text-xs">Total Admins</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="transition-transform duration-150 hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex items-center gap-2 lg:gap-3 pb-2 lg:pb-3">
            <div className="bg-green-500/10 rounded-full p-1.5 lg:p-2">
              <ShieldCheck size={16} className="lg:w-5 lg:h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base lg:text-lg font-bold">{activeAdmins}</CardTitle>
              <CardDescription className="text-xs">Active Admins</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="transition-transform duration-150 hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex items-center gap-2 lg:gap-3 pb-2 lg:pb-3">
            <div className="bg-red-500/10 rounded-full p-1.5 lg:p-2">
              <Shield size={16} className="lg:w-5 lg:h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-base lg:text-lg font-bold">{superAdmins}</CardTitle>
              <CardDescription className="text-xs">Super Admins</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="transition-transform duration-150 hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex items-center gap-2 lg:gap-3 pb-2 lg:pb-3">
            <div className="bg-gray-500/10 rounded-full p-1.5 lg:p-2">
              <Users size={16} className="lg:w-5 lg:h-5 text-gray-600" />
            </div>
            <div>
              <CardTitle className="text-base lg:text-lg font-bold">{inactiveAdmins}</CardTitle>
              <CardDescription className="text-xs">Inactive Admins</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 lg:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleCreateAdmin}
            className="flex items-center gap-2 h-9 w-full sm:w-auto"
          >
            <UserPlus className="h-4 w-4" />
            <span className="sm:inline">Add New Admin</span>
          </Button>
        </div>
      </div>

      {/* Admins Table */}
      <Card>
        <CardHeader className="pb-3 lg:pb-4">
          <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
            <Settings className="h-4 w-4 lg:h-5 lg:w-5" />
            Admin Management
          </CardTitle>
          <CardDescription className="text-sm">
            Manage admin accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading admins...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold text-xs lg:text-sm">Name</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm hidden sm:table-cell">Email</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm">Role</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm hidden md:table-cell">Status</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm hidden lg:table-cell">Created</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500 text-sm">
                        No admins found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdmins.map((admin) => (
                      <TableRow key={admin.id} className="hover:bg-gray-50/50">
                        <TableCell className="font-medium text-sm">
                          <div>
                            <div>{admin.first_name} {admin.last_name}</div>
                            <div className="sm:hidden text-xs text-gray-500 mt-1">{admin.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 hidden sm:table-cell">
                          {admin.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(admin.role)}`}>
                            {admin.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className={`text-xs ${getStatusBadgeColor(admin.status)}`}>
                            {admin.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 hidden lg:table-cell">
                          {formatDate(admin.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(admin)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="View Details"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleVerification(admin.id, admin.status)}
                              className={`h-8 w-8 p-0 ${admin.status === 'active' ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                              title={admin.status === 'active' ? 'Deactivate Admin' : 'Activate Admin'}
                            >
                              {admin.status === 'active' ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAdmin(admin)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
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

      {/* Recent Admin Activity */}
      {adminActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3 lg:pb-4">
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <Eye className="h-4 w-4 lg:h-5 lg:w-5" />
              Recent Admin Activity
            </CardTitle>
            <CardDescription className="text-sm">
              Latest actions performed by administrators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminActions.slice(0, 5).map((action) => (
              <div key={action.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="text-xs">
                    {action.action ? action.action.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">
                      {action.entity_type || 'Entity'} {action.action ? action.action.split('_')[0] : 'action'}d
                    </p>
                    <p className="text-xs text-gray-500">
                      by Admin ID: {action.admin_id ? action.admin_id.substring(0, 8) : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {action.timestamp ? new Date(action.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'No date'}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateAdminDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onAdminCreated={fetchAdmins}
        />
      )}

      {showEditDialog && selectedAdmin && (
        <EditAdminDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedAdmin(null);
          }}
          admin={selectedAdmin}
          onAdminUpdated={fetchAdmins}
        />
      )}

      {/* Admin Details Dialog */}
      {showDetailsDialog && selectedAdmin && (
        <Dialog open={showDetailsDialog} onOpenChange={() => setShowDetailsDialog(false)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base lg:text-lg">
                <User className="h-4 w-4 lg:h-5 lg:w-5" />
                Admin Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Profile Section */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-center sm:justify-start">
                  <Avatar className="w-20 h-20">
                    <AvatarImage 
                      src={selectedAdmin.avatar_url} 
                      alt={selectedAdmin.full_name}
                    />
                    <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-800">
                      {selectedAdmin.full_name 
                        ? selectedAdmin.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                        : 'AD'
                      }
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedAdmin.full_name || 'Admin User'}
                  </h3>
                  <Badge variant="outline" className={`mt-1 ${getRoleBadgeColor(selectedAdmin.role)}`}>
                    {selectedAdmin.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <div className="mt-2">
                    <Badge variant="outline" className={`${getStatusBadgeColor(selectedAdmin.status)}`}>
                      {selectedAdmin.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-sm text-gray-600">{selectedAdmin.email || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone Number</p>
                      <p className="text-sm text-gray-600">{selectedAdmin.phone_number || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {selectedAdmin.address && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Address</p>
                      <p className="text-sm text-gray-600">{selectedAdmin.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Additional Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedAdmin.nin && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">NIN</p>
                      <p className="text-sm text-gray-600">{selectedAdmin.nin}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Member Since</p>
                      <p className="text-sm text-gray-600">{formatDate(selectedAdmin.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Privileges</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedAdmin.permissions && selectedAdmin.permissions.length > 0 ? (
                    selectedAdmin.permissions.map((permission) => (
                      <div key={permission} className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">
                          {permission.replace('can_', '').replace('_', ' ').split(' ').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-sm text-gray-500 p-4 text-center bg-gray-50 rounded-lg">
                      No privileges assigned
                    </div>
                  )}
                </div>
                
                {/* Raw privileges object for debugging */}
                {selectedAdmin.privileges && Object.keys(selectedAdmin.privileges).length > 0 && (
                  <div className="mt-4">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-600">Raw Privileges Data</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(selectedAdmin.privileges, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>

              {/* System Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">System Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">User ID</p>
                    <p className="text-xs text-gray-600 font-mono">{selectedAdmin.uuid}</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default AdminView;
