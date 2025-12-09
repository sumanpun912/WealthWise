'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { ForecastExpensesOutput } from '@/ai/flows/forecast-expenses';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/contexts/TransactionContext';
import { linearRegression } from "@/lib/forecast";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select";

const forecastSchema = z.object({
  spendingPatterns: z.string().min(10, 'Please provide more details on spending patterns.'),
});

type ForecastFormData = z.infer<typeof forecastSchema>;

export function ForecastForm() {
  const { toast } = useToast();
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState<ForecastExpensesOutput | null>(null);
  const [chartData, setChartData] = useState<Array<{ period: string; actual: number; predicted: number }>>([]);
  const { transactions, loading: transactionsLoading } = useTransactions();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());

  const form = useForm<ForecastFormData>({
    resolver: zodResolver(forecastSchema),
    defaultValues: {
      spendingPatterns: '',
    },
  });

  // 🧠 Auto-generate spending summary for chosen month/year
  const spendingPatternsSummary = useMemo(() => {
    if (transactionsLoading || transactions.length === 0) {
      return "No transaction data available. Please add transactions first.";
    }

    const filtered = transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getFullYear().toString() === selectedYear &&
        (date.getMonth() + 1).toString() === selectedMonth
      );
    });

    if (filtered.length === 0) {
      return `No transactions found for ${selectedMonth}/${selectedYear}.`;
    }

    return filtered
      .map((t) => `${t.date}, ${t.type}, ${t.category}, $${t.amount.toFixed(2)}, ${t.description}`)
      .join('\n');
  }, [transactions, transactionsLoading, selectedYear, selectedMonth]);

  // 🪄 Update textarea when summary changes
  useEffect(() => {
    form.setValue('spendingPatterns', spendingPatternsSummary);
  }, [spendingPatternsSummary, form]);

  const onSubmit = async () => {
    setIsForecasting(true);
    setForecastResult(null);

    try {
      const filteredTransactions = transactions.filter((t) => {
        const date = new Date(t.date);
        return (
          date.getFullYear().toString() === selectedYear &&
          (date.getMonth() + 1).toString() === selectedMonth &&
          t.type === 'expense'
        );
      });

      if (filteredTransactions.length < 2) {
        toast({
          title: "Not Enough Data",
          description: "You need at least 2 expense transactions in the selected month to forecast.",
          variant: "destructive",
        });
        setIsForecasting(false);
        return;
      }

      const expenseData = filteredTransactions
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((t) => t.amount);

      const result = linearRegression(expenseData);

      if (!result) {
        toast({
          title: "Forecast Error",
          description: "Could not calculate forecast from available data.",
          variant: "destructive",
        });
        setIsForecasting(false);
        return;
      }

      const forecastOutput: ForecastExpensesOutput = {
        projectedExpenses: `For ${selectedMonth}/${selectedYear}, the next projected expense is approximately $${result.predictedNext.toFixed(2)}.`,
        investmentNeeds: `Your spending trend slope is ${result.slope.toFixed(2)}, indicating a ${result.slope > 0 ? 'rising' : 'declining'} expense trend.`,
        recommendations: result.slope > 0
          ? 'Consider reviewing discretionary spending or setting stricter monthly limits.'
          : 'Great job! Your expenses appear to be stabilizing or decreasing over time.',
      };

      setForecastResult(forecastOutput);

      const visualData = expenseData.map((amount, i) => ({
        period: `#${i + 1}`,
        actual: amount,
        predicted: result.slope * (i + 1) + result.intercept,
      }));

      visualData.push({
        period: "Next",
        actual: NaN,
        predicted: result.predictedNext,
      });

      setChartData(visualData);

      toast({
        title: "Forecast Generated",
        description: "Forecast successfully calculated for the selected period.",
      });
    } catch (error) {
      console.error('Error forecasting expenses:', error);
      toast({
        title: "Error",
        description: "Could not perform forecast.",
        variant: "destructive",
      });
    } finally {
      setIsForecasting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Smart Financial Forecast</CardTitle>
          <CardDescription>Select a month and year to generate your expense forecast.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Year & Month Selectors */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="year">Select Year</Label>
              <Select onValueChange={(value) => setSelectedYear(value)} defaultValue={selectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Choose year" />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month">Select Month</Label>
              <Select onValueChange={(value) => setSelectedMonth(value)} defaultValue={selectedMonth}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Choose month" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December",
                  ].map((month, i) => (
                    <SelectItem key={month} value={(i + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Past Spending Patterns */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="spendingPatterns">Past Spending Patterns ({selectedMonth}/{selectedYear})</Label>
              <Textarea
                id="spendingPatterns"
                {...form.register('spendingPatterns')}
                rows={8}
                className="min-h-[150px]"
                readOnly
              />
              {form.formState.errors.spendingPatterns && (
                <p className="text-sm text-destructive">{form.formState.errors.spendingPatterns.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isForecasting}>
              {isForecasting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Forecast
            </Button>
          </form>
        </CardContent>
      </Card>

      {forecastResult && (
        <>
          <Card className="w-full max-w-3xl mx-auto mt-8 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Forecast Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-primary">Projected Expenses:</h3>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{forecastResult.projectedExpenses}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-primary">Investment Needs:</h3>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{forecastResult.investmentNeeds}</p>
              </div>
              {forecastResult.recommendations && (
                <div>
                  <h3 className="font-semibold text-lg text-primary">Recommendations:</h3>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{forecastResult.recommendations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {chartData.length > 0 && (
            <Card className="w-full max-w-3xl mx-auto mt-8 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">Expense Trend Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.filter((d) => !isNaN(d.predicted))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => (typeof value === "number" ? `$${value.toFixed(2)}` : value)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="actual" stroke="#8884d8" strokeWidth={2} name="Actual" />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Forecast"
                      dot={{ r: 5 }}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}





// 'use client';

// import React, { useState, useMemo, useEffect } from 'react';
// import { useBudgets } from '@/contexts/BudgetContext';
// import { useAuth } from '@/contexts/AuthContext';
// import { useRouter } from 'next/navigation';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
// import { PiggyBank, Terminal, TrendingUp } from 'lucide-react';
// import Loading from '@/app/loading';
// import type { Budget } from '@/lib/types';
// import { linearRegression } from '@/lib/forecast';
// import { format, parse } from 'date-fns';

// export function ForecastForm() {
//   const { currentUser, loading: authLoading } = useAuth();
//   const { budgets, loading: budgetsLoading, error: budgetContextError } = useBudgets();
//   const router = useRouter();

//   useEffect(() => {
//     if (!authLoading && !currentUser) {
//       router.push('/login');
//     }
//   }, [currentUser, authLoading, router]);

//   if (authLoading || budgetsLoading || !currentUser) {
//     return <Loading />;
//   }

//   const formatMonthYear = (monthStr: string) => {
//     try {
//       const date = parse(monthStr, 'yyyy-MM', new Date());
//       return format(date, 'MMMM yyyy');
//     } catch {
//       return monthStr;
//     }
//   };

//   // 🔹 Generate forecast for each category using linear regression
//   const categoryForecasts = useMemo(() => {
//     const grouped: Record<string, number[]> = {};
//     budgets.forEach(b => {
//       if (!grouped[b.category]) grouped[b.category] = [];
//       grouped[b.category].push(b.allocatedAmount);
//     });

//     const forecasts: { category: string; predicted: number }[] = [];
//     for (const [category, data] of Object.entries(grouped)) {
//       const result = linearRegression(data);
//       if (result) forecasts.push({ category, predicted: result.predictedNext });
//     }
//     return forecasts;
//   }, [budgets]);

//   return (
//     <div className="space-y-6">
//       {/* 🔹 Page Header */}
//       <div className="flex items-center justify-between">
//         <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
//           <PiggyBank className="h-8 w-8 text-primary" /> Monthly Budgets Forecast
//         </h1>
//       </div>

//       {/* 🔹 Error Alert */}
//       {budgetContextError && (
//         <Alert variant="destructive" className="mb-4">
//           <Terminal className="h-4 w-4" />
//           <AlertTitle>Storage Error</AlertTitle>
//           <AlertDescription>{budgetContextError}</AlertDescription>
//         </Alert>
//       )}

//       {/* 🔹 Budget Table */}
//       {budgets.length > 0 && (
//         <Card className="shadow-lg">
//           <CardHeader>
//             <CardTitle>Your Budgets</CardTitle>
//             <CardDescription>Overview of your monthly financial plans.</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="overflow-x-auto">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Month</TableHead>
//                     <TableHead>Category</TableHead>
//                     <TableHead className="text-right">Allocated Amount</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {budgets.map((b) => (
//                     <TableRow key={b.id}>
//                       <TableCell>{formatMonthYear(b.month)}</TableCell>
//                       <TableCell>{b.category}</TableCell>
//                       <TableCell className="text-right">${b.allocatedAmount.toFixed(2)}</TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* 🔹 AI Forecast Section */}
//       {categoryForecasts.length > 0 && (
//         <Card className="mt-6 shadow-lg border-primary/20">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2 text-primary">
//               <TrendingUp className="h-5 w-5" /> AI Forecast
//             </CardTitle>
//             <CardDescription>
//               Predicted next month’s budget by category (based on your past spending trends).
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="overflow-x-auto">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Category</TableHead>
//                     <TableHead className="text-right">Predicted Next Month</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {categoryForecasts.map(({ category, predicted }) => (
//                     <TableRow key={category}>
//                       <TableCell>{category}</TableCell>
//                       <TableCell className="text-right font-semibold text-foreground">
//                         ${predicted.toFixed(2)}
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }
