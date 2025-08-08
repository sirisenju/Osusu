import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mail, Lock, User, Phone, Image as LucideImage, Calendar, Landmark, MapPin, FileText } from 'lucide-react'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { toast } from 'sonner'
import supabase from '@/lib/supabase'

export default function UserCreateDialog({ open, onUserCreated, onClose }) {
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
    setLoading(false)
    if (onUserCreated) onUserCreated()
    if (onClose) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose && onClose()}>
      <DialogContent className="max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <User size={20} /> Create User
          </DialogTitle>
          <DialogClose asChild>
            <button 
              onClick={() => { clearFields(); if (onClose) onClose(); }} 
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
        
        {/* Step 1: Authentication */}
        {step === 1 && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Step 1 of 2: User Authentication
            </div>
            
            <div>
              <label className="mb-2 font-medium text-sm flex items-center gap-2">
                <Mail size={16}/> Email Address
              </label>
              <Input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="Enter email address"
                className="w-full" 
              />
            </div>
            
            <div>
              <label className="mb-2 font-medium text-sm flex items-center gap-2">
                <Lock size={16}/> Password
              </label>
              <Input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="Enter password"
                className="w-full" 
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Next Step →'}
            </Button>
          </form>
        )}
        
        {/* Step 2: Profile Information */}
        {step === 2 && (
          <form onSubmit={handleProfile} className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Step 2 of 2: Profile Information
            </div>
            
            {/* Name Fields - Stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 font-medium text-sm flex items-center gap-2">
                  <User size={16}/> First Name
                </label>
                <Input 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  required 
                  placeholder="First Name"
                  className="w-full" 
                />
              </div>
              <div>
                <label className="mb-2 font-medium text-sm flex items-center gap-2">
                  <User size={16}/> Last Name
                </label>
                <Input 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  required 
                  placeholder="Last Name"
                  className="w-full" 
                />
              </div>
            </div>
            
            {/* Phone Fields - Stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 font-medium text-sm flex items-center gap-2">
                  <Phone size={16}/> Phone Number
                </label>
                <Input 
                  value={phoneNumber} 
                  onChange={e => setPhoneNumber(e.target.value)} 
                  required 
                  placeholder="Phone Number"
                  className="w-full" 
                />
              </div>
              <div>
                <label className="mb-2 font-medium text-sm flex items-center gap-2">
                  <Phone size={16}/> Alternate Phone
                </label>
                <Input 
                  value={alternatePhone} 
                  onChange={e => setAlternatePhone(e.target.value)} 
                  placeholder="Alternate Phone (Optional)"
                  className="w-full" 
                />
              </div>
            </div>
            
            {/* Address */}
            <div>
              <label className="mb-2 font-medium text-sm flex items-center gap-2">
                <MapPin size={16}/> Address
              </label>
              <Input 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                required 
                placeholder="Complete address"
                className="w-full" 
              />
            </div>
            
            {/* Landmark */}
            <div>
              <label className="mb-2 font-medium text-sm flex items-center gap-2">
                <Landmark size={16}/> Notable Landmark
              </label>
              <Input 
                value={notableLandmark} 
                onChange={e => setNotableLandmark(e.target.value)} 
                placeholder="Landmark near address"
                className="w-full" 
              />
            </div>
            
            {/* DOB and NIN - Stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-2 font-medium text-sm flex items-center gap-2">
                  <Calendar size={16}/> Date of Birth
                </label>
                <Input 
                  type="date" 
                  value={dateOfBirth} 
                  onChange={e => setDateOfBirth(e.target.value)} 
                  required
                  className="w-full" 
                />
              </div>
              <div>
                <label className="mb-2 font-medium text-sm flex items-center gap-2">
                  <FileText size={16}/> NIN
                </label>
                <Input 
                  value={nin} 
                  onChange={e => setNin(e.target.value)} 
                  placeholder="11-digit NIN"
                  className="w-full" 
                />
              </div>
            </div>
            
            {/* Passport Photo */}
            <div>
              <label className="mb-2 font-medium text-sm flex items-center gap-2">
                <LucideImage size={16}/> Passport Photo
              </label>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={e => setPassport(e.target.files[0])} 
                required
                className="w-full" 
              />
              <p className="text-xs text-gray-500 mt-1">Upload a clear passport photograph</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setStep(1)}
                className="w-full sm:w-auto"
              >
                ← Back
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:flex-1" 
                disabled={loading}
              >
                {loading ? 'Creating User...' : 'Create User'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
