import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { transactionService, categoryService } from "../services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create"); // create or edit
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    type: "expense",
    categoryId: "",
  });
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    type: "",
    categoryId: "",
    minAmount: "",
    maxAmount: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Fetch transactions and categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch transactions whenever filters or pagination changes
  useEffect(() => {
    fetchTransactions();
  }, [filters, pagination.page, pagination.limit]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.categories || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => !params[key] && delete params[key]);

      const response = await transactionService.getAll(params);
      setTransactions(response.transactions || []);

      // Update pagination with ALL values from the API response
      setPagination({
        page: response.pagination?.page || pagination.page,
        limit: response.pagination?.limit || pagination.limit,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 1,
      });

      setError("");
    } catch (err) {
      setError("Failed to load transactions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = () => {
    setFormMode("create");
    setFormData({
      description: "",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      type: "expense",
      categoryId: categories.length > 0 ? categories[0].id : "",
    });
    setShowForm(true);
  };

  const handleEditTransaction = (transaction) => {
    setFormMode("edit");
    setFormData({
      description: transaction.description,
      amount: transaction.amount,
      date: format(new Date(transaction.date), "yyyy-MM-dd"),
      type: transaction.type,
      categoryId: transaction.categoryId,
    });
    setSelectedTransaction(transaction);
    setShowForm(true);
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      await transactionService.delete(transactionId);
      fetchTransactions(); // Refresh the list
    } catch (err) {
      setError("Failed to delete transaction");
      console.error(err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Convert amount to number
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      categoryId: parseInt(formData.categoryId),
    };

    try {
      if (formMode === "create") {
        await transactionService.create(transactionData);
      } else {
        await transactionService.update(
          selectedTransaction.id,
          transactionData
        );
      }

      setShowForm(false);
      fetchTransactions(); // Refresh the list
    } catch (err) {
      setError(
        `Failed to ${formMode === "create" ? "create" : "update"} transaction`
      );
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    // Reset to first page when filters change
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  // Calculate total pages
  const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <Button onClick={handleCreateTransaction}>Add Transaction</Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Transactions</CardTitle>
          <CardDescription>
            Filters apply automatically as you change them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <Input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                name="categoryId"
                value={filters.categoryId}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Min Amount
              </label>
              <Input
                type="number"
                name="minAmount"
                value={filters.minAmount}
                onChange={handleFilterChange}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Amount
              </label>
              <Input
                type="number"
                name="maxAmount"
                value={filters.maxAmount}
                onChange={handleFilterChange}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                startDate: "",
                endDate: "",
                type: "",
                categoryId: "",
                minAmount: "",
                maxAmount: "",
              });
            }}
          >
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {/* Transaction Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {formMode === "create" ? "Add" : "Edit"} Transaction
            </CardTitle>
            <CardDescription>
              {formMode === "create"
                ? "Record a new financial transaction"
                : "Update this transaction's details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="text-sm font-medium leading-none"
                >
                  Description
                </label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g., Grocery shopping, Salary payment"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="amount"
                    className="text-sm font-medium leading-none"
                  >
                    Amount
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

                <div className="space-y-2">
                  <label
                    htmlFor="date"
                    className="text-sm font-medium leading-none"
                  >
                    Date
                  </label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="type"
                    className="text-sm font-medium leading-none"
                  >
                    Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="type"
                        value="expense"
                        checked={formData.type === "expense"}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary"
                      />
                      <span>Expense</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="type"
                        value="income"
                        checked={formData.type === "income"}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary"
                      />
                      <span>Income</span>
                    </label>
                  </div>
                </div>

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
                    {categories
                      .filter(
                        (category) =>
                          category.type === formData.type ||
                          category.type === "both"
                      )
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button type="submit">
                  {formMode === "create" ? "Add" : "Update"} Transaction
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

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Overview</CardTitle>
          <CardDescription>
            {transactions.length > 0
              ? `Showing ${
                  transactions.length > 0
                    ? (pagination.page - 1) * pagination.limit + 1
                    : 0
                } to ${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )} of ${pagination.total} transactions`
              : "No transactions found"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No transactions found matching your filters.
              </p>
              <Button onClick={handleCreateTransaction}>Add Transaction</Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Description</th>
                      <th className="text-left py-3 px-4">Category</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-right py-3 px-4">Amount</th>
                      <th className="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-3 px-4">
                          {format(new Date(transaction.date), "MMM dd, yyyy")}
                        </td>
                        <td className="py-3 px-4">{transaction.description}</td>
                        <td className="py-3 px-4">
                          {getCategoryName(transaction.categoryId)}
                        </td>
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
                        <td className="py-3 px-4">
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTransaction(transaction)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                handleDeleteTransaction(transaction.id)
                              }
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-center mt-6">
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>

                  {/* Simple pagination for small number of pages */}
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <Button
                      key={page}
                      variant={page === pagination.page ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
