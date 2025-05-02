import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  transactionService,
  categoryService,
  budgetService,
} from "../services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [budgetComparison, setBudgetComparison] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Colors for charts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FFC658",
    "#8DD1E1",
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
        const currentYear = now.getFullYear();

        // Create date range for current month
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0);
        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];

        // Fetch categories first (needed for other data)
        const categoriesData = await categoryService.getAll();
        const fetchedCategories = categoriesData.categories || [];
        setCategories(fetchedCategories);

        // Fetch ALL transactions for the current month (for expense by category chart)
        const allTransactionsData = await transactionService.getAll({
          startDate: startDateStr,
          endDate: endDateStr,
        });
        setAllTransactions(allTransactionsData.transactions || []);

        // Fetch financial summary
        const summaryData = await transactionService.getSummary({
          startDate: startDateStr,
          endDate: endDateStr,
        });
        setSummary(summaryData);

        // Fetch recent transactions
        const transactionsData = await transactionService.getAll({
          limit: 5,
          sort: "date:desc",
        });
        setTransactions(transactionsData.transactions || []);

        // Generate monthly data for the last 6 months
        const monthlyDataArray = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const month = date.getMonth() + 1;
          const year = date.getFullYear();

          // Create start date (first day of month)
          const monthStartDate = new Date(year, month - 1, 1);

          // Create end date (last day of month)
          const monthEndDate = new Date(year, month, 0);

          try {
            // Log the parameters being sent to the API for debugging
            console.log(`Fetching data for ${month}/${year}:`, {
              startDate: monthStartDate.toISOString().split("T")[0],
              endDate: monthEndDate.toISOString().split("T")[0],
            });

            const monthSummary = await transactionService.getSummary({
              startDate: monthStartDate.toISOString().split("T")[0],
              endDate: monthEndDate.toISOString().split("T")[0],
            });

            // Log the response from the API for debugging
            console.log(`Response for ${month}/${year}:`, monthSummary);

            monthlyDataArray.push({
              name: format(date, "MMM yyyy"),
              income: parseFloat(monthSummary.totalIncome || 0),
              expenses: parseFloat(monthSummary.totalExpense || 0), // Change from totalExpenses to totalExpense
              balance: parseFloat(monthSummary.balance || 0),
            });
          } catch (err) {
            console.error(`Failed to fetch data for ${month}/${year}:`, err);
            monthlyDataArray.push({
              name: format(date, "MMM yyyy"),
              income: 0,
              expenses: 0,
              balance: 0,
            });
          }
        }
        console.log("Monthly data:", monthlyDataArray);
        setMonthlyData(monthlyDataArray);

        // Get budgets for the current month
        const budgetsData = await budgetService.getAll({
          month: currentMonth,
          year: currentYear,
        });

        // Create a manual comparison
        const manualComparison = [];
        const budgets = budgetsData.budgets || [];
        const monthTxs = allTransactionsData.transactions || [];

        // Process each budget
        budgets.forEach((budget) => {
          const categoryId = budget.categoryId;
          // Find the category name using the categories we already fetched
          const category = fetchedCategories.find((c) => c.id === categoryId);
          const categoryName = category ? category.name : "Unknown";

          // Calculate actual spending for this category
          const actualSpending = monthTxs
            .filter(
              (tx) => tx.categoryId === categoryId && tx.type === "expense"
            )
            .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

          manualComparison.push({
            category: categoryName,
            budgeted: parseFloat(budget.amount),
            actual: actualSpending,
          });
        });

        setBudgetComparison(manualComparison);
        setLoading(false);
      } catch (err) {
        setError("Failed to load dashboard data");
        setLoading(false);
        console.error(err);
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare data for expense by category pie chart
  const prepareExpensesByCategoryData = () => {
    if (!allTransactions || allTransactions.length === 0) return [];

    const expensesByCategory = {};

    // Process all transactions for the current month
    allTransactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        // Find category name
        const category = categories.find(
          (c) => c.id === transaction.categoryId
        );
        const categoryName = category ? category.name : "Uncategorized";

        if (!expensesByCategory[categoryName]) {
          expensesByCategory[categoryName] = 0;
        }
        expensesByCategory[categoryName] += parseFloat(transaction.amount);
      }
    });

    // Convert to array format for the pie chart
    return Object.keys(expensesByCategory).map((category) => ({
      name: category,
      value: expensesByCategory[category],
    }));
  };

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded-md border">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-primary">${payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              $
              {summary && summary.totalIncome
                ? summary.totalIncome.toFixed(2)
                : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current month</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              $
              {summary && summary.totalExpense
                ? parseFloat(summary.totalExpense).toFixed(2)
                : "0.00"}
            </div>

            <p className="text-xs text-muted-foreground mt-1">Current month</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary && summary.balance && summary.balance >= 0
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              $
              {summary && summary.balance ? summary.balance.toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current month</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card className="mb-8 hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Monthly Financial Trend</CardTitle>
          <CardDescription>
            Income, expenses and balance over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#4ade80"
                  name="Income"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#f87171"
                  name="Expenses"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#60a5fa"
                  name="Balance"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Budget vs Actual Chart */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Budget vs Actual Spending</CardTitle>
            <CardDescription>Current month comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {budgetComparison.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={budgetComparison}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="budgeted" fill="#8884d8" name="Budgeted" />
                    <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No budget data available
                  </p>
                  <button
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-md text-sm"
                    onClick={() => (window.location.href = "/budgets")}
                  >
                    Create Budget
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Category Chart */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Distribution of your spending</CardDescription>
          </CardHeader>
          <CardContent>
            {prepareExpensesByCategoryData().length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareExpensesByCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareExpensesByCategoryData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No expense data available
                  </p>
                  <button
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-md text-sm"
                    onClick={() => (window.location.href = "/transactions")}
                  >
                    Add Transaction
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="mb-8 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activities</CardDescription>
          </div>
          <button
            className="px-4 py-2 bg-primary text-white rounded-md text-sm"
            onClick={() => (window.location.href = "/transactions")}
          >
            View All
          </button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-right py-3 px-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((transaction) => {
                    // Find category name
                    const category = categories.find(
                      (c) => c.id === transaction.categoryId
                    );
                    const categoryName = category
                      ? category.name
                      : "Uncategorized";

                    return (
                      <tr
                        key={transaction.id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-3 px-4">
                          {format(new Date(transaction.date), "MMM dd, yyyy")}
                        </td>
                        <td className="py-3 px-4">{transaction.description}</td>
                        <td className="py-3 px-4">{categoryName}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs ${
                              transaction.type === "income"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {transaction.type.charAt(0).toUpperCase() +
                              transaction.type.slice(1)}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 text-right ${
                            transaction.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          ${parseFloat(transaction.amount).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-8 text-center text-muted-foreground"
                    >
                      <p>No recent transactions found</p>
                      <button
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-md text-sm"
                        onClick={() => (window.location.href = "/transactions")}
                      >
                        Add Transaction
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
