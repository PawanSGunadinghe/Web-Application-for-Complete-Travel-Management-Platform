import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllBookings } from "../../../features/auth/bookings/api";
import { PayrollAPI } from "../../../features/auth/payroll/api";
import { getAllVehicles } from "../../../features/auth/vehicles/api";
import { getAllExpenses, createExpense, updateExpense, deleteExpense } from "../../../features/auth/expenses/api";
import jsPDF from "jspdf";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { io } from "socket.io-client";
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Plane, 
  Lightbulb, 
  Building, 
  Bus,
  Briefcase,
  Download,
  Plus,
  Grid3X3,
  Receipt,
  LogOut,
  ArrowRight,
  RefreshCw,
  Search
} from "lucide-react";

export default function SalariesList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    type: "vehicle", // Only "vehicle" now
    recipientId: "",
    amount: "",
    description: "",
    category: "",
    date: new Date().toISOString().split('T')[0]
  });
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [deletingSalaryId, setDeletingSalaryId] = useState("");
  const [editingSalary, setEditingSalary] = useState(null);
  const [paidMap, setPaidMap] = useState({});
  const [taxSearchQuery, setTaxSearchQuery] = useState("");

  // Helper to compute net salary from base + components (earnings - deductions)
  function computeNetAmount(salary) {
    const base = Number(salary?.base || 0);
    const components = Array.isArray(salary?.components) ? salary.components : [];
    return components.reduce((acc, c) => {
      const fixed = c?.amount != null ? Number(c.amount) : 0;
      const pct = c?.percentageOfBase != null ? Number(c.percentageOfBase) : 0;
      const value = fixed || (pct ? (base * pct / 100) : 0);
      return acc + (c?.type === "deduction" ? -value : value);
    }, base);
  }

  const payrollTotal = React.useMemo(() => {
    return (salaries || []).reduce((sum, s) => {
      const componentsSum = (s.components || []).reduce((cSum, c) => {
        if (typeof c.amount === "number") return cSum + c.amount;
        if (typeof c.percentageOfBase === "number") return cSum + (s.base * c.percentageOfBase / 100);
        return cSum;
      }, 0);
      return sum + (Number(s.base || 0) + componentsSum);
    }, 0);
  }, [salaries]);

  // Derived payroll overview stats from actual data
  const payrollStats = React.useMemo(() => {
    const uniqueEmployeeIds = new Set(
      (salaries || []).map((s) => (s.employee && (s.employee._id || s.employee)) || "")
    );
    const totalEmployees = Array.from(uniqueEmployeeIds).filter(Boolean).length;

    // Pending reviews: salaries with an effectiveTo date that has passed or is within next 7 days
    const now = Date.now();
    const in7Days = now + 7 * 24 * 60 * 60 * 1000;
    const pendingReviews = (salaries || []).filter((s) => {
      if (!s.effectiveTo) return false;
      const t = new Date(s.effectiveTo).getTime();
      return t <= in7Days;
    }).length;

    const avgSalary = (salaries && salaries.length)
      ? Math.round(payrollTotal / salaries.length)
      : 0;

    return { totalEmployees, monthlyPayroll: payrollTotal, pendingReviews, avgSalary };
  }, [salaries, payrollTotal]);

  // Calculate real data from bookings
  const calculateFinancialData = () => {
    if (!bookings.length) {
      return {
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        recentTransactions: [],
        incomeSources: [],
        incomeChartData: [],
        expenseTrendData: []
      };
    }

    // Calculate total income from confirmed bookings
    const confirmedBookings = bookings.filter(booking => 
      booking.status === "confirmed" || booking.status === "created"
    );
    
    const totalIncome = confirmedBookings.reduce((sum, booking) => 
      sum + (booking.pricing?.total || 0), 0
    );

    // Calculate expenses (you can add real expense data later)
    const totalExpenses = 7100; // Placeholder for now
    const totalBalance = totalIncome - totalExpenses;

    // Generate recent transactions from bookings
    const recentTransactions = confirmedBookings
      .slice(0, 5)
      .map((booking, index) => ({
        id: booking._id,
        name: booking.packageSnapshot?.name || `Package ${index + 1}`,
        date: new Date(booking.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        amount: booking.pricing?.total || 0,
        icon: Briefcase,
        color: "text-green-500"
      }));

    // Generate income sources from bookings
    const incomeSources = confirmedBookings
      .map((booking, index) => ({
        id: booking._id,
        name: booking.packageSnapshot?.name || `Package ${index + 1}`,
        date: new Date(booking.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        amount: booking.pricing?.total || 0,
        icon: Briefcase,
        color: "text-amber-600"
      }));

    // Generate income chart data (last 10 bookings)
    const incomeChartData = confirmedBookings
      .slice(0, 10)
      .map((booking, index) => ({
        name: new Date(booking.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short'
        }),
        amount: booking.pricing?.total || 0
      }));

    // Generate expense trend data (placeholder for now)
    const expenseTrendData = [
      { name: "2nd Jan", amount: 100 },
      { name: "3rd Jan", amount: 250 },
      { name: "4th Jan", amount: 500 },
      { name: "5th Jan", amount: 300 },
      { name: "6th Jan", amount: 100 },
      { name: "7th Jan", amount: 400 },
      { name: "8th Jan", amount: 200 },
      { name: "9th Jan", amount: 350 },
      { name: "10th Jan", amount: 150 },
      { name: "11th Jan", amount: 200 },
      { name: "12th Jan", amount: 300 },
      { name: "14th Jan", amount: 300 },
      { name: "10th Feb", amount: 400 },
      { name: "11th Feb", amount: 200 },
      { name: "17th Feb", amount: 430 }
    ];

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      recentTransactions,
      incomeSources,
      incomeChartData,
      expenseTrendData
    };
  };

  // Fetch bookings data
  useEffect(() => {
    const fetchBookings = async () => {
        try {
        setLoading(true);
        setError("");
        const data = await getAllBookings();
        setBookings(data || []);
      } catch (err) {
        setError(err.message || "Failed to load bookings data");
        console.error("Error fetching bookings:", err);
        } finally {
        setLoading(false);
        }
    };

    fetchBookings();
    }, []);

  // Fetch salary data
  const fetchSalaries = async () => {
    try {
      setSalaryLoading(true);
      const data = await PayrollAPI.listSalaries();
      setSalaries(data.items || []);
    } catch (err) {
      console.error("Error fetching salaries:", err);
    } finally {
      setSalaryLoading(false);
        }
    };

  // Fetch expenses data
  const fetchExpenses = async () => {
    try {
      const expensesData = await getAllExpenses();
      const transformedExpenses = (expensesData || []).map((expense) => ({
        id: expense._id,
        type: expense.type,
        recipientId: expense.recipientId._id || expense.recipientId,
        recipientName: expense.recipientName,
        amount: Number(expense.amount || 0),
        description: expense.description,
        category: expense.category,
        date: expense.date ? expense.date.split('T')[0] : ""
      }));
      setExpenses(transformedExpenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

    useEffect(() => {
    fetchSalaries();
    fetchExpenses();
    
    // Set up periodic refresh every 5 seconds for near real-time
    // const salaryInterval = setInterval(fetchSalaries, 5000);
    // const expenseInterval = setInterval(fetchExpenses, 5000);

    // Real-time socket updates
    const socket = io(process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:4000");
    socket.on("financeUpdate", () => {
      fetchSalaries();
      fetchExpenses();
    });
    
    // Refresh when tab becomes visible
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchSalaries();
        fetchExpenses();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    
    // Cleanup
    return () => { 
      // clearInterval(salaryInterval); 
      // clearInterval(expenseInterval); 
      document.removeEventListener('visibilitychange', onVisibility); 
      socket.disconnect(); 
    };
    }, []);

  // Refresh salary data (can be called when new salary is added)
  const refreshSalaryData = () => {
    fetchSalaries();
  };

  const handleDeleteSalary = async (id) => {
    if (!id) return;
    if (!window.confirm("Delete this salary?")) return;
    try {
      setDeletingSalaryId(id);
      // Optimistic UI
      const prev = salaries;
      setSalaries((list) => list.filter((s) => s._id !== id));
        try {
        await PayrollAPI.deleteSalary(id);
      } catch (err) {
        // Revert on failure
        setSalaries(prev);
        throw err;
      }
    } catch (err) {
      alert(err?.message || "Failed to delete salary");
    } finally {
      setDeletingSalaryId("");
      fetchSalaries();
    }
  };

  // Load real vehicles and expenses data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load vehicles
        const vehiclesData = await getAllVehicles();
        const transformedVehicles = vehiclesData.map((vehicle) => ({
          id: vehicle._id,
          name: `${vehicle.vehicleType}-${vehicle.numberPlate}`,
          type: vehicle.vehicleType,
          model: vehicle.vehicleModel,
          manufacturer: vehicle.manufacturer,
          capacity: vehicle.seatingCapacity,
          status: vehicle.currentCondition,
          numberPlate: vehicle.numberPlate
        }));
        setVehicles(transformedVehicles);

        // Load expenses
        const expensesData = await getAllExpenses();
        const transformedExpenses = expensesData.map((expense) => ({
          id: expense._id,
          type: expense.type,
          recipientId: expense.recipientId._id || expense.recipientId,
          recipientName: expense.recipientName,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          date: expense.date.split('T')[0] // Format date for display
        }));
        setExpenses(transformedExpenses);
      } catch (error) {
        console.error("Error loading data:", error);
        setVehicles([]);
        setExpenses([]);
      }
    };

    loadData();
  }, []);

  // Expense management functions
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const expenseData = {
        type: "vehicle",
        recipientId: expenseForm.recipientId,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        category: expenseForm.category,
        date: expenseForm.date
      };

      const newExpense = await createExpense(expenseData);
      
      // Transform the response to match our local format
      const transformedExpense = {
        id: newExpense._id,
        type: newExpense.type,
        recipientId: newExpense.recipientId._id || newExpense.recipientId,
        recipientName: newExpense.recipientName,
        amount: newExpense.amount,
        description: newExpense.description,
        category: newExpense.category,
        date: newExpense.date.split('T')[0]
      };

      setExpenses([transformedExpense, ...expenses]);
      resetExpenseForm();
      setShowExpenseModal(false);
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("Error creating expense. Please try again.");
    }
  };

  const handleExpenseDelete = async (id) => {
    const expense = expenses.find(e => e.id === id || e._id === id);
    if (!expense) return;
    if (!window.confirm("Delete this salary?")) return;
    try {
      await deleteExpense(expense.id || expense._id);
      setExpenses(expenses.filter(exp => (exp.id || exp._id) !== (expense.id || expense._id)));
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Error deleting expense. Please try again.");
    }
  };

  const confirmDelete = async () => {
    // Legacy path no longer used, kept for safety
    if (!expenseToDelete) return;
    try {
      await deleteExpense(expenseToDelete.id || expenseToDelete._id);
      setExpenses(expenses.filter(expense => (expense.id || expense._id) !== (expenseToDelete.id || expenseToDelete._id)));
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Error deleting expense. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
      setExpenseToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setExpenseToDelete(null);
  };

  // CRUD functions for expenses
  const handleExpenseEdit = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      type: "vehicle",
      recipientId: expense.recipientId.toString(),
      amount: expense.amount.toString(),
      description: expense.description,
      category: expense.category,
      date: expense.date
    });
    setShowEditExpenseModal(true);
  };

  const handleExpenseUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const expenseData = {
        type: "vehicle",
        recipientId: expenseForm.recipientId,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        category: expenseForm.category,
        date: expenseForm.date
      };

      const updatedExpense = await updateExpense(editingExpense.id || editingExpense._id, expenseData);
      
      // Transform the response to match our local format
      const transformedExpense = {
        id: updatedExpense._id,
        type: updatedExpense.type,
        recipientId: updatedExpense.recipientId._id || updatedExpense.recipientId,
        recipientName: updatedExpense.recipientName,
        amount: updatedExpense.amount,
        description: updatedExpense.description,
        category: updatedExpense.category,
        date: updatedExpense.date.split('T')[0]
      };

      setExpenses(expenses.map(expense => 
        (expense.id === (editingExpense.id || editingExpense._id) || expense._id === (editingExpense.id || editingExpense._id)) ? transformedExpense : expense
      ));
      
      resetExpenseForm();
      setEditingExpense(null);
      setShowEditExpenseModal(false);
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Error updating expense. Please try again.");
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      type: "vehicle",
      recipientId: "",
      amount: "",
      description: "",
      category: "",
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Refs to maintain focus
  const categoryRef = useRef(null);
  const amountRef = useRef(null);
  const descriptionRef = useRef(null);

  // Direct form handlers without useCallback to prevent re-render issues
  const handleFormChange = (field, value) => {
    setExpenseForm(prev => ({ ...prev, [field]: value }));
  };

  const handleVehicleChange = (e) => {
    setExpenseForm(prev => ({ ...prev, recipientId: e.target.value }));
  };

  const handleCategoryChange = (e) => {
    setExpenseForm(prev => ({ ...prev, category: e.target.value }));
  };

  const handleAmountChange = (e) => {
    setExpenseForm(prev => ({ ...prev, amount: e.target.value }));
  };

  const handleDateChange = (e) => {
    setExpenseForm(prev => ({ ...prev, date: e.target.value }));
  };

  const handleDescriptionChange = (e) => {
    setExpenseForm(prev => ({ ...prev, description: e.target.value }));
  };

  // Expense PDF download (Budget Allocations)
  const downloadExpensesPDF = () => {
    const doc = new jsPDF();
    
    // Add logo to header
    const logoUrl = '/src/Assets/TripLOGO.png';
    try {
      doc.addImage(logoUrl, 'PNG', 20, 15, 15, 15);
    } catch (error) {
      console.log('Logo not found, continuing without logo');
    }
    
    // Header with company info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(139, 92, 246); // Purple color
    doc.text("TripNest", 40, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Travel Management System", 40, 28);
    
    // Trip name (you can customize this based on your needs)
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Trip: All Active Trips", 40, 36);
    
    // Report title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("ALL MONEY ALLOCATIONS", 20, 48);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 58);

    let y = 70;
    doc.setFont("helvetica", "bold");
    doc.text("Type", 20, y);
    doc.text("Recipient", 50, y);
    doc.text("Category", 90, y);
    doc.text("Amount", 120, y);
    doc.text("Date", 150, y);
    doc.text("Description", 170, y);
    doc.line(20, y + 2, 200, y + 2);
    y += 10;
    doc.setFont("helvetica", "normal");
    let total = 0;
    if (expenses.length === 0) {
      doc.setFontSize(14);
      doc.setTextColor(200, 0, 0);
      doc.text("No budget allocations to display.", 20, y);
      doc.save(`all-money-allocations-${new Date().toISOString().split('T')[0]}.pdf`);
      return;
    }
    expenses.forEach((ex) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(ex.type === "employee" ? "Employee" : "Vehicle", 20, y);
      doc.text(String(ex.recipientName || "-"), 50, y);
      doc.text(String(ex.category || "-"), 90, y);
      doc.text(`$${Number(ex.amount || 0).toLocaleString()}`, 120, y);
      doc.text(String(ex.date || ""), 150, y);
      doc.text(String(ex.description || "-"), 170, y, { maxWidth: 30 });
      total += Number(ex.amount || 0);
      y += 8;
    });
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Total Allocation:", 100, y);
    doc.text(`$${total.toLocaleString()}`, 120, y);
    
    // Footer with Finance Manager signature
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 40;
    
    // Signature line
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Finance Manager Signature:", 20, footerY);
    doc.line(20, footerY + 5, 80, footerY + 5);
    
    // Date line
    doc.text("Date:", 100, footerY);
    doc.line(100, footerY + 5, 150, footerY + 5);
    
    // Company info
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("TripNest Travel Management System", 20, footerY + 15);
    doc.text("283/3/A New Kandy Road, Malabe, Colombo, Sri Lanka", 20, footerY + 20);
    doc.text("Email: tripnest@gmail.com | Phone: +94 761 234 567", 20, footerY + 25);
    
    doc.save(`all-money-allocations-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // PDF Download function
  const downloadIncomePDF = () => {
    const confirmedBookings = bookings.filter(booking => 
      booking.status === "confirmed" || booking.status === "created"
    );
    
    const totalIncome = confirmedBookings.reduce((sum, booking) => 
      sum + (booking.pricing?.total || 0), 0
    );

    // Create new PDF document
    const doc = new jsPDF();
    
    // Add logo to header
    const logoUrl = '/src/Assets/TripLOGO.png';
    try {
      doc.addImage(logoUrl, 'PNG', 20, 15, 15, 15);
    } catch (error) {
      console.log('Logo not found, continuing without logo');
    }
    
    // Header with company info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(139, 92, 246); // Purple color
    doc.text("TripNest", 40, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Travel Management System", 40, 28);
    
    // Trip name (you can customize this based on your needs)
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Trip: All Active Trips", 40, 36);
    
    // Report title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(139, 92, 246); // Purple color
    doc.text("INCOME REPORT", 20, 48);
    
    // Date
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 58);
    
    // Summary section
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("SUMMARY", 20, 75);
    
    doc.setFontSize(12);
    doc.text(`Total Income: $${totalIncome.toLocaleString()}`, 30, 90);
    doc.text(`Total Bookings: ${confirmedBookings.length}`, 30, 105);
    
    // Income sources section
    doc.setFontSize(16);
    doc.text("INCOME SOURCES", 20, 125);
    
    doc.setFontSize(10);
    let yPosition = 140;
    
    // Table headers
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Package Name", 20, yPosition);
    doc.text("Amount", 100, yPosition);
    doc.text("Date", 140, yPosition);
    doc.text("Customer", 170, yPosition);
    
    yPosition += 10;
    
    // Draw line under headers
    doc.line(20, yPosition - 5, 190, yPosition - 5);
    
    // Table data
    doc.setFont("helvetica", "normal");
    confirmedBookings.slice(0, 15).forEach((booking, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      const packageName = (booking.packageSnapshot?.name || `Package ${index + 1}`).substring(0, 25);
      const amount = `$${(booking.pricing?.total || 0).toLocaleString()}`;
      const date = new Date(booking.createdAt).toLocaleDateString();
      const customer = `${booking.customer?.firstName || ''} ${booking.customer?.lastName || ''}`.substring(0, 15);
      
      doc.text(packageName, 20, yPosition);
      doc.text(amount, 100, yPosition);
      doc.text(date, 140, yPosition);
      doc.text(customer, 170, yPosition);
      
      yPosition += 8;
    });
    
    // Footer with Finance Manager signature
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 40;
    
    // Signature line
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Finance Manager Signature:", 20, footerY);
    doc.line(20, footerY + 5, 80, footerY + 5);
    
    // Date line
    doc.text("Date:", 100, footerY);
    doc.line(100, footerY + 5, 150, footerY + 5);
    
    // Company info
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("TripNest Travel Management System", 20, footerY + 15);
    doc.text("283/3/A New Kandy Road, Malabe, Colombo, Sri Lanka", 20, footerY + 20);
    doc.text("Email: tripnest@gmail.com | Phone: +94 761 234 567", 20, footerY + 25);
    
    // Save the PDF
    doc.save(`income-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Payroll PDF Download function
  const downloadPayrollPDF = () => {
    // Sort and get the latest 15 salary updates
    const recentSalaries = salaries
      .sort((a, b) => new Date(b.effectiveFrom) - new Date(a.effectiveFrom))
      .slice(0, 15);

    // Create new PDF document
    const doc = new jsPDF();
    
    // Add logo to header
    const logoUrl = '/src/Assets/TripLOGO.png';
    try {
      doc.addImage(logoUrl, 'PNG', 20, 15, 15, 15);
    } catch (error) {
      console.log('Logo not found, continuing without logo');
    }
    
    // Header with company info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(139, 92, 246); // Purple color
    doc.text("TripNest", 40, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Travel Management System", 40, 28);
    
    // Trip name (you can customize this based on your needs)
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Trip: All Active Trips", 40, 36);
    
    // Report title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(92, 184, 92); // Green color
    doc.text("PAYROLL REPORT", 20, 48);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 58);

    // Summary section
    doc.setFontSize(16);
    doc.text("SUMMARY", 20, 75);
    doc.setFontSize(12);
    doc.text(`Total Employees: ${payrollStats.totalEmployees}`, 30, 90);
    doc.text(`Monthly Payroll: $${payrollStats.monthlyPayroll.toLocaleString()}`, 30, 105);
    doc.text(`Pending Reviews: ${payrollStats.pendingReviews}`, 30, 120);
    doc.text(`Avg. Salary: $${payrollStats.avgSalary.toLocaleString()}`, 30, 135);

    // Payroll details section
    doc.setFontSize(16);
    doc.text("RECENT SALARY UPDATES", 20, 155);
    doc.setFontSize(10);
    let yPosition = 160;
    // Table headers
    doc.setFont("helvetica", "bold");
    doc.text("Employee", 20, yPosition);
    doc.text("Type", 70, yPosition);
    doc.text("Amount", 100, yPosition);
    doc.text("Effective From", 130, yPosition);
    doc.text("Status", 170, yPosition);
    yPosition += 10;
    doc.line(20, yPosition - 5, 200, yPosition - 5);
    doc.setFont("helvetica", "normal");
    // Table data
    recentSalaries.forEach((salary, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      const employee = salary.employee;
      const employeeName = (employee && (employee.fullName || employee.name)) || 'Unknown';
      const type = employee?.type ? (employee.type.charAt(0).toUpperCase() + employee.type.slice(1)) : 'Employee';
      const totalAmount = salary.base + (salary.components?.reduce((sum, comp) => sum + (comp.amount || (comp.percentageOfBase ? (salary.base * comp.percentageOfBase / 100) : 0)), 0) || 0);
      const effectiveFrom = new Date(salary.effectiveFrom).toLocaleDateString();
      const status = new Date(salary.effectiveFrom) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'New hire' : 'Updated';
      doc.text(employeeName, 20, yPosition);
      doc.text(type, 70, yPosition);
      doc.text(`$${totalAmount.toLocaleString()}`, 100, yPosition);
      doc.text(effectiveFrom, 130, yPosition);
      doc.text(status, 170, yPosition);
      yPosition += 8;
    });
    // Footer with Finance Manager signature
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 40;
    
    // Signature line
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Finance Manager Signature:", 20, footerY);
    doc.line(20, footerY + 5, 80, footerY + 5);
    
    // Date line
    doc.text("Date:", 100, footerY);
    doc.line(100, footerY + 5, 150, footerY + 5);
    
    // Company info
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("TripNest Travel Management System", 20, footerY + 15);
    doc.text("283/3/A New Kandy Road, Malabe, Colombo, Sri Lanka", 20, footerY + 20);
    doc.text("Email: tripnest@gmail.com | Phone: +94 761 234 567", 20, footerY + 25);
    
    doc.save(`payroll-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const financialData = calculateFinancialData();
  const summaryData = {
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: payrollTotal
  };
  const recentIncomeTotal = useMemo(() => {
    // Sum of the exact list shown in the Income Sources section
    return (financialData.incomeSources || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [financialData.incomeSources]);
  summaryData.totalIncome = recentIncomeTotal;
  summaryData.totalBalance = recentIncomeTotal - payrollTotal;

  // Compute recent combined payroll + vehicle items for dashboard
  const recentPayrollItems = useMemo(() => {
    const vehiclePayments = (expenses || []).filter((e) => (e.type === "vehicle") || ((e.category || "").toLowerCase() === "vehicle payment"));
    const normalized = [
      ...salaries.map((s) => ({
        kind: "salary",
        id: s._id,
        name: (s.employee && (s.employee.fullName || s.employee.name)) || "Employee",
        date: new Date(s.effectiveFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        amount: computeNetAmount(s),
        color: "text-red-500",
        icon: Briefcase
      })),
      ...vehiclePayments.map((v) => ({
        kind: "vehicle",
        id: v.id,
        name: v.recipientName || "Vehicle",
        date: v.date ? new Date(v.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "",
        amount: Number(v.amount || 0),
        color: "text-red-500",
        icon: Bus
      }))
    ]
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    })
    .slice(0, 5);
    return normalized;
  }, [salaries, expenses]);

  // Tax calculation helper functions
  const calculateBookingTax = (booking) => {
    const amount = booking.pricing?.total || 0;
    const serviceTaxRate = 0.18; // 18% service tax
    const incomeTaxRate = 0.10; // 10% income tax on revenue
    return {
      serviceTax: amount * serviceTaxRate,
      incomeTax: amount * incomeTaxRate,
      total: amount * (serviceTaxRate + incomeTaxRate)
    };
  };

  const calculatePayrollTax = (amount) => {
    const payrollTaxRate = 0.08; // 8% company payroll tax (what company pays for employees/vehicles)
    return {
      payrollTax: amount * payrollTaxRate,
      socialSecurity: 0, // No social security for this calculation
      total: amount * payrollTaxRate
    };
  };

  // Use real data from bookings
  const recentTransactions = financialData.recentTransactions;
  const incomeSources = financialData.incomeSources;
  const incomeChartData = financialData.incomeChartData;
  const expenseTrendData = financialData.expenseTrendData;

  // Recent tax transactions
  const recentTaxTransactions = React.useMemo(() => {
    const confirmedBookings = bookings.filter(booking => 
      booking.status === "confirmed" || booking.status === "created"
    );
    
    // Create booking tax records
    const bookingTaxes = confirmedBookings.slice(0, 2).map(booking => {
      const taxes = calculateBookingTax(booking);
      return {
        id: `booking-${booking._id}`,
        name: `${booking.packageSnapshot?.name || "Package"} - Tax`,
        date: new Date(booking.createdAt).toLocaleDateString(),
        amount: taxes.total,
        type: "Booking Tax",
        icon: Plane,
        color: "text-blue-500"
      };
    });

    // Create salary tax records
    const salaryTaxes = salaries.slice(0, 2).map(salary => {
      const amount = computeNetAmount(salary);
      const taxes = calculatePayrollTax(amount);
      return {
        id: `salary-${salary._id}`,
        name: `${(salary.employee && (salary.employee.fullName || salary.employee.name)) || "Employee"} - Tax`,
        date: new Date(salary.effectiveFrom).toLocaleDateString(),
        amount: taxes.total,
        type: "Salary Tax",
        icon: Briefcase,
        color: "text-green-500"
      };
    });

    // Create vehicle tax records
    const vehicleTaxes = expenses.filter(e => e.type === "vehicle").slice(0, 1).map(expense => {
      const amount = Number(expense.amount || 0);
      const taxes = calculatePayrollTax(amount);
      return {
        id: `vehicle-${expense.id}`,
        name: `${expense.recipientName || "Vehicle"} - Tax`,
        date: expense.date ? new Date(expense.date).toLocaleDateString() : "",
        amount: taxes.total,
        type: "Vehicle Tax",
        icon: Bus,
        color: "text-purple-500"
      };
    });

    return [...bookingTaxes, ...salaryTaxes, ...vehicleTaxes]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [bookings, salaries, expenses]);

  const financialOverviewData = [
    { name: "Total Balance", value: summaryData.totalBalance, color: "#8B5CF6" },
    { name: "Total Expenses", value: summaryData.totalExpenses, color: "#EF4444" },
    { name: "Total Income", value: summaryData.totalIncome, color: "#F97316" }
  ];

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Grid3X3 },
    { id: "income", label: "Income", icon: Wallet },
    { id: "payroll", label: "Payroll", icon: Briefcase },
    { id: "tax", label: "Tax", icon: Receipt }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">${summaryData.totalBalance.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Income</p>
              <p className="text-2xl font-bold text-gray-900">${summaryData.totalIncome.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">${summaryData.totalExpenses.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Finance Overview (Left) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={financialOverviewData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {financialOverviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">${summaryData.totalBalance.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {financialOverviewData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
 
        {/* Recent Bookings (Right) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              <p className="text-sm text-gray-600">Latest customer payments</p>
            </div>
            <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              See All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {recentTransactions.slice(0, 4).map((transaction) => {
              const IconComponent = transaction.icon;
              return (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.color.replace('text-', 'bg-').replace('-500', '-100')}`}>
                      <IconComponent className={`w-5 h-5 ${transaction.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{transaction.name}</p>
                      <p className="text-xs text-gray-500">{transaction.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {transaction.amount < 0 ? '-' : '+'} ${Math.abs(transaction.amount).toLocaleString()}
                    </span>
                    {transaction.amount < 0 ? (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    ) : (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Payroll and Taxes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Payroll (Left) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Salary Updates & Vehicle Payments</h3>
            <p className="text-sm text-gray-600">Latest payouts to employees and vehicles</p>
          </div>
            <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              See All <ArrowRight className="w-4 h-4" />
            </button>
        </div>
        <div className="space-y-4">
            {recentPayrollItems.slice(0, 5).map((item) => {
            const IconComponent = item.icon;
            return (
              <div key={`${item.kind}-${item.id}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.kind === 'vehicle' ? 'bg-green-100' : 'bg-blue-100'}`}>
                    <IconComponent className={`w-5 h-5 ${item.kind === 'vehicle' ? 'text-green-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-red-600">- ${Number(item.amount || 0).toLocaleString()}</span>
                    <TrendingDown className="w-3 h-3 text-red-500" />
                </div>
              </div>
            );
          })}
          {recentPayrollItems.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">No payouts yet.</div>
            )}
          </div>
        </div>

        {/* Recent Taxes (Right) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Taxes</h3>
              <p className="text-sm text-gray-600">Latest tax calculations</p>
            </div>
            <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              See All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {recentTaxTransactions.length > 0 ? recentTaxTransactions.map((tax) => {
              const IconComponent = tax.icon;
              return (
                <div key={tax.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tax.color.replace('text-', 'bg-').replace('-500', '-100')}`}>
                      <IconComponent className={`w-5 h-5 ${tax.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{tax.name}</p>
                      <p className="text-xs text-gray-500">{tax.type} • {tax.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-orange-600">
                      ${tax.amount.toFixed(2)}
                    </span>
                    <Receipt className="w-3 h-3 text-orange-500" />
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                <Receipt className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No recent taxes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderIncome = () => (
    <div className="space-y-6">
      {/* Income Overview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Income Overview</h3>
            <p className="text-sm text-gray-600">Track your earnings over time and analyze your income trends.</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
              <Bar dataKey="amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Income Sources */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Income Sources</h3>
            <p className="text-sm text-gray-600">Revenue from customer bookings and payments</p>
          </div>
          <button 
            onClick={downloadIncomePDF}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
          {incomeSources.map((source) => {
            const IconComponent = source.icon;
    return (
              <div key={source.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${source.color.replace('text-', 'bg-').replace('-500', '-100').replace('-600', '-100')}`}>
                    <IconComponent className={`w-5 h-5 ${source.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{source.name}</p>
                    <p className="text-sm text-gray-500">{source.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-green-600">
                    + ${source.amount.toLocaleString()}
                  </span>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderExpense = () => (
    <div className="space-y-6">
      {/* Expense Overview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Expense Overview</h3>
            <p className="text-sm text-gray-600">Track your spending trends over time and gain insights into where your money goes.</p>
          </div>
          <button 
            onClick={() => {
              setExpenseForm({
                type: "vehicle",
                recipientId: "",
                amount: "",
                description: "",
                category: "",
                date: new Date().toISOString().split('T')[0]
              });
              setShowExpenseModal(true);
            }}
            className="bg-[#042391] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#042391]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={expenseTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
              <Area type="monotone" dataKey="amount" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Expenses */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Budget Allocations</h3>
          <button 
            onClick={downloadExpensesPDF} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={expenses.length === 0}
            title={expenses.length === 0 ? 'No budget allocations to download' : ''}
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  expense.type === "employee" ? "bg-blue-100" : "bg-green-100"
                }`}>
                  {expense.type === "employee" ? (
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Bus className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{expense.recipientName}</p>
                  <p className="text-sm text-gray-500">{expense.description}</p>
                  <p className="text-xs text-gray-400">{expense.category} • {expense.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-red-600">
                  - ${expense.amount.toLocaleString()}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleExpenseEdit(expense)}
                    className="text-blue-500 hover:text-blue-700 p-1"
                    title="Edit expense"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleExpenseDelete(expense.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete expense"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No budget allocations yet.</p>
              <p className="text-sm">Click "Add Expense" to allocate budget to employees or vehicles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Expense modal (simple add-only to fix 1-char issue)
  const ExpenseModal = () => {
    if (!showExpenseModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={() => setShowExpenseModal(false)} />
        <div className="relative bg-white w-full max-w-2xl mx-4 rounded-2xl shadow-xl">
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Add Expense</h3>
            <button onClick={() => setShowExpenseModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <form onSubmit={handleExpenseSubmit} className="p-6 grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Vehicle</label>
                <select 
                  key="vehicle-select"
                  value={expenseForm.recipientId} 
                  onChange={handleVehicleChange} 
                  className="w-full rounded-lg border border-[#042391] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#042391]"
                >
                  <option value="">Select vehicle…</option>
                  {vehicles.map((v)=>(<option key={v.id} value={v.id}>{v.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Category</label>
                <input 
                  key="category-input"
                  ref={categoryRef}
                  type="text"
                  value={expenseForm.category} 
                  onChange={handleCategoryChange} 
                  placeholder="Rent, Groceries, etc" 
                  className="w-full rounded-lg border border-[#042391] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#042391]" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Amount</label>
                <input 
                  key="amount-input"
                  ref={amountRef}
                  type="number"
                  step="0.01"
                  value={expenseForm.amount} 
                  onChange={handleAmountChange} 
                  className="w-full rounded-lg border border-[#042391] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#042391]" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Date</label>
                <input 
                  key="date-input"
                  type="date" 
                  value={expenseForm.date} 
                  onChange={handleDateChange} 
                  className="w-full rounded-lg border border-[#042391] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#042391]" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <textarea 
                  key="description-input"
                  ref={descriptionRef}
                  value={expenseForm.description} 
                  onChange={handleDescriptionChange} 
                  placeholder="Optional" 
                  rows="3"
                  className="w-full rounded-lg border border-[#042391] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#042391] resize-none" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={()=>setShowExpenseModal(false)} className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" className="rounded-full bg-[#042391] text-white px-6 py-2 text-sm font-medium hover:bg-[#042391]/90 focus:outline-none focus:ring-2 focus:ring-[#042391]">Add Expense</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Edit Expense Modal
  const EditExpenseModal = () => {
    if (!showEditExpenseModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={() => {
          setShowEditExpenseModal(false);
          setEditingExpense(null);
          resetExpenseForm();
        }} />
        <div className="relative bg-white w-full max-w-2xl mx-4 rounded-2xl shadow-xl">
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Edit Expense</h3>
            <button onClick={() => {
              setShowEditExpenseModal(false);
              setEditingExpense(null);
              resetExpenseForm();
            }} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <form onSubmit={handleExpenseUpdate} className="p-6 grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Vehicle</label>
                <select 
                  value={expenseForm.recipientId} 
                  onChange={(e) => handleFormChange('recipientId', e.target.value)} 
                  className="w-full rounded-lg border border-[#042391] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#042391]"
                >
                  <option value="">Select vehicle…</option>
                  {vehicles.map((v)=>(<option key={v.id} value={v.id}>{v.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Category</label>
                <input 
                  type="text"
                  value={expenseForm.category} 
                  onChange={(e) => handleFormChange('category', e.target.value)} 
                  placeholder="Rent, Groceries, etc" 
                  className="w-full rounded-lg border border-[#042391] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#042391]" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Amount</label>
                <input 
                  type="number"
                  step="0.01"
                  value={expenseForm.amount} 
                  onChange={(e) => handleFormChange('amount', e.target.value)} 
                  className="w-full rounded-lg border border-[#042391] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#042391]" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Date</label>
                <input 
                  type="date" 
                  value={expenseForm.date} 
                  onChange={(e) => handleFormChange('date', e.target.value)} 
                  className="w-full rounded-lg border border-[#042391] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#042391]" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <textarea 
                  value={expenseForm.description} 
                  onChange={(e) => handleFormChange('description', e.target.value)} 
                  placeholder="Optional" 
                  rows="3"
                  className="w-full rounded-lg border border-[#042391] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#042391] resize-none" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => {
                  setShowEditExpenseModal(false);
                  setEditingExpense(null);
                  resetExpenseForm();
                }} 
                className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="rounded-full bg-[#042391] text-white px-6 py-2 text-sm font-medium hover:bg-[#042391]/90 focus:outline-none focus:ring-2 focus:ring-[#042391]"
              >
                Update Expense
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal
  const DeleteConfirmModal = () => {
    if (!showDeleteConfirm || !expenseToDelete) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={cancelDelete} />
        <div className="relative bg-white w-full max-w-md mx-4 rounded-2xl shadow-xl">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Expense</h3>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{expenseToDelete.recipientName}</span> - 
                <span className="text-red-600 font-semibold"> ${expenseToDelete.amount.toLocaleString()}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {expenseToDelete.category} • {expenseToDelete.date}
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPayroll = () => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employee/Vehicle Payroll Management</h1>
            <Link
            to="/admin/payroll/salaries/new"
          className="rounded-full bg-[#042391] text-white px-5 py-2 text-sm font-medium hover:bg-[#042391]/90 flex items-center gap-2"
            >
          <Plus className="w-4 h-4" />
          New Salary
            </Link>
        </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Payroll Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Employees</p>
                <p className="text-2xl font-bold text-blue-900">{payrollStats.totalEmployees}</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Monthly Payroll</p>
                <p className="text-2xl font-bold text-green-900">${payrollStats.monthlyPayroll.toLocaleString()}</p>
              </div>
              <Wallet className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-orange-900">{payrollStats.pendingReviews}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Avg. Salary</p>
                <p className="text-2xl font-bold text-purple-900">${payrollStats.avgSalary.toLocaleString()}</p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
            </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Salary Updates & Vehicle Payments</h3>
          <button
            onClick={downloadPayrollPDF}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
        {salaryLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading salary updates...</span>
            </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              // Normalize salaries and vehicle payments then sort desc by date
              const vehiclePayments = (expenses || []).filter((e) => {
                const cat = (e.category || "").toLowerCase();
                return (e.type === "vehicle") || cat === "vehicle payment";
              });
              const normalized = [
                ...salaries.map((s) => ({
                  kind: "salary",
                  id: s._id,
                  name: (s.employee && (s.employee.fullName || s.employee.name)) || "Unknown Employee",
                  subtype: s.employee?.type ? s.employee.type : "employee",
                  amount: computeNetAmount(s),
                  date: new Date(s.effectiveFrom).getTime(),
                  dateLabel: new Date(s.effectiveFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                  isNew: new Date(s.effectiveFrom) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                })),
                ...vehiclePayments.map((v) => ({
                  kind: "vehicle",
                  id: v.id,
                  name: v.recipientName || "Vehicle",
                  subtype: "vehicle",
                  amount: Number(v.amount || 0),
                  date: new Date(v.date || Date.now()).getTime(),
                  dateLabel: v.date ? new Date(v.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "",
                  isNew: true,
                }))
              ]
              .sort((a, b) => b.date - a.date)
              .slice(0, 15);

              return normalized.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${item.kind === 'vehicle' ? 'bg-green-100' : (item.isNew ? 'bg-green-100' : 'bg-blue-100')} rounded-full flex items-center justify-center`}>
                      {item.kind === 'vehicle' ? (
                        <Bus className="w-5 h-5 text-green-600" />
                      ) : (
                        <Briefcase className={`w-5 h-5 ${item.isNew ? 'text-green-600' : 'text-blue-600'}`} />)
                      }
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.name} - {item.kind === 'vehicle' ? 'Vehicle Payment' : (item.subtype ? item.subtype.charAt(0).toUpperCase() + item.subtype.slice(1) : 'Employee')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.kind === 'vehicle' ? 'Vehicle payment created' : (item.isNew ? 'New salary created' : 'Salary updated')} - {item.dateLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${item.amount.toLocaleString()}/trip</p>
                      <p className={`text-sm ${item.kind === 'vehicle' ? 'text-emerald-700' : (item.isNew ? 'text-blue-600' : 'text-green-600')}`}>
                        {item.kind === 'vehicle' ? 'Vehicle payment' : (item.isNew ? 'New hire' : 'Updated')}
                      </p>
                    </div>
                    {item.kind === 'salary' ? (
                      paidMap[`salary:${item.id}`] ? (
                        <span className="px-3 py-1.5 text-sm rounded-lg bg-green-100 text-green-700 font-medium">Paid</span>
                      ) : (
                        <>
                          <Link
                            to={`/admin/payroll/salaries/${item.id}/edit`}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100"
                          >Edit</Link>
                          <button
                            onClick={() => handleDeleteSalary(item.id)}
                            disabled={deletingSalaryId === item.id}
                            className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >{deletingSalaryId === item.id ? 'Deleting…' : 'Delete'}</button>
                          <button
                            onClick={() => setPaidMap((m) => ({ ...m, [`salary:${item.id}`]: true }))}
                            className="px-3 py-1.5 text-sm rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          >Payment</button>
                        </>
                      )
                    ) : (
                      paidMap[`vehicle:${item.id}`] ? (
                        <span className="px-3 py-1.5 text-sm rounded-lg bg-green-100 text-green-700 font-medium">Paid</span>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              const exp = (expenses || []).find(e => (e.id || e._id) === item.id);
                              if (!exp) return;
                              // Navigate to the unified SalaryCreate form prefilled for vehicle
                              const params = new URLSearchParams({
                                vehicleId: String(exp.recipientId),
                                amount: String(exp.amount || 0),
                                date: String(exp.date || ""),
                                expenseId: String(exp.id || exp._id || "")
                              });
                              navigate(`/admin/payroll/salaries/new?${params.toString()}`);
                            }}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100"
                          >Edit</button>
                          <button
                            onClick={() => {
                              const exp = (expenses || []).find(e => (e.id || e._id) === item.id);
                              if (exp) handleExpenseDelete(exp.id || exp._id);
                            }}
                            className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                          >Delete</button>
                          <button
                            onClick={() => setPaidMap((m) => ({ ...m, [`vehicle:${item.id}`]: true }))}
                            className="px-3 py-1.5 text-sm rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          >Payment</button>
                        </>
                      )
                    )}
                  </div>
                </div>
              ));
            })()}
            {salaries.length === 0 && ((expenses || []).filter((e) => (e.type === "vehicle") || (e.category || "").toLowerCase() === "vehicle payment").length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No salary updates or vehicle payments found</p>
              </div>
            )}
            </div>
        )}
        </div>
    </div>
  );

  // Tax PDF Download function
  const downloadTaxPDF = () => {
    // Calculate real-time tax data from bookings and expenses
    const confirmedBookings = bookings.filter(booking => 
      booking.status === "confirmed" || booking.status === "created"
    );
    
    // Calculate total taxes from bookings
    let totalBookingTax = 0;
    let totalServiceTax = 0;
    let totalIncomeTax = 0;
    
    const bookingTaxRecords = confirmedBookings.map(booking => {
      const taxes = calculateBookingTax(booking);
      totalBookingTax += taxes.total;
      totalServiceTax += taxes.serviceTax;
      totalIncomeTax += taxes.incomeTax;
      
      return {
        id: booking._id,
        type: "Booking Tax",
        name: booking.packageSnapshot?.name || "Package Booking",
        customer: `${booking.customer?.firstName || ''} ${booking.customer?.lastName || ''}`.trim(),
        amount: booking.pricing?.total || 0,
        serviceTax: taxes.serviceTax,
        incomeTax: taxes.incomeTax,
        totalTax: taxes.total,
        date: new Date(booking.createdAt).toLocaleDateString(),
        status: "Calculated"
      };
    });

    // Calculate payroll taxes from salaries
    let totalPayrollTax = 0;
    const salaryTaxRecords = salaries.map(salary => {
      const amount = computeNetAmount(salary);
      const taxes = calculatePayrollTax(amount);
      totalPayrollTax += taxes.total;
      
      return {
        id: salary._id,
        type: "Salary Tax",
        name: (salary.employee && (salary.employee.fullName || salary.employee.name)) || "Employee",
        employeeType: salary.employee?.type || "employee",
        amount: amount,
        payrollTax: taxes.payrollTax,
        totalTax: taxes.total,
        date: new Date(salary.effectiveFrom).toLocaleDateString(),
        status: "Calculated"
      };
    });

    // Calculate vehicle expense taxes
    let totalVehicleTax = 0;
    const vehicleTaxRecords = expenses.filter(expense => expense.type === "vehicle").map(expense => {
      const amount = Number(expense.amount || 0);
      const taxes = calculatePayrollTax(amount);
      totalVehicleTax += taxes.total;
      
      return {
        id: expense.id,
        type: "Vehicle Tax",
        name: expense.recipientName || "Vehicle Expense",
        category: expense.category,
        amount: amount,
        payrollTax: taxes.payrollTax,
        totalTax: taxes.total,
        date: expense.date ? new Date(expense.date).toLocaleDateString() : "",
        status: "Calculated"
      };
    });

    // Combine all tax records
    const allTaxRecords = [...bookingTaxRecords, ...salaryTaxRecords, ...vehicleTaxRecords]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalTaxLiability = totalBookingTax + totalPayrollTax + totalVehicleTax;

    // Create new PDF document
    const doc = new jsPDF();
    
    // Add logo to header
    const logoUrl = '/src/Assets/TripLOGO.png';
    try {
      doc.addImage(logoUrl, 'PNG', 20, 15, 15, 15);
    } catch (error) {
      console.log('Logo not found, continuing without logo');
    }
    
    // Header with company info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(139, 92, 246); // Purple color
    doc.text("TripNest", 40, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Travel Management System", 40, 28);
    
    // Trip name
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Trip: All Active Trips", 40, 36);
    
    // Report title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(220, 38, 127); // Pink color for tax report
    doc.text("COMPREHENSIVE TAX REPORT", 20, 48);
    
    // Date
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 58);
    
    // Summary section
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("TAX SUMMARY", 20, 75);
    
    doc.setFontSize(12);
    doc.text(`Service Tax (18%): $${totalServiceTax.toLocaleString()}`, 30, 90);
    doc.text(`Income Tax (10%): $${totalIncomeTax.toLocaleString()}`, 30, 105);
    doc.text(`Company Payroll Tax (8%): $${(totalPayrollTax + totalVehicleTax).toLocaleString()}`, 30, 120);
    doc.text(`Total Tax Liability: $${totalTaxLiability.toLocaleString()}`, 30, 135);
    doc.text(`Total Records: ${allTaxRecords.length}`, 30, 150);
    
    // Tax records section
    doc.setFontSize(16);
    doc.text("DETAILED TAX RECORDS", 20, 170);
    
    doc.setFontSize(9);
    let yPosition = 185;
    
    // Table headers
    doc.setFont("helvetica", "bold");
    doc.text("Type", 20, yPosition);
    doc.text("Description", 45, yPosition);
    doc.text("Amount", 100, yPosition);
    doc.text("Tax", 125, yPosition);
    doc.text("Net", 145, yPosition);
    doc.text("Date", 165, yPosition);
    
    yPosition += 10;
    doc.line(20, yPosition - 5, 190, yPosition - 5);
    
    // Table data
    doc.setFont("helvetica", "normal");
    allTaxRecords.slice(0, 25).forEach((record) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
        // Repeat headers on new page
        doc.setFont("helvetica", "bold");
        doc.text("Type", 20, yPosition);
        doc.text("Description", 45, yPosition);
        doc.text("Amount", 100, yPosition);
        doc.text("Tax", 125, yPosition);
        doc.text("Net", 145, yPosition);
        doc.text("Date", 165, yPosition);
        yPosition += 10;
        doc.line(20, yPosition - 5, 190, yPosition - 5);
        doc.setFont("helvetica", "normal");
      }
      
      const type = record.type === "Booking Tax" ? "Booking" : 
                   record.type === "Salary Tax" ? "Salary" : "Vehicle";
      const description = record.name.substring(0, 15);
      const amount = `$${record.amount.toLocaleString()}`;
      const tax = `$${record.totalTax.toFixed(2)}`;
      const net = record.type === "Booking Tax" ? "-" : `$${(record.amount - record.totalTax).toFixed(2)}`;
      const date = record.date;
      
      doc.text(type, 20, yPosition);
      doc.text(description, 45, yPosition);
      doc.text(amount, 100, yPosition);
      doc.text(tax, 125, yPosition);
      doc.text(net, 145, yPosition);
      doc.text(date, 165, yPosition);
      
      yPosition += 7;
    });
    
    // Footer with Finance Manager signature
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 40;
    
    // Signature line
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Finance Manager Signature:", 20, footerY);
    doc.line(20, footerY + 5, 80, footerY + 5);
    
    // Date line
    doc.text("Date:", 100, footerY);
    doc.line(100, footerY + 5, 150, footerY + 5);
    
    // Company info
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("TripNest Travel Management System", 20, footerY + 15);
    doc.text("283/3/A New Kandy Road, Malabe, Colombo, Sri Lanka", 20, footerY + 20);
    doc.text("Email: tripnest@gmail.com | Phone: +94 761 234 567", 20, footerY + 25);
    
    // Save the PDF
    doc.save(`comprehensive-tax-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const renderTax = () => {
    // Calculate real-time tax data from bookings and expenses
    const confirmedBookings = bookings.filter(booking => 
      booking.status === "confirmed" || booking.status === "created"
    );
    
    // Calculate total taxes from bookings
    let totalBookingTax = 0;
    let totalServiceTax = 0;
    let totalIncomeTax = 0;
    
    const bookingTaxRecords = confirmedBookings.map(booking => {
      const taxes = calculateBookingTax(booking);
      totalBookingTax += taxes.total;
      totalServiceTax += taxes.serviceTax;
      totalIncomeTax += taxes.incomeTax;
      
      return {
        id: booking._id,
        type: "Booking Tax",
        name: booking.packageSnapshot?.name || "Package Booking",
        customer: `${booking.customer?.firstName || ''} ${booking.customer?.lastName || ''}`.trim(),
        amount: booking.pricing?.total || 0,
        serviceTax: taxes.serviceTax,
        incomeTax: taxes.incomeTax,
        totalTax: taxes.total,
        date: new Date(booking.createdAt).toLocaleDateString(),
        status: "Calculated"
      };
    });

    // Calculate payroll taxes from salaries
    let totalPayrollTax = 0;
    const salaryTaxRecords = salaries.map(salary => {
      const amount = computeNetAmount(salary);
      const taxes = calculatePayrollTax(amount);
      totalPayrollTax += taxes.total;
      
      return {
        id: salary._id,
        type: "Salary Tax",
        name: (salary.employee && (salary.employee.fullName || salary.employee.name)) || "Employee",
        employeeType: salary.employee?.type || "employee",
        amount: amount,
        payrollTax: taxes.payrollTax,
        socialSecurity: taxes.socialSecurity,
        totalTax: taxes.total,
        date: new Date(salary.effectiveFrom).toLocaleDateString(),
        status: "Calculated"
      };
    });

    // Calculate vehicle expense taxes
    let totalVehicleTax = 0;
    const vehicleTaxRecords = expenses.filter(expense => expense.type === "vehicle").map(expense => {
      const amount = Number(expense.amount || 0);
      const taxes = calculatePayrollTax(amount);
      totalVehicleTax += taxes.total;
      
      return {
        id: expense.id,
        type: "Vehicle Tax",
        name: expense.recipientName || "Vehicle Expense",
        category: expense.category,
        amount: amount,
        payrollTax: taxes.payrollTax,
        socialSecurity: taxes.socialSecurity,
        totalTax: taxes.total,
        date: expense.date ? new Date(expense.date).toLocaleDateString() : "",
        status: "Calculated"
      };
    });

    // Combine all tax records and sort by date
    const allTaxRecords = [...bookingTaxRecords, ...salaryTaxRecords, ...vehicleTaxRecords]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 15); // Show latest 15 records

    // Filter tax records based on search query
    const filteredTaxRecords = allTaxRecords.filter((record) => {
      const searchTerm = taxSearchQuery.trim().toLowerCase();
      if (!searchTerm) return true;
      return (
        (record.name || "").toLowerCase().includes(searchTerm) ||
        (record.type || "").toLowerCase().includes(searchTerm) ||
        (record.customer || "").toLowerCase().includes(searchTerm) ||
        (record.employeeType || "").toLowerCase().includes(searchTerm) ||
        (record.category || "").toLowerCase().includes(searchTerm) ||
        (record.status || "").toLowerCase().includes(searchTerm) ||
        record.amount.toString().includes(searchTerm) ||
        record.totalTax.toString().includes(searchTerm)
      );
    });

    const totalTaxLiability = totalBookingTax + totalPayrollTax + totalVehicleTax;
    const netIncomeAfterTax = summaryData.totalIncome - totalTaxLiability;

    // Generate monthly tax data from actual transactions
    const monthlyTaxData = {};
    allTaxRecords.forEach(record => {
      const month = new Date(record.date).toLocaleDateString('en-US', { month: 'short' });
      if (!monthlyTaxData[month]) {
        monthlyTaxData[month] = { name: month, tax: 0, income: 0, payroll: 0 };
      }
      monthlyTaxData[month].tax += record.totalTax;
      monthlyTaxData[month].income += record.amount;
      if (record.type !== 'Booking Tax') {
        monthlyTaxData[month].payroll += record.totalTax;
      }
    });
    
    const taxData = Object.values(monthlyTaxData).slice(0, 6);

    return (
      <div className="space-y-6">
        {/* Real-time indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Real-time tax calculations</span>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        {/* Tax Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Service Tax</p>
                <p className="text-2xl font-bold text-gray-900">${totalServiceTax.toLocaleString()}</p>
                <p className="text-xs text-gray-500">18% on bookings</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Income Tax</p>
                <p className="text-2xl font-bold text-gray-900">${totalIncomeTax.toLocaleString()}</p>
                <p className="text-xs text-gray-500">10% on revenue</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Receipt className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Company Payroll Tax</p>
                <p className="text-2xl font-bold text-gray-900">${(totalPayrollTax + totalVehicleTax).toLocaleString()}</p>
                <p className="text-xs text-gray-500">8% company pays for staff</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Net After Tax</p>
                <p className="text-2xl font-bold text-gray-900">${netIncomeAfterTax.toLocaleString()}</p>
                <p className="text-xs text-gray-500">After all taxes</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tax Overview Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Real-Time Tax Overview</h3>
              <p className="text-sm text-gray-600">Live tax calculations from bookings, salaries, and vehicle expenses</p>
            </div>
            <div className="text-sm text-gray-500">
              Total Records: {allTaxRecords.length}
            </div>
          </div>
          {taxData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taxData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => {
                    const labels = { tax: 'Income Tax', income: 'Income', payroll: 'Payroll Tax' };
                    return [`$${value.toLocaleString()}`, labels[name] || name];
                  }} />
                  <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tax" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="payroll" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No tax data available yet</p>
            </div>
          )}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">Income Tax</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-600">Payroll Tax</span>
            </div>
          </div>
        </div>

        {/* Real-Time Tax Records */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Live Tax Records</h3>
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <input
                  value={taxSearchQuery}
                  onChange={(e) => setTaxSearchQuery(e.target.value)}
                  placeholder="Search tax records..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              {/* Download Button */}
              <button 
                onClick={downloadTaxPDF}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Tax Report
              </button>
            </div>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredTaxRecords.length > 0 ? filteredTaxRecords.map((record) => (
              <div key={`${record.type}-${record.id}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    record.type === 'Booking Tax' ? 'bg-green-100' : 
                    record.type === 'Salary Tax' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    {record.type === 'Booking Tax' ? (
                      <Plane className="w-5 h-5 text-green-600" />
                    ) : record.type === 'Salary Tax' ? (
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Bus className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{record.name}</p>
                    <p className="text-sm text-gray-500">
                      {record.type} • {record.date}
                      {record.customer && ` • ${record.customer}`}
                      {record.employeeType && ` • ${record.employeeType}`}
                      {record.category && ` • ${record.category}`}
                    </p>
                    <div className="text-xs text-gray-400 mt-1">
                      {record.type === 'Booking Tax' ? (
                        <>Service Tax: ${record.serviceTax.toFixed(2)} | Income Tax: ${record.incomeTax.toFixed(2)}</>
                      ) : (
                        <>Company Payroll Tax: ${record.payrollTax.toFixed(2)} (8% company pays)</>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${record.amount.toLocaleString()}</p>
                  <p className="text-sm font-medium text-red-600">Tax: ${record.totalTax.toFixed(2)}</p>
                  <p className="text-xs text-green-600">{record.status}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>{taxSearchQuery.trim() ? "No tax records match your search" : "No tax records found"}</p>
                <p className="text-sm">
                  {taxSearchQuery.trim() 
                    ? "Try adjusting your search terms" 
                    : "Tax records will appear as bookings and payroll are processed"
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tax Compliance Dashboard */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Tax Compliance Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Booking Taxes</p>
                  <p className="text-xl font-bold text-green-700">${totalBookingTax.toFixed(2)}</p>
                  <p className="text-xs text-green-600">calculated</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Company Payroll Taxes</p>
                  <p className="text-xl font-bold text-blue-700">${(totalPayrollTax + totalVehicleTax).toFixed(2)}</p>
                  <p className="text-xs text-blue-600">company pays</p>
                </div>
                <Briefcase className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Total Tax Liability</p>
                  <p className="text-xl font-bold text-purple-700">${totalTaxLiability.toFixed(2)}</p>
                </div>
                <Receipt className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
                        <button
            onClick={() => window.location.reload()} 
            className="bg-[#042391] text-white px-4 py-2 rounded-lg hover:bg-[#042391]/90"
                        >
            Retry
                        </button>
        </div>
        </div>
    );
}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r min-h-screen">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-8">Expense Tracker</h1>
            
            {/* User Profile */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  PE
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Pasindu Edirisingha</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-[#042391] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "income" && renderIncome()}
          {activeTab === "payroll" && renderPayroll()}
          {activeTab === "tax" && renderTax()}
        </div>
        {/* Modals */}
        <EditExpenseModal />
        <DeleteConfirmModal />
      </div>
      </div>
    );
}
