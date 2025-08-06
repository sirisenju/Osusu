/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiLogOut, FiCreditCard, FiUsers, FiActivity, FiCheckCircle, FiXCircle, FiAlertCircle, FiHome, FiDollarSign, FiClock, FiUpload, FiImage, FiTrash2, FiEye } from 'react-icons/fi';
import supabase from '../lib/supabase';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeInOut' } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2, delayChildren: 0.2 } },
};

const GlassCard = ({ children, className }) => (
  <div className={`bg-light/50 backdrop-blur-xl border border-white/10 rounded-2xl ${className}`}>
    {children}
  </div>
);

const CTAButton = ({ children, className, ...props }) => (
  <motion.button
    className={`bg-gradient-to-r from-primary to-secondary text-white font-heading font-semibold px-7 py-3 rounded-full transition-transform duration-300 ${className}`}
    whileHover={{ scale: 1.05, y: -3, boxShadow: '0 10px 20px rgba(138, 43, 226, 0.3)' }}
    whileTap={{ scale: 0.95 }}
    {...props}
  >
    {children}
  </motion.button>
);

function UserDashBoard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [account, setAccount] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [userPayments, setUserPayments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedGroupMembership, setSelectedGroupMembership] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Helper function to determine payment status
  const getPaymentStatus = (approved, screenshot_url) => {
    if (approved === true && screenshot_url) {
      return { status: 'Paid', icon: '✅', color: 'text-green-500', bgColor: 'bg-green-500/20' };
    } else if (approved === false && screenshot_url) {
      return { status: 'Awaiting Approval', icon: '⏳', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' };
    } else if (approved === false && !screenshot_url) {
      return { status: 'Pending', icon: '🟡', color: 'text-orange-500', bgColor: 'bg-orange-500/20' };
    } else {
      return { status: 'Unknown', icon: '❓', color: 'text-gray-500', bgColor: 'bg-gray-500/20' };
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get current user from Supabase auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          navigate('/login');
          return;
        }

        setUser(user);

        // Fetch user profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          setError('Failed to load profile data');
        } else {
          setProfile(profileData);
          
          // Fetch user account from accounts table using profile id
          const { data: accountData, error: accountError } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', profileData.id)
            .limit(1);

          if (accountError) {
            console.warn('Account data not found:', accountError.message);
            // Don't set error here as account might not exist yet
          } else if (accountData && accountData.length > 0) {
            setAccount(accountData[0]); // Take the first account if multiple exist
          }

          // Fetch user's groups from group_members and groups tables
          const { data: groupMembersData, error: groupMembersError } = await supabase
            .from('group_members')
            .select(`
              *,
              groups (
                id,
                name,
                pool_amount,
                duration_type,
                start_date,
                end_date,
                max_slots,
                created_at
              )
            `)
            .eq('user_id', profileData.id);

          if (groupMembersError) {
            console.warn('Group members data not found:', groupMembersError.message);
            // Don't set error here as user might not be in any groups yet
          } else if (groupMembersData && groupMembersData.length > 0) {
            setUserGroups(groupMembersData);

            // Fetch user's payments for their group memberships
            const groupMemberIds = groupMembersData.map(gm => gm.id);
            const { data: paymentsData, error: paymentsError } = await supabase
              .from('payments')
              .select(`
                *,
                group_members (
                  slot_number,
                  groups (
                    name
                  )
                )
              `)
              .in('group_member_id', groupMemberIds)
              .order('paid_at', { ascending: false });

            if (!paymentsError && paymentsData) {
              setUserPayments(paymentsData);
            }
          }
        }
      } catch {
        setError('An error occurred while loading your profile');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, or WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      setError('');
    }
  };

  const handlePaymentUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !selectedGroupMembership || !paymentAmount) {
      setError('Please fill all required fields and select a screenshot');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Upload file to Supabase storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${profile.id}_${Date.now()}.${fileExt}`;
      const filePath = `payment-screenshots/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payments')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('payments')
        .getPublicUrl(filePath);

      // Insert payment record using the correct schema
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          group_member_id: selectedGroupMembership,
          amount: parseFloat(paymentAmount),
          screenshot_url: urlData.publicUrl,
          approved: false, // Default to false, admin will approve
          paid_at: new Date().toISOString(),
          due_date: new Date().toISOString().split('T')[0], // Today's date as due date
        });

      if (insertError) {
        throw insertError;
      }

      setUploadSuccess(true);
      setSelectedFile(null);
      setSelectedGroupMembership('');
      setPaymentAmount('');
      setPaymentDescription('');
      
      // Refetch payments to show the newly uploaded payment
      if (userGroups.length > 0) {
        const groupMemberIds = userGroups.map(gm => gm.id);
        const { data: paymentsData } = await supabase
          .from('payments')
          .select(`
            *,
            group_members (
              slot_number,
              groups (
                name
              )
            )
          `)
          .in('group_member_id', groupMemberIds)
          .order('paid_at', { ascending: false });

        if (paymentsData) {
          setUserPayments(paymentsData);
        }
      }
      
      // Reset form
      document.getElementById('payment-form').reset();
      
      setTimeout(() => setUploadSuccess(false), 3000);
      
    } catch (err) {
      setError('Failed to upload payment: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    document.getElementById('file-upload').value = '';
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-dark flex items-center justify-center">
        <motion.div
          className="text-white text-xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading your dashboard...
        </motion.div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen bg-dark flex items-center justify-center mt-16">
        <GlassCard className="p-8 text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <CTAButton onClick={() => navigate('/login')}>
            Back to Login
          </CTAButton>
        </GlassCard>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-dark bg-gradient-to-br from-dark via-dark to-primary/20 mt-16">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          className="flex justify-between items-center mb-8"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div>
            <h1 className="font-heading text-4xl font-bold text-white mb-2">
              Welcome back, {profile?.first_name || 'User'}!
            </h1>
            <p className="text-text-secondary">Manage your OSUSU savings and groups</p>
          </div>
          <CTAButton onClick={handleLogout} className="flex items-center gap-2">
            <FiLogOut size={18} />
            Logout
          </CTAButton>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 xl:grid-cols-4 gap-8"
        >
          {/* Profile Information */}
          <motion.div variants={fadeIn} className="xl:col-span-2">
            <GlassCard className="p-8">
              <h2 className="font-heading text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <FiUser className="text-primary" />
                Profile Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">First Name</label>
                    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                      <FiUser className="text-primary" />
                      <span className="text-white">{profile?.first_name || 'Not provided'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Last Name</label>
                    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                      <FiUser className="text-primary" />
                      <span className="text-white">{profile?.last_name || 'Not provided'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                      <FiMail className="text-primary" />
                      <span className="text-white">{profile?.email || user?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Phone Number</label>
                    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                      <FiPhone className="text-primary" />
                      <span className="text-white">{profile?.phone_number || 'Not provided'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Address</label>
                    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                      <FiMapPin className="text-primary" />
                      <span className="text-white">{profile?.address || 'Not provided'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Date of Birth</label>
                    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                      <FiCalendar className="text-primary" />
                      <span className="text-white">
                        {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {profile?.nin && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-text-secondary mb-1">National Identification Number</label>
                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                    <FiCreditCard className="text-primary" />
                    <span className="text-white">{profile.nin}</span>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Bank Account Information */}
          <motion.div variants={fadeIn} className="xl:col-span-1">
            <GlassCard className="p-6">
              <h3 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-3">
                <FiCreditCard className="text-secondary" />
                Bank Account
              </h3>
              
              {account ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Account Status</label>
                    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                      {account.status === 'active' ? (
                        <FiCheckCircle className="text-green-500" />
                      ) : account.status === 'inactive' ? (
                        <FiXCircle className="text-yellow-500" />
                      ) : account.status === 'blacklist' ? (
                        <FiAlertCircle className="text-red-500" />
                      ) : account.status === 'deceased' ? (
                        <FiAlertCircle className="text-gray-500" />
                      ) : (
                        <FiAlertCircle className="text-red-500" />
                      )}
                      <span className={`font-medium capitalize ${
                        account.status === 'active' ? 'text-green-500' : 
                        account.status === 'inactive' ? 'text-yellow-500' : 
                        account.status === 'blacklist' ? 'text-red-500' :
                        account.status === 'deceased' ? 'text-gray-500' : 'text-red-500'
                      }`}>
                        {account.status || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Account Number</label>
                    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                      <FiCreditCard className="text-primary" />
                      <span className="text-white font-mono">
                        {account.account_number || 'Not provided'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Bank Name</label>
                    <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                      <FiHome className="text-secondary" />
                      <span className="text-white">
                        {account.bank_name || 'Not provided'}
                      </span>
                    </div>
                  </div>

                  {account.updated_at && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Last Updated</label>
                      <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                        <FiCalendar className="text-primary" />
                        <span className="text-white">
                          {new Date(account.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-text-secondary py-8">
                  <FiAlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No bank account found</p>
                  <p className="text-sm mt-2">Contact admin to add your bank details</p>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={fadeIn} className="xl:col-span-1 space-y-6">
            <GlassCard className="p-6">
              <h3 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-3">
                <FiActivity className="text-primary" />
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Total Slots</span>
                  <span className="text-2xl font-bold text-primary">{userGroups.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Unique Groups</span>
                  <span className="text-2xl font-bold text-secondary">
                    {new Set(userGroups.map(g => g.group_id)).size}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Total Payments</span>
                  <span className="text-2xl font-bold text-primary">{userPayments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Approved Payments</span>
                  <span className="text-2xl font-bold text-green-500">
                    {userPayments.filter(p => p.approved === true).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Bank Account</span>
                  <span className={`text-sm font-bold ${
                    account?.status === 'active' ? 'text-green-500' : 
                    account?.status === 'inactive' ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {account?.status ? account.status.toUpperCase() : 'NOT SET'}
                  </span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-heading text-xl font-bold text-white mb-4">Recent Payments</h3>
              {userPayments.length > 0 ? (
                <div className="space-y-3">
                  {userPayments.slice(0, 3).map((payment) => {
                    const statusInfo = getPaymentStatus(payment.approved, payment.screenshot_url);
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white text-sm font-medium">
                            ₦{payment.amount ? Number(payment.amount).toLocaleString() : '0'}
                          </p>
                          <p className="text-text-secondary text-xs">
                            {payment.group_members?.groups?.name || 'Unknown Group'}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusInfo.bgColor} ${statusInfo.color}`}>
                          <span>{statusInfo.icon}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-text-secondary py-8">
                  <FiCreditCard size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No payments yet</p>
                  <p className="text-sm mt-2">Upload your first payment screenshot!</p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* User Groups Section */}
        {userGroups.length > 0 && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="mt-8"
          >
            <h2 className="font-heading text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <FiUsers className="text-primary" />
              Your Group Memberships
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userGroups.map((membership) => (
                <GlassCard key={membership.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-heading text-xl font-bold text-white">
                        {membership.groups?.name || 'Unnamed Group'}
                      </h3>
                      <p className="text-text-secondary text-sm mt-1">
                        Slot #{membership.slot_number}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        membership.payment_verified ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {membership.payment_verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary flex items-center gap-2">
                        <FiDollarSign size={16} />
                        Pool Amount
                      </span>
                      <span className="text-white font-bold">
                        ₦{membership.groups?.pool_amount ? Number(membership.groups.pool_amount).toLocaleString() : '0'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary flex items-center gap-2">
                        <FiUsers size={16} />
                        Slot Position
                      </span>
                      <span className="text-primary font-bold">
                        #{membership.slot_number} of {membership.groups?.max_slots || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary flex items-center gap-2">
                        <FiClock size={16} />
                        Duration
                      </span>
                      <span className="text-white capitalize">
                        {membership.groups?.duration_type || 'N/A'}
                      </span>
                    </div>
                    
                    {membership.groups?.start_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary flex items-center gap-2">
                          <FiCalendar size={16} />
                          Start Date
                        </span>
                        <span className="text-white">
                          {new Date(membership.groups.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {membership.groups?.end_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary flex items-center gap-2">
                          <FiCalendar size={16} />
                          End Date
                        </span>
                        <span className="text-white">
                          {new Date(membership.groups.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary flex items-center gap-2">
                        <FiUsers size={16} />
                        Max Slots
                      </span>
                      <span className="text-white">
                        {membership.groups?.max_slots || 'N/A'}
                      </span>
                    </div>
                    
                    {membership.joined_at && (
                      <div className="pt-2 border-t border-white/10">
                        <span className="text-text-secondary text-sm">
                          Joined: {new Date(membership.joined_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* Payment Upload Section */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mt-8"
        >
          <h2 className="font-heading text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <FiUpload className="text-primary" />
            Upload Payment Screenshot
          </h2>
          
          <GlassCard className="p-8">
            <form id="payment-form" onSubmit={handlePaymentUpload} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Group Membership Selection */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Select Group Membership *
                  </label>
                  <select
                    value={selectedGroupMembership}
                    onChange={(e) => setSelectedGroupMembership(e.target.value)}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="" className="bg-dark text-white">Choose a group membership...</option>
                    {userGroups.map((membership) => (
                      <option 
                        key={membership.id} 
                        value={membership.id}
                        className="bg-dark text-white"
                      >
                        {membership.groups?.name || 'Unnamed Group'} - Slot #{membership.slot_number}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Amount */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Payment Amount (₦) *
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    step="0.01"
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Payment Screenshot *
                </label>
                
                {!selectedFile ? (
                  <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      required
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                        <FiImage size={32} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Click to upload screenshot</p>
                        <p className="text-text-secondary text-sm mt-1">
                          PNG, JPG, or WebP up to 5MB
                        </p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <FiImage size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedFile.name}</p>
                        <p className="text-text-secondary text-sm">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = URL.createObjectURL(selectedFile);
                          window.open(url, '_blank');
                        }}
                        className="p-2 text-secondary hover:bg-white/10 rounded-lg transition-colors"
                        title="Preview image"
                      >
                        <FiEye size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="p-2 text-red-500 hover:bg-white/10 rounded-lg transition-colors"
                        title="Remove file"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {uploadSuccess && (
                <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <FiCheckCircle size={16} />
                    Payment screenshot uploaded successfully! It will be reviewed by admin.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <CTAButton
                  type="submit"
                  disabled={uploading || !selectedFile || !selectedGroupMembership || !paymentAmount}
                  className="flex items-center gap-2 min-w-[180px] justify-center"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload size={18} />
                      Upload Payment
                    </>
                  )}
                </CTAButton>
              </div>
            </form>
          </GlassCard>
        </motion.div>

        {/* Payment History Section */}
        {userPayments.length > 0 && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="mt-8"
          >
            <h2 className="font-heading text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <FiCreditCard className="text-secondary" />
              Payment History
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {userPayments.map((payment) => {
                const statusInfo = getPaymentStatus(payment.approved, payment.screenshot_url);
                
                return (
                  <GlassCard key={payment.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-heading text-lg font-bold text-white">
                          {payment.group_members?.groups?.name || 'Unknown Group'}
                        </h3>
                        <p className="text-text-secondary text-sm">
                          Slot #{payment.group_members?.slot_number || 'N/A'}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusInfo.bgColor} ${statusInfo.color}`}>
                        <span>{statusInfo.icon}</span>
                        <span>{statusInfo.status}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary flex items-center gap-2">
                          <FiDollarSign size={16} />
                          Amount
                        </span>
                        <span className="text-white font-bold">
                          ₦{payment.amount ? Number(payment.amount).toLocaleString() : '0'}
                        </span>
                      </div>
                      
                      {payment.due_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary flex items-center gap-2">
                            <FiCalendar size={16} />
                            Due Date
                          </span>
                          <span className="text-white">
                            {new Date(payment.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      {payment.paid_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary flex items-center gap-2">
                            <FiClock size={16} />
                            Paid At
                          </span>
                          <span className="text-white">
                            {new Date(payment.paid_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      {payment.screenshot_url && (
                        <div className="pt-2 border-t border-white/10">
                          <button
                            onClick={() => window.open(payment.screenshot_url, '_blank')}
                            className="flex items-center gap-2 text-primary hover:text-secondary transition-colors text-sm"
                          >
                            <FiEye size={14} />
                            View Screenshot
                          </button>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap gap-4 mt-8 justify-center"
        >
          <CTAButton className="flex items-center gap-2">
            <FiUsers size={18} />
            Join a Group
          </CTAButton>
          <CTAButton className="flex items-center gap-2 bg-gradient-to-r from-secondary to-primary">
            <FiCreditCard size={18} />
            View Transactions
          </CTAButton>
        </motion.div>
      </div>
    </section>
  );
}

export default UserDashBoard;