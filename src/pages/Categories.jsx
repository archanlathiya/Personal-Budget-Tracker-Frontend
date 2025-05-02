import React, { useState, useEffect } from "react";
import { categoryService } from "../services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create"); // create or edit
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
  });
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAll();
      setCategories(response.categories || []);
      setError("");
    } catch (err) {
      setError("Failed to load categories");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setFormMode("create");
    setFormData({ name: "", type: "expense" });
    setShowForm(true);
  };

  const handleEditCategory = (category) => {
    setFormMode("edit");
    setFormData({
      name: category.name,
      type: category.type,
    });
    setSelectedCategory(category);
    setShowForm(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      await categoryService.delete(categoryId);
      fetchCategories(); // Refresh the list
    } catch (err) {
      setError("Failed to delete category");
      console.error(err);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      if (formMode === "create") {
        await categoryService.create(formData);
      } else {
        await categoryService.update(selectedCategory.id, formData);
      }

      setShowForm(false);
      fetchCategories(); // Refresh the list
    } catch (err) {
      setError(
        `Failed to ${formMode === "create" ? "create" : "update"} category`
      );
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Button onClick={handleCreateCategory}>Add Category</Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
          {error}
        </div>
      )}

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {formMode === "create" ? "Create" : "Edit"} Category
            </CardTitle>
            <CardDescription>
              {formMode === "create"
                ? "Add a new category for your transactions"
                : "Update this category's details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none"
                >
                  Category Name
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Groceries, Rent, Salary"
                  required
                />
              </div>

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

              <div className="flex space-x-2 pt-4">
                <Button type="submit">
                  {formMode === "create" ? "Create" : "Update"} Category
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-green-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Income Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categories.filter((cat) => cat.type === "income").length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No income categories found
              </p>
            ) : (
              <ul className="divide-y">
                {categories
                  .filter((category) => category.type === "income")
                  .map((category) => (
                    <li
                      key={category.id}
                      className="py-3 flex items-center justify-between"
                    >
                      <span className="font-medium">{category.name}</span>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Expense Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categories.filter((cat) => cat.type === "expense").length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No expense categories found
              </p>
            ) : (
              <ul className="divide-y">
                {categories
                  .filter((category) => category.type === "expense")
                  .map((category) => (
                    <li
                      key={category.id}
                      className="py-3 flex items-center justify-between"
                    >
                      <span className="font-medium">{category.name}</span>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Categories;