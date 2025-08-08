/* eslint-disable no-unused-vars */
import { Button } from '@/components/ui/button'
import { User, Users, Group, Calendar, Filter, TrendingUp } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import supabase from '../../../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { CheckCircle2, Ban, Skull } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

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
  
  // New state for chart and filters
  const [registrationData, setRegistrationData] = useState([]);
  const [timeFilter, setTimeFilter] = useState('30');
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [recentUsersCount, setRecentUsersCount] = useState(0);
  const [showAllUsers, setShowAllUsers] = useState(false);

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
        .select('id, first_name, last_name, phone_number, email, address, date_of_birth, nin, created_at'); // ✅ added created_at

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

  // New function to fetch registration data for chart
  const fetchRegistrationData = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .order('created_at', { ascending: true });

    if (!error && Array.isArray(data)) {
      // Group data by day for the last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const dailyData = {};
      
      // Initialize last 30 days with 0 registrations
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = {
          date: dateStr,
          registrations: 0,
          displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      }
      
      // Count actual registrations
      data.forEach(profile => {
        const createdDate = new Date(profile.created_at);
        if (createdDate >= thirtyDaysAgo) {
          const dateStr = createdDate.toISOString().split('T')[0];
          if (dailyData[dateStr]) {
            dailyData[dateStr].registrations++;
          }
        }
      });
      
      setRegistrationData(Object.values(dailyData));
    }
  };

  // Update filtered profiles when timeFilter or profiles change
  useEffect(() => {
    if (profiles.length > 0) {
      // Filter profiles based on time period
      const now = new Date();
      const daysAgo = parseInt(timeFilter);
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      const filtered = profiles.filter(profile => {
        if (!profile.created_at) return false;
        const createdDate = new Date(profile.created_at);
        return createdDate >= cutoffDate;
      });
      
      setFilteredProfiles(filtered);
      setRecentUsersCount(filtered.length);
      fetchRegistrationData();
    }
  }, [profiles, timeFilter]);

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
      <div className="flex gap-4 mb-6 w-full">
        <Card className="w-full transition-transform duration-150 hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex items-center gap-3 pb-3">
            <div className="bg-primary/10 rounded-full p-2">
              <Users size={24} className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{totalProfiles}</CardTitle>
              <CardDescription className="text-sm">Total Users</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="w-full transition-transform duration-150 hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex items-center gap-3 pb-3">
            <div className="bg-green-500/10 rounded-full p-2">
              <User size={24} className="text-green-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{totalGroups}</CardTitle>
              <CardDescription className="text-sm">Total Groups</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="w-full transition-transform duration-150 hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Group size={24} className="text-blue-600" />
              <CardTitle className="text-xl font-bold">{totalAccounts}</CardTitle>
            </div>
            <CardDescription className="text-sm">Total Accounts</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-1">
              <div className='flex flex-row gap-3 mb-1'>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-green-600" />
                    <span className="font-medium text-xs">Active:</span>
                    <span className='text-xs font-medium'>{activeCount}</span>
                  </div>
                  <div className="flex items-center gap-1 font-medium text-xs">
                    <Ban size={12} className="text-yellow-600" />
                    <span>Inactive:</span>
                    <span>{inactiveCount}</span>
                  </div>
              </div>
              <div className='flex flex-row gap-3 mb-1'>
                  <div className="flex items-center gap-1 font-medium text-xs">
                    <Ban size={12} className="text-yellow-600" />
                    <span>Blacklist:</span>
                    <span>{blacklistCount}</span>
                  </div>
                  <div className="flex items-center gap-1 font-medium text-xs">
                    <Skull size={12} className="text-red-600" />
                    <span>Deceased:</span>
                    <span>{deceasedCount}</span>
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Registration Chart and Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Registration Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                User Registration Trends (Last 30 Days)
              </CardTitle>
              <CardDescription className="text-sm">
                Daily user registrations over the past month
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={registrationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-md">
                            <p className="font-medium text-gray-900 text-sm">{label}</p>
                            <p className="text-base font-bold text-blue-600">
                              {payload[0].value} registrations
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="registrations" 
                    fill="#3b82f6"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Recent Users Card */}
        <div className="space-y-4">
          {/* Time Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-4 w-4 text-purple-600" />
                Filter Users
              </CardTitle>
              <CardDescription className="text-sm">
                View users by registration period
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Time Period
                  </label>
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="60">Last 60 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3 w-3 text-blue-600" />
                    <span className="font-medium text-blue-700 text-sm">Recent Users</span>
                  </div>
                  <p className="text-xl font-bold text-blue-900">{recentUsersCount}</p>
                  <p className="text-xs text-blue-600">
                    Joined in the last {timeFilter} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Profiles Table */}
      <div className="mt-3 bg-transparent">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-semibold">All Users</h3>
            <p className="text-gray-600 text-sm">
              Showing {showAllUsers ? profiles.length : filteredProfiles.length} users
              {!showAllUsers && ` from the last ${timeFilter} days`}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAllUsers(!showAllUsers)}
            className="flex items-center gap-2"
          >
            <Filter className="h-3 w-3" />
            {showAllUsers ? 'Show Recent' : 'Show All'}
          </Button>
        </div>
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
            {(showAllUsers ? profiles : filteredProfiles).map((profile, idx) => (
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