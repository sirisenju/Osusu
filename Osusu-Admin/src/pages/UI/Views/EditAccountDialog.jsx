/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import supabase from '@/lib/supabase'
import { Label } from '@/components/ui/label'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'blacklist', label: 'Blacklist' },
  { value: 'deceased', label: 'Deceased' },
]

export default function EditAccountDialog({ user, onClose, onAccountUpdated }) {
  const [open, setOpen] = useState(true)
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('active')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankName, setBankName] = useState('')

  useEffect(() => {
    const fetchAccount = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (!error && data) {
        setAccount(data)
        setAccountNumber(data.account_number)
        setBankName(data.bank_name)
        setStatus(data.status)
      }
      setLoading(false)
    }
    if (user) fetchAccount()
  }, [user])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: updateError } = await supabase
      .from('accounts')
      .update({
        account_number: accountNumber,
        bank_name: bankName,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
    if (updateError) {
      setError('Account update failed: ' + updateError.message)
      toast.error('Account update failed: ' + updateError.message)
      setLoading(false)
      return
    }
    toast.success('Account updated successfully!')
    setOpen(false)
    setLoading(false)
    if (onAccountUpdated) onAccountUpdated()
    if (onClose) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Edit Account for {user.first_name} {user.last_name}
          </DialogTitle>
          <DialogClose asChild>
            <button 
              onClick={() => { setOpen(false); if (onClose) onClose(); }} 
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
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading account...</span>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="mb-2 font-medium text-sm">Account Number</label>
              <Input 
                value={accountNumber} 
                onChange={e => setAccountNumber(e.target.value)} 
                required 
                placeholder="Enter account number"
                className="w-full" 
              />
            </div>
            
            <div>
              <label className="mb-2 font-medium text-sm">Bank Name</label>
              <Input 
                value={bankName} 
                onChange={e => setBankName(e.target.value)} 
                required 
                placeholder="Enter bank name"
                className="w-full" 
              />
            </div>
            
            <div>
              <label className="mb-3 font-medium text-sm">Account Status</label>
              <RadioGroup 
                value={status} 
                onValueChange={setStatus} 
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {STATUS_OPTIONS.map(opt => (
                  <div key={opt.value} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50">
                    <RadioGroupItem value={opt.value} id={opt.value} />
                    <Label 
                      htmlFor={opt.value} 
                      className="cursor-pointer flex-1 text-sm"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Account'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
