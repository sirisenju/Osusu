import React from 'react'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'
import CreateAccountDialog from './CreateAccountDialog'
import EditAccountDialog from './EditAccountDialog'

export default function UsersTable({ users, loading, onAccountCreated }) {
  const [accountDialogUser, setAccountDialogUser] = React.useState(null)
  const [editAccountUser, setEditAccountUser] = React.useState(null)

  // Helper: check if user has an account (assume users[] has 'account_number' or similar field if joined, else add logic to fetch accounts)
  const userHasAccount = user => !!user.account_number || !!user.bank_name || !!user.status;

  return (
    <div className="mt-10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Date of Birth</TableHead>
            <TableHead>NIN</TableHead>
            <TableHead>Passport</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>
          ) : users.length === 0 ? (
            <TableRow><TableCell colSpan={7}>No users found.</TableCell></TableRow>
          ) : (
            users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.first_name} {user.last_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone_number}</TableCell>
                <TableCell>{user.date_of_birth}</TableCell>
                <TableCell>{user.nin}</TableCell>
                <TableCell>
                  {user.passport_url ? (
                    <img src={user.passport_url} alt="passport" className="w-10 h-10 object-cover rounded" />
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2"><MoreVertical size={18} /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setAccountDialogUser(user)} disabled={userHasAccount(user)}>
                        Create Account
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditAccountUser(user)}>
                        Edit Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {accountDialogUser && (
        <CreateAccountDialog user={accountDialogUser} onAccountCreated={() => { setAccountDialogUser(null); onAccountCreated(); }} />
      )}
      {editAccountUser && (
        <EditAccountDialog user={editAccountUser} onClose={() => setEditAccountUser(null)} onAccountUpdated={onAccountCreated} />
      )}
    </div>
  )
}
