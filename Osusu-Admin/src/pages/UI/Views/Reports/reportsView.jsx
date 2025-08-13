import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  PieChart,
  BarChart3,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  File,
  Eye,
  Activity,
  Target,
  Wallet,
  Group,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import supabase from '../../../../lib/supabase';
import ExportMenu from './ExportMenu';
import TransactionSummary from './TransactionSummary';
import { BusinessMetrics, QuickStats } from './BusinessMetrics';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

function ReportsView() {
  // State management
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('30'); // 7, 30, 90, 180, 365 days
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  
  // Data states
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalGroups: 0,
    totalContributions: 0,
    totalPayouts: 0,
    activeUsers: 0,
    completedCycles: 0,
    pendingPayments: 0,
    totalRevenue: 0
  });
  
  const [chartData, setChartData] = useState({
    userRegistrations: [],
    groupCreations: [],
    contributions: [],
    payouts: [],
    revenueOverTime: []
  });
  
  const [detailsData, setDetailsData] = useState({
    topGroups: [],
    recentTransactions: [],
    userActivity: [],
    groupPerformance: []
  });

  const getDateRange = React.useCallback(() => {
    const endDate = new Date();
    let startDate = new Date();
    
    if (customDateFrom && customDateTo) {
      return {
        start: new Date(customDateFrom),
        end: new Date(customDateTo)
      };
    }
    
    switch (dateFilter) {
      case '7':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '180':
        startDate.setDate(endDate.getDate() - 180);
        break;
      case '365':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    return { start: startDate, end: endDate };
  }, [dateFilter, customDateFrom, customDateTo]);

  // Fetch data based on selected filters
  const fetchReportsData = React.useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      await Promise.all([
        fetchDashboardData(start, end),
        fetchChartData(start, end),
        fetchDetailsData(start, end)
      ]);
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  const fetchDashboardData = async (startDate, endDate) => {
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      // Fetch users created in date range
      const { count: newUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Fetch active users (assuming we have last_login or recent activity)
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch total groups
      const { count: totalGroups } = await supabase
        .from('groups')
        .select('id', { count: 'exact', head: true });

      // You can add more queries here for contributions, payouts, etc.
      // For now, I'll use placeholder data
      
      setDashboardData({
        totalUsers: totalUsers || 0,
        totalGroups: totalGroups || 0,
        newUsers: newUsers || 0,
        activeUsers: activeUsers || 0,
        totalContributions: 0, // Will be calculated from actual transactions
        totalPayouts: 0,
        completedCycles: 0,
        pendingPayments: 0,
        totalRevenue: 0
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchChartData = async (startDate, endDate) => {
    try {
      // Generate sample chart data - replace with actual database queries
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const mockData = [];
      
      for (let i = 0; i < Math.min(days, 30); i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        mockData.push({
          date: date.toISOString().split('T')[0],
          users: Math.floor(Math.random() * 10) + 1,
          groups: Math.floor(Math.random() * 5) + 1,
          contributions: Math.floor(Math.random() * 50000) + 10000,
          payouts: Math.floor(Math.random() * 30000) + 5000,
          revenue: Math.floor(Math.random() * 5000) + 1000
        });
      }
      
      setChartData({
        userRegistrations: mockData,
        groupCreations: mockData,
        contributions: mockData,
        payouts: mockData,
        revenueOverTime: mockData
      });
      
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const fetchDetailsData = async (startDate, endDate) => {
    try {
      // Note: startDate and endDate can be used for filtering when implementing actual queries
      console.log('Fetching details data for range:', startDate, 'to', endDate);
      
      // Fetch top performing groups
      const { data: topGroups } = await supabase
        .from('groups')
        .select('id, name, status, member_count, created_at')
        .order('member_count', { ascending: false })
        .limit(10);

      // Fetch recent activity/transactions
      // This would depend on your transaction/activity table structure
      
      setDetailsData({
        topGroups: topGroups || [],
        recentTransactions: [], // Add actual query
        userActivity: [],       // Add actual query
        groupPerformance: []    // Add actual query
      });
      
    } catch (error) {
      console.error('Error fetching details data:', error);
    }
  };

  const handleExport = (format) => {
    // Implement export functionality
    console.log(`Exporting report as ${format}`);
    
    if (format === 'pdf') {
      // Use a library like jsPDF or react-pdf
      alert('PDF export functionality would be implemented here');
    } else if (format === 'excel') {
      // Use a library like xlsx or react-excel-export
      alert('Excel export functionality would be implemented here');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getFilterLabel = () => {
    switch (dateFilter) {
      case '7': return 'Last 7 Days';
      case '30': return 'Last 30 Days';
      case '90': return 'Last 3 Months';
      case '180': return 'Last 6 Months';
      case '365': return 'Last Year';
      default: return 'Custom Range';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Business Reports</h1>
          <p className="text-gray-600">Comprehensive analytics and business insights</p>
        </div>
        
        <ExportMenu 
          onExport={handleExport}
          onPrint={handlePrint}
          loading={loading}
        />
      </div>

      {/* Quick Stats */}
      <QuickStats data={dashboardData} />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Time Period</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 3 Months</SelectItem>
                  <SelectItem value="180">Last 6 Months</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateFilter === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="from">From Date</Label>
                  <Input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="to">To Date</Label>
                  <Input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                  />
                </div>
              </>
            )}
            
            <div className="flex items-end">
              <Button 
                onClick={fetchReportsData} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Showing data for: {getFilterLabel()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <BusinessMetrics data={dashboardData} loading={loading} />

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  User Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.userRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Group Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.groupCreations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="groups" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData.contributions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="contributions" stroke="#3B82F6" name="Contributions" />
                  <Line type="monotone" dataKey="payouts" stroke="#F59E0B" name="Payouts" />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: dashboardData.activeUsers, color: '#10B981' },
                        { name: 'Inactive', value: dashboardData.totalUsers - dashboardData.activeUsers, color: '#6B7280' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                    >
                      {[
                        { name: 'Active', value: dashboardData.activeUsers, color: '#10B981' },
                        { name: 'Inactive', value: dashboardData.totalUsers - dashboardData.activeUsers, color: '#6B7280' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Daily User Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.userRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Groups</CardTitle>
                <CardDescription>Groups with highest member count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {detailsData.topGroups.slice(0, 5).map((group, index) => (
                    <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-gray-600">{group.member_count} members</p>
                        </div>
                      </div>
                      <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                        {group.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Group Creation Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.groupCreations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="groups" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalContributions)}</div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">12% increase</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalPayouts)}</div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-red-500">3% decrease</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pending Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(dashboardData.pendingPayments)}</div>
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-500">Awaiting processing</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Platform earnings over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData.revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Transaction Summary */}
          <TransactionSummary 
            data={detailsData.recentTransactions} 
            loading={loading}
            onViewDetails={(transaction) => {
              console.log('View transaction details:', transaction);
              // Handle transaction detail view
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ReportsView;
