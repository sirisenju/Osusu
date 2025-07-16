import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mail, Lock, User, Phone, Image as LucideImage, Calendar, Landmark, MapPin, FileText } from 'lucide-react'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { toast } from 'sonner'
import supabase from '@/lib/supabase'

export default function UserCreateDialog({ onUserCreated }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Page 1 state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userId, setUserId] = useState(null)
  // Page 2 state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [alternatePhone, setAlternatePhone] = useState('')
  const [address, setAddress] = useState('')
  const [notableLandmark, setNotableLandmark] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [nin, setNin] = useState('')
  const [passport, setPassport] = useState(null)

  const clearFields = () => {
    setEmail('')
    setPassword('')
    setUserId(null)
    setFirstName('')
    setLastName('')
    setPhoneNumber('')
    setAlternatePhone('')
    setAddress('')
    setNotableLandmark('')
    setDateOfBirth('')
    setNin('')
    setPassport(null)
    setStep(1)
  }

 const handleSignup = async (e) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        email,
        password
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Something went wrong')
    }
    // Optional: store new user ID
    setUserId(result.user.id)
    setStep(2)
    toast.success('User created successfully!')
  } catch (err) {
    setError(err.message)
    toast.error(err.message)
  } finally {
    setLoading(false)
  }
}


  const handleProfile = async (e) => {
    e.preventDefault()
    setError('')
    // Validation
    if (!firstName || !lastName || !phoneNumber || !address || !notableLandmark || !dateOfBirth || !nin || !passport) {
      toast.error('All fields except alternate phone number are required.')
      setError('All fields except alternate phone number are required.')
      return
    }
    if (!/^[0-9]{11}$/.test(nin)) {
      toast.error('NIN must be exactly 11 digits.')
      setError('NIN must be exactly 11 digits.')
      return
    }
    setLoading(true)
    let uploadedUrl = ''
    if (passport) {
      const fileExt = passport.name.split('.').pop()
      const fileName = `${userId}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('profile-passports')
        .upload(fileName, passport)
      if (uploadError) {
        setError('Passport upload failed: ' + uploadError.message)
        toast.error('Passport upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }
      uploadedUrl = supabase.storage.from('profile-passports').getPublicUrl(fileName).data.publicUrl
    }
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: userId,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        alternate_phone_number: alternatePhone,
        email,
        address,
        notable_landmark: notableLandmark,
        date_of_birth: dateOfBirth,
        nin,
        passport_url: uploadedUrl,
      },
    ])
    if (profileError) {
      setError('Profile creation failed: ' + profileError.message)
      toast.error('Profile creation failed: ' + profileError.message)
      setLoading(false)
      return
    }
    toast.success('User created successfully!')
    clearFields()
    setOpen(false)
    setLoading(false)
    if (onUserCreated) onUserCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)} className="mb-6">Create User</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><User size={24} /> Create User</DialogTitle>
          <DialogClose asChild>
            <button onClick={() => { setOpen(false); clearFields(); }} className="absolute top-2 right-2 text-gray-500 hover:text-black">&times;</button>
          </DialogClose>
        </DialogHeader>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {step === 1 && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="mb-1 font-medium flex items-center gap-2"><Mail size={16}/> Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email" />
            </div>
            <div>
              <label className="mb-1 font-medium flex items-center gap-2"><Lock size={16}/> Password</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing up...' : 'Next'}</Button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleProfile} className="space-y-4">
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="mb-1 font-medium flex items-center gap-2"><User size={16}/> First Name</label>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="First Name" />
              </div>
              <div className="w-1/2">
                <label className="mb-1 font-medium flex items-center gap-2"><User size={16}/> Last Name</label>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Last Name" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="mb-1 font-medium flex items-center gap-2"><Phone size={16}/> Phone Number</label>
                <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required placeholder="Phone Number" />
              </div>
              <div className="w-1/2">
                <label className="mb-1 font-medium flex items-center gap-2"><Phone size={16}/> Alternate Phone</label>
                <Input value={alternatePhone} onChange={e => setAlternatePhone(e.target.value)} placeholder="Alternate Phone" />
              </div>
            </div>
            <div>
              <label className="mb-1 font-medium flex items-center gap-2"><MapPin size={16}/> Address</label>
              <Input value={address} onChange={e => setAddress(e.target.value)} required placeholder="Address" />
            </div>
            <div>
              <label className="mb-1 font-medium flex items-center gap-2"><Landmark size={16}/> Notable Landmark</label>
              <Input value={notableLandmark} onChange={e => setNotableLandmark(e.target.value)} placeholder="Landmark" />
            </div>
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="mb-1 font-medium flex items-center gap-2"><Calendar size={16}/> Date of Birth</label>
                <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required />
              </div>
              <div className="w-1/2">
                <label className="mb-1 font-medium flex items-center gap-2"><FileText size={16}/> NIN</label>
                <Input value={nin} onChange={e => setNin(e.target.value)} placeholder="NIN" />
              </div>
            </div>
            <div>
              <label className="mb-1 font-medium flex items-center gap-2"><LucideImage size={16}/> Passport Photo</label>
              <Input type="file" accept="image/*" onChange={e => setPassport(e.target.files[0])} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Create User'}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
