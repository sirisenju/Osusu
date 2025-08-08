import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentStatsChart from './PaymentStatsChart';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  DollarSign, 
  Calendar,
  FileImage,
  AlertCircle,
  TrendingUp,
  Filter
} from 'lucide-react';
import supabase from '@/lib/supabase';

const PaymentsView = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupPayments, setGroupPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentStats, setPaymentStats] = useState({
    totalPayments: 0,
    approvedPayments: 0,
    pendingPayments: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchGroups();
    fetchPaymentStats();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members (
            id,
            slot_number,
            payment_verified,
            joined_at,
            profiles (
              first_name,
              last_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, approved');

      if (error) throw error;

      const stats = payments.reduce((acc, payment) => {
        acc.totalPayments++;
        acc.totalAmount += parseFloat(payment.amount || 0);
        if (payment.approved === true) {
          acc.approvedPayments++;
        } else {
          acc.pendingPayments++;
        }
        return acc;
      }, {
        totalPayments: 0,
        approvedPayments: 0,
        pendingPayments: 0,
        totalAmount: 0
      });

      setPaymentStats(stats);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const fetchGroupPayments = async (groupId) => {
    try {
      setLoading(true);
      
      // Get group members first
      const { data: groupMembers, error: membersError } = await supabase
        .from('group_members')
        .select(`
          id,
          slot_number,
          payment_verified,
          joined_at,
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      // Get payments for these group members
      const memberIds = groupMembers.map(member => member.id);
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('group_member_id', memberIds)
        .order('paid_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Combine member info with their payments
      const membersWithPayments = groupMembers.map(member => ({
        ...member,
        payments: payments.filter(payment => payment.group_member_id === member.id)
      }));

      setGroupPayments(membersWithPayments);
    } catch (error) {
      console.error('Error fetching group payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    fetchGroupPayments(group.id);
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ approved: true })
        .eq('id', paymentId);

      if (error) throw error;

      // Refresh the payments
      if (selectedGroup) {
        fetchGroupPayments(selectedGroup.id);
      }
      fetchPaymentStats();
    } catch (error) {
      console.error('Error approving payment:', error);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ approved: false })
        .eq('id', paymentId);

      if (error) throw error;

      // Refresh the payments
      if (selectedGroup) {
        fetchGroupPayments(selectedGroup.id);
      }
      fetchPaymentStats();
    } catch (error) {
      console.error('Error rejecting payment:', error);
    }
  };

  const getPaymentStatus = (approved, screenshot_url) => {
    if (approved === true && screenshot_url) {
      return { status: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    } else if (approved === false && screenshot_url) {
      return { status: 'Awaiting Approval', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    } else if (approved === false && !screenshot_url) {
      return { status: 'Pending', color: 'bg-orange-100 text-orange-800', icon: AlertCircle };
    } else {
      return { status: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: XCircle };
    }
  };

  if (loading && !selectedGroup) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading payments data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <p className="text-gray-600">Monitor and manage all group payments</p>
      </div>

      {/* Payment Stats Chart */}
      <div>
        <PaymentStatsChart paymentStats={paymentStats} />
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
            <div className="text-center">
              <p className="text-sm text-blue-700 font-medium">Total Payments</p>
              <p className="text-2xl font-bold text-blue-900">{paymentStats.totalPayments}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
            <div className="text-center">
              <p className="text-sm text-green-700 font-medium">Approved</p>
              <p className="text-2xl font-bold text-green-900">{paymentStats.approvedPayments}</p>
              <p className="text-xs text-green-600">
                {paymentStats.totalPayments > 0 
                  ? `${Math.round((paymentStats.approvedPayments / paymentStats.totalPayments) * 100)}% rate`
                  : '0% rate'
                }
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200">
            <div className="text-center">
              <p className="text-sm text-yellow-700 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{paymentStats.pendingPayments}</p>
              <p className="text-xs text-yellow-600">
                {paymentStats.totalPayments > 0 
                  ? `${Math.round((paymentStats.pendingPayments / paymentStats.totalPayments) * 100)}% rate`
                  : '0% rate'
                }
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
            <div className="text-center">
              <p className="text-sm text-purple-700 font-medium">Total Value</p>
              <p className="text-xl font-bold text-purple-900">
                ₦{(paymentStats.totalAmount / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-purple-600">
                Avg: ₦{paymentStats.totalPayments > 0 
                  ? Math.round(paymentStats.totalAmount / paymentStats.totalPayments).toLocaleString()
                  : '0'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="groups">All Groups</TabsTrigger>
          {selectedGroup && (
            <TabsTrigger value="details">
              {selectedGroup.name} Details
            </TabsTrigger>
          )}
        </TabsList>

        {/* Groups Overview Tab */}
        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Groups Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => {
                  const totalMembers = group.group_members?.length || 0;
                  const verifiedMembers = group.group_members?.filter(member => member.payment_verified)?.length || 0;
                  
                  return (
                    <Card key={group.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-lg">{group.name}</h3>
                            <Badge variant="outline">
                              {verifiedMembers}/{totalMembers} paid
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Pool Amount:</span>
                              <span className="font-medium">₦{Number(group.pool_amount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Duration:</span>
                              <span className="font-medium capitalize">{group.duration_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Max Slots:</span>
                              <span className="font-medium">{group.max_slots}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Start Date:</span>
                              <span className="font-medium">
                                {group.start_date ? new Date(group.start_date).toLocaleDateString() : 'Not set'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${totalMembers > 0 ? (verifiedMembers / totalMembers) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {Math.round(totalMembers > 0 ? (verifiedMembers / totalMembers) * 100 : 0)}% payment verification
                            </p>
                          </div>

                          <Button 
                            onClick={() => handleGroupSelect(group)}
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Group Details Tab */}
        {selectedGroup && (
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileImage className="h-5 w-5" />
                    {selectedGroup.name} - Member Payments
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedGroup(null)}
                  >
                    Back to Groups
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading member payments...</div>
                ) : (
                  <div className="space-y-4">
                    {groupPayments.map((member) => (
                      <Card key={member.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold">
                                {member.profiles?.first_name} {member.profiles?.last_name}
                              </h4>
                              <p className="text-sm text-gray-600">{member.profiles?.email}</p>
                              <p className="text-sm text-gray-500">Slot #{member.slot_number}</p>
                            </div>
                            <Badge variant={member.payment_verified ? "default" : "secondary"}>
                              {member.payment_verified ? "Verified" : "Unverified"}
                            </Badge>
                          </div>

                          {member.payments && member.payments.length > 0 ? (
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Payment History:</h5>
                              {member.payments.map((payment) => {
                                const statusInfo = getPaymentStatus(payment.approved, payment.screenshot_url);
                                const StatusIcon = statusInfo.icon;
                                
                                return (
                                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <StatusIcon className="h-5 w-5" />
                                      <div>
                                        <p className="font-medium">₦{Number(payment.amount || 0).toLocaleString()}</p>
                                        <p className="text-sm text-gray-600">
                                          {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'No date'}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <Badge className={statusInfo.color}>
                                        {statusInfo.status}
                                      </Badge>
                                      
                                      {payment.screenshot_url && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(payment.screenshot_url, '_blank')}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      )}
                                      
                                      {payment.approved === false && payment.screenshot_url && (
                                        <div className="flex gap-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleApprovePayment(payment.id)}
                                            className="text-green-600 hover:text-green-700"
                                          >
                                            <CheckCircle className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRejectPayment(payment.id)}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <XCircle className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No payments uploaded yet</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default PaymentsView;
