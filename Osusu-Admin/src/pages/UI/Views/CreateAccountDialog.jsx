import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard, Landmark } from 'lucide-react'
import { toast } from 'sonner'
import supabase from '@/lib/supabase'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' }
]

export default function CreateAccountDialog({ user, onAccountCreated }) {
  const [open, setOpen] = useState(false)
  const [accountNumber, setAccountNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [status, setStatus] = useState('active')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!accountNumber || !bankName) {
      toast.error('All fields are required.')
      setError('All fields are required.')
      return
    }
    setLoading(true)
    const { error: insertError } = await supabase.from('accounts').insert([
      {
        user_id: user.id,
        account_number: accountNumber,
        bank_name: bankName,
        status,
        updated_at: new Date().toISOString(),
      },
    ])
    if (insertError) {
      setError('Account creation failed: ' + insertError.message)
      toast.error('Account creation failed: ' + insertError.message)
      setLoading(false)
      return
    }
    toast.success('Account created successfully!')
    setOpen(false)
    setAccountNumber('')
    setBankName('')
    setStatus('active')
    setLoading(false)
    if (onAccountCreated) onAccountCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button onClick={() => setOpen(true)} className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md">
          Create Account
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <CreditCard size={20} />
            Create Account for {user.first_name} {user.last_name}
          </DialogTitle>
          <DialogClose asChild>
            <button 
              onClick={() => setOpen(false)} 
              className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl leading-none"
            >
              &times;
            </button>
          </DialogClose>
        </DialogHeader>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-2 font-medium text-sm flex items-center gap-2">
              <CreditCard size={16} />
              Account Number
            </label>
            <Input 
              value={accountNumber} 
              onChange={e => setAccountNumber(e.target.value)} 
              required 
              placeholder="Enter account number"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="mb-2 font-medium text-sm flex items-center gap-2">
              <Landmark size={16} />
              Bank Name
            </label>
            <Input 
              value={bankName} 
              onChange={e => setBankName(e.target.value)} 
              required 
              placeholder="Enter bank name"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="mb-2 font-medium text-sm">Account Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
