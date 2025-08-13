import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, TrendingUp, TrendingDown } from 'lucide-react';

function TransactionSummary({ data, loading, onViewDetails }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const mockTransactions = [
    {
      id: '1',
      type: 'contribution',
      amount: 50000,
      user: 'John Doe',
      group: 'Monthly Savers',
      status: 'completed',
      date: new Date().toISOString(),
      reference: 'TXN001'
    },
    {
      id: '2',
      type: 'payout',
      amount: 200000,
      user: 'Jane Smith',
      group: 'Weekly Contributors',
      status: 'pending',
      date: new Date(Date.now() - 86400000).toISOString(),
      reference: 'TXN002'
    },
    {
      id: '3',
      type: 'contribution',
      amount: 25000,
      user: 'Mike Johnson',
      group: 'Quarterly Group',
      status: 'failed',
      date: new Date(Date.now() - 172800000).toISOString(),
      reference: 'TXN003'
    }
  ];

  const transactions = data?.length > 0 ? data : mockTransactions;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Loading transactions...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Recent Transactions
          <Badge variant="secondary" className="text-xs">
            {transactions.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.type === 'contribution' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="capitalize font-medium">
                        {transaction.type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{transaction.user}</TableCell>
                  <TableCell className="text-gray-600">{transaction.group}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails?.(transaction)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No transactions found for the selected period
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TransactionSummary;
