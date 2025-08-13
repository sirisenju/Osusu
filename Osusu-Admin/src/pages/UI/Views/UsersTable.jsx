import React from 'react'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MoreVertical, User, Mail, Phone, Calendar, CreditCard, FileText, Check, Image } from 'lucide-react'
import CreateAccountDialog from './CreateAccountDialog'
import EditAccountDialog from './EditAccountDialog'

export default function UsersTable({ users, loading, onAccountCreated }) {
  const [accountDialogUser, setAccountDialogUser] = React.useState(null)
  const [editAccountUser, setEditAccountUser] = React.useState(null)

  // Helper: check if user has an account
  const userHasAccount = user => !!user.account_number || !!user.bank_name || !!user.status

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const getInitials = (firstName, lastName) => {
    const first = firstName || ''
    const last = lastName || ''
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || '??'
  }

  const getFullName = (user) => {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading users...</span>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>NIN</TableHead>
              <TableHead>Passport</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {getInitials(user.first_name, user.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">{getFullName(user)}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Mail className="h-3 w-3 mr-1 text-gray-400" />
                      {user.email || 'N/A'}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-3 w-3 mr-1 text-gray-400" />
                      {user.phone_number || 'N/A'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                    {formatDate(user.date_of_birth)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <FileText className="h-3 w-3 mr-1 text-gray-400" />
                    {user.nin || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  {user.passport_url ? (
                    <div className="flex items-center space-x-2">
                      <img 
                        src={user.passport_url} 
                        alt="passport" 
                        className="w-8 h-8 object-cover rounded border"
                      />
                      <Badge variant="outline" className="text-xs">
                        <Image className="h-3 w-3 mr-1" />
                        Image
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No image</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="default" className="text-xs">
                      Verified
                    </Badge>
                    {userHasAccount(user) && (
                      <Badge variant="outline" className="text-xs flex items-center">
                        <CreditCard className="h-3 w-3 mr-1" />
                        Account
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => setAccountDialogUser(user)} 
                        disabled={userHasAccount(user)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Create Account
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditAccountUser(user)}>
                        <User className="h-4 w-4 mr-2" />
                        Edit Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 p-4">
        {users.map(user => (
          <Card key={user.id} className="relative">
            <CardContent className="p-4">
              {/* User Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                      {getInitials(user.first_name, user.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">{getFullName(user)}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => setAccountDialogUser(user)} 
                      disabled={userHasAccount(user)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Create Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditAccountUser(user)}>
                      <User className="h-4 w-4 mr-2" />
                      Edit Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 gap-3 mb-4">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium mr-2">Phone:</span>
                  <span className="text-gray-600">{user.phone_number || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium mr-2">DOB:</span>
                  <span className="text-gray-600">{formatDate(user.date_of_birth)}</span>
                </div>
              </div>

              {/* Documents Information */}
              <div className="grid grid-cols-1 gap-2 mb-4">
                <div className="flex items-center text-sm">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium mr-2">NIN:</span>
                  <span className="text-gray-600">{user.nin || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm">
                  {user.passport_url ? (
                    <>
                      <Image className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium mr-2">Passport:</span>
                      <img 
                        src={user.passport_url} 
                        alt="passport" 
                        className="w-6 h-6 object-cover rounded border ml-1"
                      />
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium mr-2">Passport:</span>
                      <span className="text-gray-600">N/A</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant="default" 
                  className="text-xs flex items-center"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
                {userHasAccount(user) && (
                  <Badge variant="outline" className="text-xs flex items-center">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Has Account
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogs */}
      {accountDialogUser && (
        <CreateAccountDialog 
          user={accountDialogUser} 
          onAccountCreated={() => { 
            setAccountDialogUser(null) 
            onAccountCreated() 
          }} 
        />
      )}
      {editAccountUser && (
        <EditAccountDialog 
          user={editAccountUser} 
          onClose={() => setEditAccountUser(null)} 
          onAccountUpdated={onAccountCreated} 
        />
      )}
    </div>
  )
}
