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
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      // First, let's try a simple query to see if we can get admin records
      const { data: adminData, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Raw admin data:', adminData); // Debug log
      console.log('Admin query error:', error); // Debug log

      if (error) {
        console.error('Error fetching admins:', error);
        return;
      }

      if (!adminData || adminData.length === 0) {
        console.log('No admins found in database');
        setAdmins([]);
        setTotalAdmins(0);
        setActiveAdmins(0);
        setSuperAdmins(0);
        setInactiveAdmins(0);
        return;
      }

      // Debug: Let's see what fields are actually available
      console.log('Sample admin record structure:', adminData[0]); // Debug log
      console.log('Available fields:', Object.keys(adminData[0] || {})); // Debug log

      // For now, let's transform the data without the profiles join
      const transformedAdmins = adminData.map(admin => ({
        id: admin.id,
        uuid: admin.id, // Use id as uuid since uuid field might not exist
        first_name: 'Admin', // We'll update this once we fix the profiles join
        last_name: admin.id ? admin.id.toString().substring(0, 8) : 'User', // Use first 8 chars of ID as placeholder
        email: `admin-${admin.id}@system.com`, // Placeholder email
        phone_number: null,
        role: admin.role || 'admin',
        status: admin.verified ? 'active' : 'inactive',
        verified: admin.verified || false,
        created_at: admin.created_at,
        last_login: null,
        permissions: getPermissionsByRole(admin.role || 'admin')
      }));

      console.log('Transformed admins:', transformedAdmins); // Debug log

      setAdmins(transformedAdmins);
      
      // Calculate stats
      setTotalAdmins(transformedAdmins.length);
      setActiveAdmins(transformedAdmins.filter(admin => admin.verified).length);
      setSuperAdmins(transformedAdmins.filter(admin => admin.role === 'super_admin').length);
      setInactiveAdmins(transformedAdmins.filter(admin => !admin.verified).length);
      
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get permissions based on role
  const getPermissionsByRole = (role) => {
    switch (role) {
      case 'super_admin':
        return ['users', 'groups', 'payments', 'settings', 'admin_management'];
      case 'admin':
        return ['users', 'groups', 'payments'];
      case 'moderator':
        return ['users', 'groups'];
      default:
        return ['users'];
    }
  };

  const handleCreateAdmin = () => {
    setShowCreateDialog(true);
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowEditDialog(true);
  };

  const handleDeleteAdmin = async (adminId) => {
    if (window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      try {
        // Delete admin from admins table
        const { error: deleteError } = await supabase
          .from('admins')
          .delete()
          .eq('id', adminId);

        if (deleteError) {
          console.error('Error deleting admin:', deleteError);
          alert('Failed to delete admin. Please try again.');
          return;
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
      const { error } = await supabase
        .from('admins')
        .update({ verified: !currentStatus })
        .eq('id', adminId);

      if (error) {
        console.error('Error updating admin verification:', error);
        alert('Failed to update admin status. Please try again.');
        return;
      }

      // Refresh the admin list
      await fetchAdmins();
      
    } catch (error) {
      console.error('Error updating admin verification:', error);
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
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin':
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
                <SelectItem value="super_admin">Super Admin</SelectItem>
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
                    <TableHead className="font-semibold text-xs lg:text-sm hidden lg:table-cell">Last Login</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm hidden xl:table-cell">Created</TableHead>
                    <TableHead className="font-semibold text-xs lg:text-sm text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500 text-sm">
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
                          {formatDate(admin.last_login)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 hidden xl:table-cell">
                          {formatDate(admin.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleVerification(admin.id, admin.verified)}
                              className={`h-8 w-8 p-0 ${admin.verified ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                              title={admin.verified ? 'Deactivate Admin' : 'Verify Admin'}
                            >
                              {admin.verified ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
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
    </div>
  );
}

export default AdminView;
