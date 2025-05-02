import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { budgetService, categoryService } from "../services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create"); // create or edit
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    month: new Date().getMonth() + 1, // Current month (1-12)
    year: new Date().getFullYear(),
    categoryId: "",
  });
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Fetch budgets and categories on component mount
  useEffect(() => {
    fetchData();
  }, [filterMonth, filterYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch expense categories
      const categoriesResponse = await categoryService.getAll();
      const expenseCategories = (categoriesResponse.categories || []).filter(
        (cat) => cat.type === "expense"
      );
      setCategories(expenseCategories);
      
      // Fetch budgets for the selected month/year
      const budgetsResponse = await budgetService.getAll({
        month: filterMonth,
        year: filterYear,
      });
      setBudgets(budgetsResponse.budgets || []);
      
      setError("");
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = () => {
    setFormMode("create");
    setFormData({
      amount: "",
      month: filterMonth,
      year: filterYear,
      categoryId: categories.length > 0 ? categories[0].id : "",
    });
    setShowForm(true);
  };

  const handleEditBudget = (budget) => {
    setFormMode("edit");
    setFormData({
      amount: budget.amount,
      month: budget.month,
      year: budget.year,
      categoryId: budget.categoryId,
    });
    setSelectedBudget(budget);
    setShowForm(true);
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) {
      return;
    }

    try {
      await budgetService.delete(budgetId);
      fetchData(); // Refresh the list
    } catch (err) {
      setError("Failed to delete budget");
      console.error(err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Convert amount to number
    const budgetData = {
      ...formData,
      amount: parseFloat(formData.amount),
      categoryId: parseInt(formData.categoryId),
    };

    try {
      if (formMode === "create") {
        await budgetService.create(budgetData);
      } else {
        await budgetService.update(selectedBudget.id, budgetData);
      }

      setShowForm(false);
      fetchData(); // Refresh the list
    } catch (err) {
      setError(
        `Failed to ${formMode === "create" ? "create" : "update"} budget`
      );
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMonthChange = (e) => {
    setFilterMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e) => {
    setFilterYear(parseInt(e.target.value));
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Unknown";
  };

  // Format month name
  const getMonthName = (monthNum) => {
    const date = new Date();
    date.setMonth(monthNum - 1);
    return format(date, "MMMM");
  };

  if (loading && budgets.length === 0 && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Budget Management</h1>
        <Button onClick={handleCreateBudget}>Add Budget</Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
          {error}
        </div>
      )}

      {/* Month/Year Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Budgets</CardTitle>
          <CardDescription>
            View and manage budgets for a specific month and year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium mb-1">Month</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={filterMonth}
                onChange={handleMonthChange}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium mb-1">Year</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={filterYear}
                onChange={handleYearChange}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - 2 + i
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {formMode === "create" ? "Create" : "Edit"} Budget
            </CardTitle>
            <CardDescription>
              {formMode === "create"
                ? "Allocate a budget for a category"
                : "Update this budget allocation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="categoryId"
                  className="text-sm font-medium leading-none"
                >
                  Category
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="amount"
                  className="text-sm font-medium leading-none"
                >
                  Budget Amount
                </label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="month"
                    className="text-sm font-medium leading-none"
                  >
                    Month
                  </label>
                  <select
                    id="month"
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="year"
                    className="text-sm font-medium leading-none"
                  >
                    Year
                  </label>
                  <select
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    required
                  >
                    {Array.from(
                      { length: 5 },
                      (_, i) => new Date().getFullYear() - 2 + i
                    ).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button type="submit">
                  {formMode === "create" ? "Create" : "Update"} Budget
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Budgets List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Budgets for {getMonthName(filterMonth)} {filterYear}
          </CardTitle>
          <CardDescription>
            Manage your budget allocations for different expense categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No budgets found for this month. Create a budget to get started.
              </p>
              <Button onClick={handleCreateBudget}>Create Budget</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-right py-3 px-4">Budget Amount</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget) => (
                    <tr key={budget.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {getCategoryName(budget.categoryId)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        ${parseFloat(budget.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBudget(budget)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteBudget(budget.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/50">
                    <td className="py-3 px-4 font-bold">Total</td>
                    <td className="py-3 px-4 text-right font-bold">
                      $
                      {budgets
                        .reduce(
                          (sum, budget) => sum + parseFloat(budget.amount),
                          0
                        )
                        .toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Budgets;