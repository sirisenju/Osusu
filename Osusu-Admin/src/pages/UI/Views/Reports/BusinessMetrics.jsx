/* eslint-disable no-unused-vars */
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Group, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

function MetricCard({ title, value, change, changeType, icon: Icon, color, subtitle }) {
  const getChangeColor = (type) => {
    switch (type) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeIcon = (type) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-3 w-3" />;
      case 'negative':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
        <div className={`p-2 rounded-full ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change && (
          <div className={`flex items-center gap-1 text-sm ${getChangeColor(changeType)}`}>
            {getChangeIcon(changeType)}
            <span>{change}</span>
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function BusinessMetrics({ data, loading }) {
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Users',
      value: formatNumber(data.totalUsers),
      change: `+${formatNumber(data.newUsers)} this period`,
      changeType: data.newUsers > 0 ? 'positive' : 'neutral',
      icon: Users,
      color: 'bg-blue-500',
      subtitle: 'Registered members'
    },
    {
      title: 'Active Groups',
      value: formatNumber(data.totalGroups),
      change: `${formatNumber(data.completedCycles)} completed cycles`,
      changeType: 'positive',
      icon: Group,
      color: 'bg-green-500',
      subtitle: 'Currently running'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      change: '+12.5% from last period',
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-purple-500',
      subtitle: 'Platform earnings'
    },
    {
      title: 'Active Users',
      value: formatNumber(data.activeUsers),
      change: formatPercentage((data.activeUsers / data.totalUsers) * 100),
      changeType: 'positive',
      icon: Activity,
      color: 'bg-orange-500',
      subtitle: 'Currently participating'
    },
    {
      title: 'Contributions',
      value: formatCurrency(data.totalContributions),
      change: '+8.3% this month',
      changeType: 'positive',
      icon: Target,
      color: 'bg-cyan-500',
      subtitle: 'Total amount collected'
    },
    {
      title: 'Payouts',
      value: formatCurrency(data.totalPayouts),
      change: '95.2% success rate',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'bg-green-600',
      subtitle: 'Successfully distributed'
    },
    {
      title: 'Pending Payments',
      value: formatNumber(data.pendingPayments),
      change: '-15% from yesterday',
      changeType: 'positive',
      icon: Clock,
      color: 'bg-yellow-500',
      subtitle: 'Awaiting processing'
    },
    {
      title: 'System Health',
      value: '99.9%',
      change: 'All systems operational',
      changeType: 'positive',
      icon: Zap,
      color: 'bg-emerald-500',
      subtitle: 'Uptime this month'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}

// Quick Stats Overview Component
function QuickStats({ data }) {
  // Data could be used to dynamically populate stats in the future
  console.log('QuickStats data:', data);
  
  const stats = [
    {
      label: 'Groups Created Today',
      value: '12',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      label: 'New Members Today',
      value: '34',
      color: 'bg-green-100 text-green-800'
    },
    {
      label: 'Transactions Today',
      value: '89',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      label: 'Active Issues',
      value: '3',
      color: 'bg-red-100 text-red-800'
    }
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {stats.map((stat, index) => (
        <Badge key={index} variant="secondary" className={`${stat.color} px-3 py-2`}>
          <span className="font-semibold mr-2">{stat.value}</span>
          {stat.label}
        </Badge>
      ))}
    </div>
  );
}

export { BusinessMetrics, QuickStats, MetricCard };
