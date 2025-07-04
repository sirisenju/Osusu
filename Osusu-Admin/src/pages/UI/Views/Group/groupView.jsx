import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import supabase from '@/lib/supabase'
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from "@/components/ui/badge";

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
  const [popoverGroupId, setPopoverGroupId] = useState(null);

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

  const handleRowClick = async (group, event) => {
    setPopoverGroupId(group.id);
    // Only fetch if not already fetched
    if (!groupMembersMap[group.id]) {
      const { data, error } = await supabase
        .from("group_members")
        .select(`
          slot_number,
          payment_verified,
          profiles:user_id (
            first_name,
            last_name,
            email,
            phone_number
          )
        `)
        .eq("group_id", group.id)
        .order("slot_number", { ascending: true });
        console.log("Fetching group members for:", group.id);
      if (!error && data) {
        setGroupMembersMap(prev => ({ ...prev, [group.id]: data }));
      }
    }

    console.log("Group clicked:", group);
  };

  return (
    <div className="mt-10">
      <div className="flex gap-2 mb-6 w-[50%]">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)} className="w-full">Create Group</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Create Group</DialogTitle>
              <DialogClose asChild>
                <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-gray-500 hover:text-black">&times;</button>
              </DialogClose>
            </DialogHeader>
            {error && <div className="mb-4 text-red-500">{error}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 font-medium">Group Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Group Name" />
              </div>
              <div>
                <label className="mb-1 font-medium">Pool Amount</label>
                <Input type="number" value={poolAmount} onChange={e => setPoolAmount(e.target.value)} required placeholder="Pool Amount" />
              </div>
              <div>
                <label className="mb-1 font-medium">Duration Type</label>
                <Select value={durationType} onValueChange={setDurationType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 font-medium">Start Date</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 font-medium">End Date</label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 font-medium">Max Slots</label>
                <Input type="number" value={maxSlots} onChange={e => setMaxSlots(e.target.value)} required placeholder="Max Slots" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Create Group'}</Button>
            </form>
          </DialogContent>
        </Dialog>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full" onClick={() => setSheetOpen(true)}>
              Add a user to group
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add a user to group</SheetTitle>
              <SheetDescription>
                Select a group and user to add them to the group.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleAddUser}>
              <div className="grid flex-1 auto-rows-min gap-6 px-4">
                <div className="grid gap-3">
                  <Label htmlFor="sheet-group">Group</Label>
                  <Popover open={groupPopoverOpen} onOpenChange={setGroupPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={groupPopoverOpen}
                        className="w-full justify-between"
                      >
                        {selectedGroupId
                          ? groups.find((g) => g.id === selectedGroupId)?.name
                          : "Select group..."}
                        <ChevronsUpDown className="opacity-50 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                      <Command>
                        <CommandInput placeholder="Search group..." className="h-9" />
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
                              >
                                {group.name}
                                <Check
                                  className={cn(
                                    "ml-auto",
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
                    <div className="text-xs text-muted-foreground mt-1">
                      Slots: {membersCount} / {groupMaxSlots}
                    </div>
                  )}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="sheet-user">User</Label>
                  <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userPopoverOpen}
                        className="w-full justify-between"
                      >
                        {selectedUserId
                          ? (() => {
                              const user = users.find((u) => u.id === selectedUserId);
                              return user
                                ? `${user.first_name} ${user.last_name} (${user.email})`
                                : "Select user...";
                            })()
                          : "Select user..."}
                        <ChevronsUpDown className="opacity-50 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search user..." className="h-9" />
                        <CommandList>
                          {users.length === 0 ? (
                            <CommandEmpty>No user found.</CommandEmpty>
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
                                  {user.first_name} {user.last_name} ({user.email})
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      selectedUserId === user.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="manual-slot">Slot Number (optional)</Label>
                  <Input
                    id="manual-slot"
                    type="number"
                    min={1}
                    max={groupMaxSlots || 1}
                    value={manualSlot}
                    onChange={e => setManualSlot(e.target.value)}
                    placeholder={`1 - ${groupMaxSlots || 1}`}
                    disabled={!selectedGroupId}
                  />
                  <div className="text-xs text-muted-foreground">
                    Leave blank to auto-assign next available slot.
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label>Payment Status</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment_verified"
                        value="paid"
                        checked={paymentVerified === "paid"}
                        onChange={() => setPaymentVerified("paid")}
                      />
                      Paid
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment_verified"
                        value="unpaid"
                        checked={paymentVerified === "unpaid"}
                        onChange={() => setPaymentVerified("unpaid")}
                      />
                      Unpaid
                    </label>
                  </div>
                </div>
              </div>
              {addError && <div className="text-red-500 text-sm px-4 mt-2">{addError}</div>}
              <SheetFooter>
                <Button
                  type="submit"
                  disabled={
                    addLoading ||
                    !selectedGroupId ||
                    !selectedUserId ||
                    membersCount >= groupMaxSlots
                  }
                >
                  {addLoading ? "Adding..." : "Add User"}
                </Button>
                <SheetClose asChild>
                  <Button variant="outline">Close</Button>
                </SheetClose>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className='w-full p-4'>
        <h2 className="text-2xl font-bold mb-6">Groups</h2>
        <p className="text-gray-600 mb-4">Manage your groups here. You can create new groups and view existing ones.</p>
        <Table className="mt-8 bg-white">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Pool Amount</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Slots</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>No groups found.</TableCell>
            </TableRow>
          ) : (
            groups.map(group => (
              <Popover
                key={group.id}
                open={popoverGroupId === group.id}
                onOpenChange={open => setPopoverGroupId(open ? group.id : null)}
              >
                <PopoverTrigger asChild>
                  <TableRow
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={e => handleRowClick(group, e)}
                  >
                    <TableCell>{group.name}</TableCell>
                    <TableCell>&#8358;{formatAmount(group.pool_amount)}</TableCell>
                    <TableCell className="capitalize">{group.duration_type}</TableCell>
                    <TableCell>{group.start_date}</TableCell>
                    <TableCell>{group.end_date}</TableCell>
                    <TableCell>
                      {groupMemberCounts[group.id] !== undefined
                        ? (
                            <>
                              {groupMemberCounts[group.id]}/{group.max_slots}
                              {groupMemberCounts[group.id] >= group.max_slots && (
                                <Badge variant="destructive" className="ml-2">Full</Badge>
                              )}
                            </>
                          )
                        : `0/${group.max_slots}`}
                    </TableCell>
                  </TableRow>
                </PopoverTrigger>
                <PopoverContent side="center" align="start" className="w-[400px]">
                  <div className="mb-2 font-bold text-lg">{group.name} - Members</div>
                  {(groupMembersMap[group.id]?.length ?? 0) === 0 ? (
                    <div className="text-muted-foreground">No members yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {groupMembersMap[group.id]?.map((member, idx) => (
                        <div key={idx} className="border-b pb-2 mb-2">
                          <div className="font-medium">
                            {member.profiles?.first_name} {member.profiles?.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Email: {member.profiles?.email || "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Phone: {member.profiles?.phone || "N/A"}
                          </div>
                          <div className="text-xs">
                            Slot: <span className="font-semibold">{member.slot_number}</span>
                            <Badge
                              variant={member.payment_verified ? "default" : "outline"}
                              className="ml-2"
                            >
                              {member.payment_verified ? "Paid" : "Unpaid"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}

export default GroupView