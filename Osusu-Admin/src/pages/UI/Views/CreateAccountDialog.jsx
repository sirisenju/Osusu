import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { toast } from 'sonner'
import supabase from '@/lib/supabase'

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
        <button onClick={() => setOpen(true)} className="w-full text-left px-4 py-2 hover:bg-gray-100">Create Account</button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Create Account for {user.first_name} {user.last_name}</DialogTitle>
          <DialogClose asChild>
            <button onClick={() => setOpen(false)} className="absolute top-2 right-2 text-gray-500 hover:text-black">&times;</button>
          </DialogClose>
        </DialogHeader>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
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
            <Input value={status} onChange={e => setStatus(e.target.value)} required placeholder="Status (e.g. active)" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Create Account'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
