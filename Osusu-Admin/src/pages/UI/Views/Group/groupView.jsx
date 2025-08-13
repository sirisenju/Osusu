import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from '@/components/ui/alert'
import supabase from '@/lib/supabase'
import { toast } from "sonner"
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { 
  ChevronsUpDown, 
  Check, 
  Plus, 
  Users, 
  Calendar,
  DollarSign,
  Settings,
  UserPlus,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
  Group
} from 'lucide-react'
import { cn } from '@/lib/utils'

function formatAmount(amount) {
  if (amount === undefined || amount === null) return ''
  return Number(amount).toLocaleString()
}

function GroupView() {
  const [name, setName] = useState('')
  const [poolAmount, setPoolAmount] = useState('')
  const [durationType, setDurationType] = useState('weekly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [maxSlots, setMaxSlots] = useState('')
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [groupPopoverOpen, setGroupPopoverOpen] = useState(false);
  const [membersCount, setMembersCount] = useState(0);
  const [groupMaxSlots, setGroupMaxSlots] = useState(0);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [manualSlot, setManualSlot] = useState("");
  const [paymentVerified, setPaymentVerified] = useState("unpaid");
  const [groupMemberCounts, setGroupMemberCounts] = useState({});
  const [groupMembersMap, setGroupMembersMap] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);

  // Fetch groups from Supabase
  React.useEffect(() => {
    const fetchGroups = async () => {
      const { data, error } = await supabase.from('groups').select('*').order('created_at', { ascending: false })
      if (!error && data) setGroups(data)
    }
    fetchGroups()
  }, [open]) // refetch when dialog closes (after create)

  // Fetch eligible users for the combobox
  useEffect(() => {
    if (!sheetOpen) return;
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email");
      if (!error && data) setUsers(data);
    };
    fetchUsers();
  }, [sheetOpen]);

  // Fetch group members count and max_slots when group changes
  useEffect(() => {
    if (!selectedGroupId) {
      setMembersCount(0);
      setGroupMaxSlots(0);
      return;
    }
    const fetchGroupInfo = async () => {
      // Get max_slots
      const group = groups.find((g) => g.id === selectedGroupId);
      setGroupMaxSlots(group?.max_slots || 0);

      // Get current members count
      const { count } = await supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", selectedGroupId);
      setMembersCount(count || 0);
    };
    fetchGroupInfo();
  }, [selectedGroupId, groups]);

  // Fetch members count for each group
  useEffect(() => {
    if (groups.length === 0) return;
    const fetchCounts = async () => {
      const counts = {};
      for (const group of groups) {
        const { count } = await supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", group.id);
        counts[group.id] = count || 0;
      }
      setGroupMemberCounts(counts);
    };
    fetchCounts();
  }, [groups]);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name || !poolAmount || !durationType || !startDate || !endDate || !maxSlots) {
      setError('All fields are required.')
      toast.error('All fields are required.')
      return
    }
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    if (durationType === 'monthly' && diffDays < 29) {
      setError('For monthly, the duration must be at least 29 days.')
      toast.error('For monthly, the duration must be at least 29 days.')
      return
    }
    if (durationType === 'weekly' && (diffDays < 7 || diffDays > 7)) {
      setError('For weekly, the duration must be exactly 7 days.')
      toast.error('For weekly, the duration must be exactly 7 days.')
      return
    }
    setLoading(true)
    const { error: insertError } = await supabase.from('groups').insert([
      {
        name,
        pool_amount: poolAmount,
        duration_type: durationType,
        start_date: startDate,
        end_date: endDate,
        max_slots: maxSlots,
      },
    ])
    setLoading(false)
    if (insertError) {
      setError('Group creation failed: ' + insertError.message)
      toast.error('Group creation failed: ' + insertError.message)
      return
    }
    setOpen(false)
    setName('')
    setPoolAmount('')
    setDurationType('weekly')
    setStartDate('')
    setEndDate('')
    setMaxSlots('')
    setError('')
    toast.success('Group created successfully!')
  }

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddError("");
    if (!selectedGroupId || !selectedUserId) {
      setAddError("Please select both group and user.");
      toast.error("Please select both group and user.");
      return;
    }
    setAddLoading(true);

    // Fetch all assigned slot numbers for this group
    const { data: slotsData, error: slotsError } = await supabase
      .from("group_members")
      .select("slot_number, user_id")
      .eq("group_id", selectedGroupId);

    if (slotsError) {
      setAddLoading(false);
      setAddError("Failed to fetch slot numbers.");
      toast.error("Failed to fetch slot numbers.");
      return;
    }

    // Check group capacity
    if ((slotsData?.length || 0) >= groupMaxSlots) {
      setAddLoading(false);
      setAddError("Group is full. No available slots.");
      toast.error("Group is full. No available slots.");
      return;
    }

    // Prepare assigned slots and check for uniqueness
    const assignedSlots = (slotsData || []).map(s => s.slot_number);

    let slotToAssign = manualSlot ? Number(manualSlot) : null;

    // Validate manual slot number if provided
    if (slotToAssign) {
      if (
        slotToAssign < 1 ||
        slotToAssign > groupMaxSlots ||
        assignedSlots.includes(slotToAssign)
      ) {
        setAddLoading(false);
        setAddError(
          slotToAssign < 1 || slotToAssign > groupMaxSlots
            ? `Slot number must be between 1 and ${groupMaxSlots}.`
            : `Slot number ${slotToAssign} is already assigned.`
        );
        toast.error(
          slotToAssign < 1 || slotToAssign > groupMaxSlots
            ? `Slot number must be between 1 and ${groupMaxSlots}.`
            : `Slot number ${slotToAssign} is already assigned.`
        );
        return;
      }
    } else {
      // Auto-assign next available slot if not manually set
      for (let i = 1; i <= groupMaxSlots; i++) {
        if (!assignedSlots.includes(i)) {
          slotToAssign = i;
          break;
        }
      }
      if (!slotToAssign) {
        setAddLoading(false);
        setAddError("Group is full. No available slots.");
        toast.error("Group is full. No available slots.");
        return;
      }
    }

    // Insert new slot for user (allowing multiple slots per user)
    const { error: insertError } = await supabase.from("group_members").insert([
      {
        group_id: selectedGroupId,
        user_id: selectedUserId,
        slot_number: slotToAssign,
        joined_at: new Date().toISOString(),
        payment_verified: paymentVerified === "paid",
        verified_at: null,
      },
    ]);
    setAddLoading(false);
    if (insertError) {
      setAddError("Failed to add user: " + insertError.message);
      toast.error("Failed to add user: " + insertError.message);
      return;
    }
    toast.success(`User added to group! Assigned slot: ${slotToAssign}`);
    setSelectedGroupId("");
    setSelectedUserId("");
    setManualSlot("");
    setPaymentVerified("unpaid");
    setMembersCount(0);
    setGroupMaxSlots(0);
    setUserPopoverOpen(false);
    setGroupPopoverOpen(false);
    setSheetOpen(false);
  };

  const handleRowClick = async (group) => {
    setSelectedGroup(group);
    setGroupDetailsOpen(true);
    // Only fetch if not already fetched
    if (!groupMembersMap[group.id]) {
      const { data, error } = await supabase
        .from("group_members")
        .select(`
          slot_number,
          payment_verified,
          profiles:group_members_user_id_fkey (
            first_name,
            last_name,
            email,
            phone_number
          )
        `)
        .eq("group_id", group.id)
        .order("slot_number", { ascending: true });
        console.log("Fetching group members for:", group.id);
        console.log("Fetched members:", data);
        console.log("Error:", error);
      if (!error && data) {
        setGroupMembersMap(prev => ({ ...prev, [group.id]: data }));
        console.log("Group members updated:", group.id, data);
      }
    }

    console.log("Group clicked:", group);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Group className="h-7 w-7 text-green-600" />
            Group Management
          </h1>
          <p className="text-gray-600 mt-1">Create and manage savings groups for your community</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Group className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground">
              Active savings circles
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(groupMemberCounts).reduce((sum, count) => sum + count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all groups
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pool Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{formatAmount(groups.reduce((sum, group) => sum + Number(group.pool_amount || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined pool amounts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Slots</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groups.reduce((sum, group) => sum + Number(group.max_slots || 0), 0) - 
               Object.values(groupMemberCounts).reduce((sum, count) => sum + count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Open positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Create new groups and manage memberships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Group
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md w-full mx-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create New Group
                  </DialogTitle>
                </DialogHeader>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Group Name</Label>
                    <Input 
                      id="name"
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                      placeholder="Enter group name" 
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="poolAmount" className="text-sm font-medium">Pool Amount (₦)</Label>
                    <Input 
                      id="poolAmount"
                      type="number" 
                      value={poolAmount} 
                      onChange={e => setPoolAmount(e.target.value)} 
                      required 
                      placeholder="Enter pool amount" 
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="durationType" className="text-sm font-medium">Duration Type</Label>
                    <Select value={durationType} onValueChange={setDurationType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Weekly
                          </div>
                        </SelectItem>
                        <SelectItem value="monthly">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Monthly
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
                      <Input 
                        id="startDate"
                        type="date" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)} 
                        required 
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-sm font-medium">End Date</Label>
                      <Input 
                        id="endDate"
                        type="date" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)} 
                        required 
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxSlots" className="text-sm font-medium">Maximum Slots</Label>
                    <Input 
                      id="maxSlots"
                      type="number" 
                      value={maxSlots} 
                      onChange={e => setMaxSlots(e.target.value)} 
                      required 
                      placeholder="Enter maximum slots" 
                      className="w-full"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Group
                      </div>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => setSheetOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Add User to Group
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Add User to Group
                  </SheetTitle>
                  <SheetDescription>
                    Select a group and user to add them to the savings circle.
                  </SheetDescription>
                </SheetHeader>
                
                <form onSubmit={handleAddUser} className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="sheet-group" className="text-sm font-medium">Select Group</Label>
                      <Popover open={groupPopoverOpen} onOpenChange={setGroupPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={groupPopoverOpen}
                            className="w-full justify-between h-10"
                          >
                            {selectedGroupId
                              ? groups.find((g) => g.id === selectedGroupId)?.name
                              : "Select group..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search groups..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>No group found.</CommandEmpty>
                              <CommandGroup>
                                {groups.map((group) => (
                                  <CommandItem
                                    key={group.id}
                                    value={group.id}
                                    onSelect={(currentValue) => {
                                      setSelectedGroupId(currentValue);
                                      setGroupPopoverOpen(false);
                                    }}
                                    className="flex items-center justify-between"
                                  >
                                    <div>
                                      <div className="font-medium">{group.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        ₦{formatAmount(group.pool_amount)} • {group.duration_type}
                                      </div>
                                    </div>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        selectedGroupId === group.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      {selectedGroupId && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border">
                          <Target className="h-4 w-4 text-blue-600" />
                          <div className="text-sm">
                            <span className="font-medium">Slots:</span> {membersCount} / {groupMaxSlots}
                            {membersCount >= groupMaxSlots && (
                              <Badge variant="destructive" className="ml-2">Full</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="sheet-user" className="text-sm font-medium">Select User</Label>
                      <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={userPopoverOpen}
                            className="w-full justify-between h-10"
                          >
                            {selectedUserId
                              ? (() => {
                                  const user = users.find((u) => u.id === selectedUserId);
                                  return user
                                    ? `${user.first_name} ${user.last_name}`
                                    : "Select user...";
                                })()
                              : "Select user..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search users..." className="h-9" />
                            <CommandList>
                              {users.length === 0 ? (
                                <CommandEmpty>No users found.</CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {users.map((user) => (
                                    <CommandItem
                                      key={user.id}
                                      value={user.id}
                                      onSelect={(currentValue) => {
                                        setSelectedUserId(currentValue);
                                        setUserPopoverOpen(false);
                                      }}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div>
                                          <div className="font-medium">
                                            {user.first_name} {user.last_name}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {user.email}
                                          </div>
                                        </div>
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            selectedUserId === user.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="manual-slot" className="text-sm font-medium">
                        Slot Number <span className="text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        id="manual-slot"
                        type="number"
                        min={1}
                        max={groupMaxSlots || 1}
                        value={manualSlot}
                        onChange={e => setManualSlot(e.target.value)}
                        placeholder={`1 - ${groupMaxSlots || 1}`}
                        disabled={!selectedGroupId}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank to auto-assign the next available slot.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Payment Status</Label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="payment_verified"
                            value="paid"
                            checked={paymentVerified === "paid"}
                            onChange={() => setPaymentVerified("paid")}
                            className="w-4 h-4 text-green-600"
                          />
                          <span className="text-sm flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Paid
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="payment_verified"
                            value="unpaid"
                            checked={paymentVerified === "unpaid"}
                            onChange={() => setPaymentVerified("unpaid")}
                            className="w-4 h-4 text-orange-600"
                          />
                          <span className="text-sm flex items-center gap-1">
                            <Clock className="h-4 w-4 text-orange-600" />
                            Unpaid
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {addError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{addError}</AlertDescription>
                    </Alert>
                  )}

                  <SheetFooter className="flex gap-2">
                    <SheetClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </SheetClose>
                    <Button
                      type="submit"
                      disabled={
                        addLoading ||
                        !selectedGroupId ||
                        !selectedUserId ||
                        membersCount >= groupMaxSlots
                      }
                      className="flex items-center gap-2"
                    >
                      {addLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Add User
                        </>
                      )}
                    </Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Groups Overview
          </CardTitle>
          <CardDescription>
            Click on any group to view its members and manage the savings circle
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-semibold">Group Name</TableHead>
                  <TableHead className="font-semibold">Pool Amount</TableHead>
                  <TableHead className="font-semibold">Duration</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Start Date</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">End Date</TableHead>
                  <TableHead className="font-semibold">Members</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Group className="h-12 w-12 opacity-50" />
                        <p className="text-lg font-medium">No groups found</p>
                        <p className="text-sm">Create your first savings group to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map(group => {
                    const memberCount = groupMemberCounts[group.id] || 0;
                    const maxSlots = group.max_slots || 0;
                    const isFull = memberCount >= maxSlots;
                    const fillPercentage = maxSlots > 0 ? (memberCount / maxSlots) * 100 : 0;
                    
                    return (
                      <TableRow
                        key={group.id}
                        className="cursor-pointer hover:bg-gray-50/50 transition-colors"
                        onClick={() => handleRowClick(group)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            {group.name}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ₦{formatAmount(group.pool_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            <Calendar className="h-3 w-3 mr-1" />
                            {group.duration_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-600">
                          {new Date(group.start_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-gray-600">
                          {new Date(group.end_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{memberCount}/{maxSlots}</span>
                            </div>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  fillPercentage === 100 ? 'bg-green-500' : 
                                  fillPercentage >= 75 ? 'bg-yellow-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isFull ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Full
                            </Badge>
                          ) : memberCount > 0 ? (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Open
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Group Details Sidebar */}
      <Sheet open={groupDetailsOpen} onOpenChange={setGroupDetailsOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[500px] p-0">
          {selectedGroup && (
            <>
              <SheetHeader className="p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Group className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-bold text-gray-900">
                      {selectedGroup.name}
                    </SheetTitle>
                    <SheetDescription className="text-gray-600 mt-1">
                      Group Details & Member Management
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto">
                {/* Group Stats */}
                <div className="p-6 border-b bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-600">Pool Amount</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        ₦{formatAmount(selectedGroup.pool_amount)}
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Duration</span>
                      </div>
                      <div className="text-lg font-bold text-blue-600 capitalize">
                        {selectedGroup.duration_type}
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-600">Members</span>
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        {groupMemberCounts[selectedGroup.id] || 0}/{selectedGroup.max_slots}
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-gray-600">Available</span>
                      </div>
                      <div className="text-lg font-bold text-orange-600">
                        {selectedGroup.max_slots - (groupMemberCounts[selectedGroup.id] || 0)} slots
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Group Timeline</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Start:</span> {new Date(selectedGroup.start_date).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">End:</span> {new Date(selectedGroup.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Members Section */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Group Members
                    </h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {groupMemberCounts[selectedGroup.id] || 0} members
                    </Badge>
                  </div>
                  
                  {(groupMembersMap[selectedGroup.id]?.length ?? 0) === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No members yet</h4>
                      <p className="text-gray-600 mb-4">This group is waiting for its first members to join</p>
                      <Button 
                        onClick={() => setSheetOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add First Member
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groupMembersMap[selectedGroup.id]?.map((member, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                  {member.profiles?.first_name?.[0]}{member.profiles?.last_name?.[0]}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {member.profiles?.first_name} {member.profiles?.last_name}
                                  </h4>
                                  <p className="text-sm text-gray-600">{member.profiles?.email || "No email"}</p>
                                </div>
                              </div>
                              
                              {member.profiles?.phone_number && (
                                <div className="text-xs text-gray-500 ml-13">
                                  📱 {member.profiles.phone_number}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <div className="text-xs font-medium text-gray-500 mb-1">Slot</div>
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="font-bold text-sm">{member.slot_number}</span>
                                </div>
                              </div>
                              
                              <Badge
                                variant={member.payment_verified ? "default" : "outline"}
                                className={`${
                                  member.payment_verified 
                                    ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" 
                                    : "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200"
                                }`}
                              >
                                {member.payment_verified ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Paid
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Unpaid
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="p-6 border-t bg-gray-50/50">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setSheetOpen(true)}
                    className="flex-1 flex items-center gap-2"
                    disabled={(groupMemberCounts[selectedGroup.id] || 0) >= selectedGroup.max_slots}
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Member
                  </Button>
                  <Button variant="outline" onClick={() => setGroupDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default GroupView