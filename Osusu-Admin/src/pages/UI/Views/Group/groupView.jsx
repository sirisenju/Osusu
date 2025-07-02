import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import supabase from '@/lib/supabase'
import { toast } from 'sonner'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ChevronsUpDown, Check } from 'lucide-react'
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
  const [groupPopoverOpen, setGroupPopoverOpen] = useState(false);

  // Fetch groups from Supabase
  React.useEffect(() => {
    const fetchGroups = async () => {
      const { data, error } = await supabase.from('groups').select('*').order('created_at', { ascending: false })
      if (!error && data) setGroups(data)
    }
    fetchGroups()
  }, [open]) // refetch when dialog closes (after create)

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
            <Button variant="outline" className="w-full" onClick={() => setSheetOpen(true)}>Add a user to group</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add a user to group</SheetTitle>
              <SheetDescription>
                Select a group and user to add them to the group.
              </SheetDescription>
            </SheetHeader>
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
                                setSelectedGroupId(currentValue === selectedGroupId ? "" : currentValue)
                                setGroupPopoverOpen(false)
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
              </div>
              <div className="grid gap-3">
                <Label htmlFor="sheet-user">User</Label>
                <Input id="sheet-user" placeholder="User name or select..." />
              </div>
            </div>
            <SheetFooter>
              <Button type="submit">Add User</Button>
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </SheetFooter>
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
              <TableRow key={group.id}>
                <TableCell>{group.name}</TableCell>
                <TableCell>&#8358;{formatAmount(group.pool_amount)}</TableCell>
                <TableCell className="capitalize">{group.duration_type}</TableCell>
                <TableCell>{group.start_date}</TableCell>
                <TableCell>{group.end_date}</TableCell>
                <TableCell>{group.max_slots}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}

export default GroupView