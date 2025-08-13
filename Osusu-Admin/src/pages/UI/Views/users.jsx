import React, { useState, useEffect } from 'react'
import supabase from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Plus, Users, UserCheck, Calendar } from 'lucide-react'
import UserCreateDialog from './UserCreateDialog'
import UsersTable from './UsersTable'

function UsersPage() {
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const fetchUsers = async () => {
    setUsersLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setUsers(data || [])
    setUsersLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Calculate statistics
  const stats = {
    total: users.length,
    verified: users.length, // All users are verified
    thisMonth: users.filter(user => {
      const userDate = new Date(user.created_at)
      const now = new Date()
      return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear()
    }).length
  }

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.includes(searchTerm)
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'verified' && true) // All users are verified
    
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header Section - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and monitor all users</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline">Total Users</span>
              <span className="sm:hidden">Total</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold text-blue-700">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span className="hidden sm:inline">Verified Users</span>
              <span className="sm:hidden">Verified</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold text-green-700">{stats.verified}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="hidden sm:inline">This Month</span>
              <span className="sm:hidden">New</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold text-purple-700">{stats.thisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section - Mobile Optimized */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
                className="whitespace-nowrap"
              >
                All Users
              </Button>
              <Button
                variant={filterStatus === 'verified' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('verified')}
                className="whitespace-nowrap"
              >
                Verified
              </Button>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredUsers.length} of {stats.total} users</span>
            {searchTerm && (
              <Badge variant="secondary">
                Filtered by: "{searchTerm}"
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <UsersTable 
            users={filteredUsers} 
            loading={usersLoading} 
            onAccountCreated={fetchUsers} 
          />
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <UserCreateDialog 
        open={showCreateDialog}
        onUserCreated={() => {
          fetchUsers()
          setShowCreateDialog(false)
        }}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  )
}

export default UsersPage