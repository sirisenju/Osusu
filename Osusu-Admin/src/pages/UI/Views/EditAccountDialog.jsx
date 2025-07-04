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
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Edit Account for {user.first_name} {user.last_name}</DialogTitle>
          <DialogClose asChild>
            <button onClick={() => { setOpen(false); if (onClose) onClose(); }} className="absolute top-2 right-2 text-gray-500 hover:text-black">&times;</button>
          </DialogClose>
        </DialogHeader>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="mb-1 font-medium">Account Number</label>
              <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} required placeholder="Account Number" />
            </div>
            <div>
              <label className="mb-1 font-medium">Bank Name</label>
              <Input value={bankName} onChange={e => setBankName(e.target.value)} required placeholder="Bank Name" />
            </div>
            <div>
              <label className="mb-1 font-medium">Status</label>
              <RadioGroup value={status} onValueChange={setStatus} className="flex flex-col gap-2">
                {STATUS_OPTIONS.map(opt => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={opt.value} />
                    <Label htmlFor={opt.value}>{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Update Account'}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
