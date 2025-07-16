/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import supabase from '../lib/supabase';
import { User, Phone, Mail, MapPin, Landmark, Calendar, IdCard, Image as ImageIcon, UploadCloud } from 'lucide-react';

function CreateUserModal({ open, onClose }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form1, setForm1] = useState({ email: '', password: '' });
  const [form2, setForm2] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    landmark: '',
    dob: '',
    nin: '',
    passport: '',
  });
  const [userId, setUserId] = useState(null);
  const [alert, setAlert] = useState(null);
  const [passportFile, setPassportFile] = useState(null);

  const handleNext = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    const { data, error } = await supabase.auth.signUp({
      email: form1.email,
      password: form1.password,
      email_confirm: true,
      // Automatically confirm email
    });
    setLoading(false);
    if (error) {
      setAlert({ type: 'error', message: error.message });
      return;
    }
    setUserId(data.user.id);
    setForm2(f => ({ ...f, email: form1.email }));
    setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleChange1 = (e) => setForm1({ ...form1, [e.target.name]: e.target.value });
  const handleChange2 = (e) => {
    const { name, value } = e.target;
    if (name === 'nin') {
      // Only allow up to 11 digits
      if (!/^\d{0,11}$/.test(value)) return;
    }
    setForm2({ ...form2, [name]: value });
  };

  const handleFileChange = (e) => {
    setPassportFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    if (form2.nin.length !== 11) {
      setLoading(false);
      setAlert({ type: 'error', message: 'NIN must be exactly 11 digits.' });
      return;
    }
    let passportUrl = '';
    if (passportFile) {
      const fileExt = passportFile.name.split('.').pop();
      const filePath = `${userId}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('profile-passports').upload(filePath, passportFile);
      if (uploadError) {
        setLoading(false);
        setAlert({ type: 'error', message: uploadError.message });
        return;
      }
      passportUrl = supabase.storage.from('profile-passports').getPublicUrl(filePath).data.publicUrl;
    }
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      first_name: form2.firstName,
      last_name: form2.lastName,
      phone_number: form2.phone,
      alternate_phone_number: form2.altPhone,
      email: form2.email,
      address: form2.address,
      notable_landmark: form2.landmark,
      date_of_birth: form2.dob,
      nin: form2.nin,
      passport_url: passportUrl,
    });
    setLoading(false);
    if (error) {
      setAlert({ type: 'error', message: error.message });
      return;
    }
    setAlert({ type: 'success', message: 'User created successfully!' });
    setTimeout(() => {
      onClose();
      setStep(1);
      setForm1({ email: '', password: '' });
      setForm2({
        firstName: '', lastName: '', phone: '', altPhone: '', email: '', address: '', landmark: '', dob: '', nin: '', passport: '',
      });
      setUserId(null);
      setAlert(null);
      setPassportFile(null);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User ({step} of 2)</DialogTitle>
        </DialogHeader>
        {alert && (
          <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-4">
            <AlertTitle>{alert.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}
        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail size={18} />
              <Input
                label="Email"
                name="email"
                type="email"
                value={form1.email}
                onChange={handleChange1}
                required
                placeholder="Enter email"
              />
            </div>
            <div className="flex items-center gap-2">
              <IdCard size={18} />
              <Input
                label="Password"
                name="password"
                type="password"
                value={form1.password}
                onChange={handleChange1}
                required
                placeholder="Enter password"
              />
            </div>
            <div className="mt-6">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Loading...' : 'Next'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2"><User size={18} />
              <Input label="First Name" name="firstName" value={form2.firstName} onChange={handleChange2} required placeholder="Enter first name" />
            </div>
            <div className="flex items-center gap-2"><User size={18} />
              <Input label="Last Name" name="lastName" value={form2.lastName} onChange={handleChange2} required placeholder="Enter last name" />
            </div>
            <div className="flex items-center gap-2"><Phone size={18} />
              <Input label="Phone" name="phone" value={form2.phone} onChange={handleChange2} required placeholder="Enter phone number" />
            </div>
            <div className="flex items-center gap-2"><Phone size={18} />
              <Input label="Alt. Phone" name="altPhone" value={form2.altPhone} onChange={handleChange2} placeholder="Enter alternate phone number" />
            </div>
            <div className="flex items-center gap-2"><Mail size={18} />
              <Input label="Email" name="email" value={form2.email} onChange={handleChange2} required placeholder="Enter email" />
            </div>
            <div className="flex items-center gap-2"><MapPin size={18} />
              <Input label="Address" name="address" value={form2.address} onChange={handleChange2} placeholder="Enter address" />
            </div>
            <div className="flex items-center gap-2"><Landmark size={18} />
              <Input label="Landmark" name="landmark" value={form2.landmark} onChange={handleChange2} placeholder="Notable landmark" />
            </div>
            <div className="flex items-center gap-2"><Calendar size={18} />
              <Input label="Date of Birth" name="dob" type="date" value={form2.dob} onChange={handleChange2} placeholder="YYYY-MM-DD" />
            </div>
            <div className="flex items-center gap-2"><IdCard size={18} />
              <Input label="NIN" name="nin" value={form2.nin} onChange={handleChange2} placeholder="NIN" maxLength={11} minLength={11} required />
            </div>
            <div className="flex items-center gap-2"><ImageIcon size={18} />
              <label className="flex items-center gap-2 cursor-pointer">
                <UploadCloud size={18} />
                <span>Passport (image)</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              {passportFile && <span className="text-xs text-green-700">{passportFile.name}</span>}
            </div>
            <div className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CreateUserModal;
