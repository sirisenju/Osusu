import { Button } from '@/components/ui/button'
import { User, Users, Group } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import CreateUserModal from '../../../../components/CreateUserModal'
import supabase from '../../../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { CheckCircle2, Ban, Skull } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function Overview({ userRole }) {
  // const [showModal, setShowModal] = useState(false);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [deceasedCount, setDeceasedCount] = useState(0);
  const [blacklistCount, setBlacklistCount] = useState(0);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [userSlots, setUserSlots] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchTotalProfiles = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      if (!error && typeof count === 'number') {
        setTotalProfiles(count);
      }
    };
    const fetchTotalGroups = async () => {
      const { count, error } = await supabase
        .from('groups')
        .select('id', { count: 'exact', head: true });
      if (!error && typeof count === 'number') {
        setTotalGroups(count);
      }
    };
    const fetchTotalAccounts = async () => {
      const { count, error } = await supabase
        .from('accounts')
        .select('id', { count: 'exact', head: true });
      if (!error && typeof count === 'number') {
        setTotalAccounts(count);
      }
    };
    const fetchStatusCounts = async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('status');
      if (!error && Array.isArray(data)) {
        let active = 0, inactive = 0, deceased = 0, blacklist = 0;
        data.forEach(({ status }) => {
          if (status === 'active') active++;
          else if (status === 'inactive') inactive++;
          else if (status === 'deceased') deceased++;
          else if (status === 'blacklist') blacklist++;
        });
        setActiveCount(active);
        setInactiveCount(inactive);
        setDeceasedCount(deceased);
        setBlacklistCount(blacklist);
      }
    };
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone_number, email, address, date_of_birth, nin'); // ✅ one string

      if (!error && Array.isArray(data)) {
        setProfiles(data);
      }
    };

    fetchTotalProfiles();
    fetchTotalGroups();
    fetchTotalAccounts();
    fetchStatusCounts();
    fetchProfiles();
  }, []);

  const handleRowClick = async (profile) => {
    setSelectedProfile(profile);
    console.log('Selected Profile:', profile);
    console.log('Profile user_id:', profile.id);
    if (!profile.id) {
      setUserGroups([]);
      setUserSlots([]);
      setDialogOpen(true);
      return;
    }
    // Fetch group memberships for this user
    const { data: memberships, error: memberError } = await supabase
      .from('group_members')
      .select('group_id, slot_number')
      .eq('user_id', profile.id);
    let groups = [];
    let slots = [];
    console.log('Memberships:', memberships);
    if (!memberError && Array.isArray(memberships) && memberships.length > 0) {
      slots = memberships.map(m => m.slot_number);
      // Fetch group details for each group_id
      const groupIds = memberships.map(m => m.group_id);
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('name, pool_amount, duration_type, start_date, end_date, max_slots')
        .in('id', groupIds);
      if (!groupError && Array.isArray(groupData)) {
        groups = groupData;
      }
    }
    setUserGroups(groups);
    setUserSlots(slots);
    setDialogOpen(true);
  };

  // const handleCreateUser = () => {
  //   setShowModal(true);
  // }

  return (
    <div className="">
      {/* Admin Stats Cards Row */}
      <div className="flex gap-6 mb-8 w-full">
        <Card className="w-full transition-transform duration-150 hover:scale-[1.03] hover:shadow-lg">
          <CardHeader className="flex items-center gap-4">
            <div className="bg-primary/10 rounded-full p-3">
              <Users size={32} className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">{totalProfiles}</CardTitle>
              <CardDescription>Total Users</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="w-full transition-transform duration-150 hover:scale-[1.03] hover:shadow-lg">
          <CardHeader className="flex items-center gap-4">
            <div className="bg-green-500/10 rounded-full p-3">
              <User size={32} className="text-green-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">{totalGroups}</CardTitle>
              <CardDescription>Total Groups</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="w-full transition-transform duration-150 hover:scale-[1.03] hover:shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Group size={32} className="text-blue-600" />
              <CardTitle className="text-2xl font-bold">{totalAccounts}</CardTitle>
            </div>
            <CardDescription>Total Accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className='flex flex-row gap-4 mb-2'>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-green-600" />
                    <span className="font-medium text-xs">Active:</span>
                    <span className='text-xs font-medium'>{activeCount}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-xs">
                    <Ban size={15} className="text-yellow-600" />
                    <span>Inactive:</span>
                    <span>{inactiveCount}</span>
                  </div>
              </div>
              <div className='flex flex-row gap-4 mb-2'>
                  <div className="flex items-center gap-2 font-medium text-xs">
                    <Ban size={15} className="text-yellow-600" />
                    <span>Blacklist:</span>
                    <span>{blacklistCount}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-xs">
                    <Skull size={15} className="text-red-600" />
                    <span>Deceased:</span>
                    <span>{deceasedCount}</span>
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Overview
      <p className='text-[15px] font-light'>Role: {userRole}</p> */}
      {/* <div className='mt-4'>
        <h2 className='text-xl font-semibold'>Welcome to the Overview Page</h2>
        <p className='text-3xl text-black'>This section provides a summary of your account and activities.</p>
      </div>
      <Button className='mt-4' variant='secondary' onClick={handleCreateUser}>
        <User className='mr-2'/>
        Create New User
      </Button>
      <CreateUserModal open={showModal} onClose={() => setShowModal(false)} /> */}

      {/* User Profiles Table */}
      <div className="mt-4 bg-transparent">
        <h3 className="text-2xl font-semibold mb-2">All Users</h3>
        <Table className="w-full text-sm border rounded-lg overflow-hidden">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>DOB</TableHead>
              <TableHead>NIN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile, idx) => (
              <TableRow key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} onClick={() => handleRowClick(profile)} style={{ cursor: 'pointer' }}>
                <TableCell>{profile.first_name}</TableCell>
                <TableCell>{profile.last_name}</TableCell>
                <TableCell>{profile.phone_number}</TableCell>
                <TableCell>{profile.email}</TableCell>
                <TableCell>{profile.address}</TableCell>
                <TableCell>{profile.date_of_birth}</TableCell>
                <TableCell>{profile.nin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* User Groups & Slots Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Groups & Slots</DialogTitle>
            {/* Use a fragment instead of DialogDescription for custom content to avoid <div> inside <p> */}
            {selectedProfile && (
              <div>
                <div className="mb-2 font-semibold">{selectedProfile.first_name} {selectedProfile.last_name}</div>
                <div className="mb-2 text-sm">NIN: {selectedProfile.nin}</div>
                <div className="mb-2 text-sm">Phone: {selectedProfile.phone_number}</div>
                <div className="mb-2 text-sm">Email: {selectedProfile.email}</div>
                <div className="mb-2 text-sm">Address: {selectedProfile.address}</div>
                <div className="mb-2 text-sm">Date of Birth: {selectedProfile.date_of_birth}</div>
                <div className="mt-4">
                  <div className="font-semibold mb-1">Groups:</div>
                  {userGroups.length > 0 ? (
                    <ul className="list-disc ml-4">
                      {userGroups.map((group, idx) => (
                        <li key={idx}>
                          <span className="font-medium">{group.name}</span> (Pool: {group.pool_amount}, Duration: {group.duration_type}, Start: {group.start_date}, End: {group.end_date}, Max Slots: {group.max_slots})
                        </li>
                      ))}
                    </ul>
                  ) : <div className="text-sm">No groups found.</div>}
                </div>
                <div className="mt-4">
                  <div className="font-semibold mb-1">Slots:</div>
                  {userSlots.length > 0 ? (
                    <ul className="list-disc ml-4">
                      {userSlots.map((slot, idx) => (
                        <li key={idx}>Slot {slot}</li>
                      ))}
                    </ul>
                  ) : <div className="text-sm">No slots assigned.</div>}
                </div>
              </div>
            )}
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Overview