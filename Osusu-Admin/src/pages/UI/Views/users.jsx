import React, { useState, useEffect } from 'react'
import supabase from '@/lib/supabase'
import UserCreateDialog from './UserCreateDialog'
import UsersTable from './UsersTable'

function UsersPage() {
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)

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

  return (
    <div className="mt-10 p-6 bg-white rounded shadow">
      <UserCreateDialog onUserCreated={fetchUsers} />
      <UsersTable users={users} loading={usersLoading} onAccountCreated={fetchUsers} />
    </div>
  )
}

export default UsersPage