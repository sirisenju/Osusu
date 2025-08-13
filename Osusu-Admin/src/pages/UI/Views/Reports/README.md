# Reports Module

A comprehensive business reports dashboard for the Osusu admin panel.

## Components

### ReportsView
The main reports dashboard component with:
- Time-based filtering (7 days, 1 month, 3 months, 6 months, 1 year)
- Custom date range selection
- Multiple chart visualizations
- Export functionality (PDF, Excel, CSV)
- Print support
- Mobile responsive design

### BusinessMetrics
Displays key business metrics in card format:
- Total Users
- Active Groups
- Total Revenue
- Active Users
- Contributions
- Payouts
- Pending Payments
- System Health

### TransactionSummary
Shows recent transactions with:
- Transaction type (contribution/payout)
- User and group information
- Amount and status
- Action buttons

### ExportMenu
Dropdown menu for export options:
- PDF export
- Excel export
- CSV export
- Print functionality

### QuickStats
Quick overview badges showing daily statistics

## Usage

```jsx
import { ReportsView } from '@/pages/UI/Views/Reports';

function App() {
  return <ReportsView />;
}
```

## Integration with Routing

Add to your router:

```jsx
// In your routing file
import { ReportsView } from '@/pages/UI/Views/Reports';

const routes = [
  // ... other routes
  {
    path: '/reports',
    element: <ReportsView />
  }
];
```

## Database Integration

The component expects these Supabase tables:
- `profiles` - User profiles
- `groups` - Group information
- `admin_profiles` - Admin information
- Additional tables for transactions, payments, etc.

Update the database queries in `reportsView.jsx` to match your schema:

```javascript
// Example query update
const { data: contributions } = await supabase
  .from('your_contributions_table')
  .select('*')
  .gte('created_at', startDate.toISOString())
  .lte('created_at', endDate.toISOString());
```

## Features

✅ **Time Filtering**: 7 days to 1 year + custom ranges  
✅ **Multiple Chart Types**: Bar, Line, Area, Pie charts  
✅ **Export Options**: PDF, Excel, CSV formats  
✅ **Print Support**: Optimized print layouts  
✅ **Mobile Responsive**: Works on all screen sizes  
✅ **Real-time Data**: Refreshable data with loading states  
✅ **Detailed Metrics**: 8+ key performance indicators  
✅ **Transaction History**: Recent activity tracking  

## Dependencies

Required packages:
- `recharts` - For charts and visualizations
- `@/components/ui/*` - Shadcn UI components
- `lucide-react` - Icons

## Customization

### Adding New Metrics
1. Update `dashboardData` state in `reportsView.jsx`
2. Add new metric card to `BusinessMetrics.jsx`
3. Implement database query in `fetchDashboardData`

### Adding New Charts
1. Add chart data to `chartData` state
2. Create new tab in the Tabs component
3. Implement data fetching in `fetchChartData`

### Custom Export Logic
Update the `handleExport` function to integrate with your preferred export libraries:
- PDF: Use `jsPDF` or `react-pdf`
- Excel: Use `xlsx` or `react-excel-export`
- CSV: Use built-in JavaScript or `papa-parse`

## Mobile Responsiveness

The reports page is fully responsive with:
- Collapsible cards on small screens
- Horizontal scrolling for tables
- Responsive chart containers
- Touch-friendly interface elements

## Performance

- Lazy loading for chart components
- Memoized calculations
- Optimized database queries
- Loading states for better UX
