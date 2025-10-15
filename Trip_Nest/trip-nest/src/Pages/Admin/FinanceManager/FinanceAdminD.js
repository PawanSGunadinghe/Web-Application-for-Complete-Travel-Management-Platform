import React, { useEffect, useMemo, useState } from "react";
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
  Search
} from "lucide-react";
import { getFinanceSummary, listFinanceExpenses } from "../../../features/auth/payroll/api";
import { getAllBookings } from "../../../features/auth/bookings/api";
import { io } from "socket.io-client";
import jsPDF from "jspdf";

export default function FinanceAdminD() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [summary, setSummary] = useState({ totalBalance: 0, totalIncome: 0, totalExpenses: 0 });
  const [incomeSeries, setIncomeSeries] = useState([]);
  const [expenseSeries, setExpenseSeries] = useState([]);
  const [expenseItems, setExpenseItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [taxSearchQuery, setTaxSearchQuery] = useState("");

  // Calculate real-time total income from bookings
  const realTimeTotalIncome = useMemo(() => {
    if (!bookings || bookings.length === 0) return 0;
    
    const total = bookings.reduce((sum, booking) => {
      const amount = booking.pricing?.total || 
                   booking.total || 
                   booking.amount || 
                   booking.price || 0;
      return sum + (Number(amount) || 0);
    }, 0);
    
    console.log("💰 REAL-TIME TOTAL INCOME CALCULATED:", total);
    return total;
  }, [bookings]);

  const formatCurrency = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Function to calculate total income from ALL bookings (including all statuses)
  const calculateTotalIncomeFromBookings = (bookings) => {
    if (!bookings || !Array.isArray(bookings)) {
      console.log("No bookings data available");
      return 0;
    }

    console.log("=== BOOKING INCOME CALCULATION DEBUG ===");
    
    // Check all booking statuses first
    const statusCounts = {};
    bookings.forEach(booking => {
      const status = booking.status || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log("Booking status counts:", statusCounts);

    // Calculate total from ALL bookings (not just confirmed)
    const totalIncome = bookings.reduce((sum, booking) => {
      // Try different possible fields for the booking amount
      const amount = booking.pricing?.total || 
                   booking.total || 
                   booking.amount || 
                   booking.price ||
                   booking.pricing?.subtotal ||
                   booking.pricing?.grandTotal ||
                   0;
      
      const numericAmount = Number(amount) || 0;
      
      console.log(`Booking ID: ${booking._id || 'N/A'}`);
      console.log(`  Name: ${booking.packageSnapshot?.name || booking.name || 'Unknown'}`);
      console.log(`  Status: ${booking.status}`);
      console.log(`  Pricing object:`, booking.pricing);
      console.log(`  Amount found: $${numericAmount}`);
      console.log(`  Running total: $${(sum + numericAmount).toFixed(2)}`);
      console.log('---');
      
      return sum + numericAmount;
    }, 0);

    console.log(`Total bookings: ${bookings.length}`);
    console.log(`Total income from ALL bookings: $${totalIncome.toFixed(2)}`);
    
    // Manual verification - let's also calculate it a different way
    const manualTotal = bookings
      .map(b => Number(b.pricing?.total || 0))
      .reduce((sum, amount) => sum + amount, 0);
    
    console.log(`Manual verification total: $${manualTotal.toFixed(2)}`);
    console.log("=== END DEBUG ===");
    
    // Return the higher of the two calculations to be safe
    const finalTotal = Math.max(totalIncome, manualTotal);
    console.log(`🚀 RETURNING TOTAL INCOME: $${finalTotal.toFixed(2)}`);
    
    return finalTotal;
  };

  const refresh = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch bookings data to calculate real income
      const bookingsData = await getAllBookings();
      console.log("Raw bookings data:", bookingsData);
      console.log("Number of bookings fetched:", bookingsData?.length || 0);
      setBookings(bookingsData || []);
      
      // Calculate total income using the dedicated function - THIS IS THE MAIN CALCULATION
      const totalIncomeFromBookings = calculateTotalIncomeFromBookings(bookingsData);
      
      console.log("🔥 FRONTEND CALCULATED TOTAL INCOME:", totalIncomeFromBookings);
      
      // Fetch backend data only for expenses
      const data = await getFinanceSummary({ from: "1970-01-01" });
      const summaryData = data?.summary || { totalBalance: 0, totalIncome: 0, totalExpenses: 0 };
      
      console.log("Backend summary data (for expenses only):", summaryData);
      
      // FORCE the total income to be our frontend calculation
      const finalSummary = {
        totalIncome: totalIncomeFromBookings, // ALWAYS use frontend calculation
        totalExpenses: summaryData.totalExpenses,
        totalBalance: totalIncomeFromBookings - summaryData.totalExpenses
      };
      
      console.log("🎯 FINAL SUMMARY BEING SET:", finalSummary);
      console.log("🎯 TOTAL INCOME SHOULD BE:", totalIncomeFromBookings);
      
      setSummary(finalSummary);
      
      // Force a re-render by updating the timestamp
      setLastUpdated(new Date());
      
      setIncomeSeries(data?.charts?.incomeSeries || []);
      setExpenseSeries(data?.charts?.expenseSeries || []);
      const expensesRes = await listFinanceExpenses({ from: "1970-01-01" });
      setExpenseItems(Array.isArray(expensesRes?.items) ? expensesRes.items : []);
      
      // Double-check the summary was set correctly
      setTimeout(() => {
        console.log("🔍 CHECKING SUMMARY STATE AFTER SET:", finalSummary);
      }, 100);
    } catch (e) {
      setError(e?.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  // Immediate booking fetch on component mount
  useEffect(() => {
    const fetchBookingsImmediately = async () => {
      try {
        console.log("🚀 IMMEDIATE BOOKING FETCH ON MOUNT");
        const bookingsData = await getAllBookings();
        console.log("📊 IMMEDIATE BOOKINGS DATA:", bookingsData);
        setBookings(bookingsData || []);
      } catch (error) {
        console.error("❌ Error fetching bookings immediately:", error);
      }
    };
    
    fetchBookingsImmediately();
  }, []);

  useEffect(() => {
    let timerId;
    const start = () => {
      refresh();
      timerId = setInterval(refresh, 3000);
    };
    const stop = () => timerId && clearInterval(timerId);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    };
    start();
    document.addEventListener("visibilitychange", handleVisibility);

    // --- SOCKET.IO REAL-TIME ---
    const socket = io("http://localhost:4000"); // Change to your backend URL if needed
    socket.on("financeUpdate", () => {
      refresh();
    });
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
      socket.disconnect();
    };
  }, []);

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

  const recentTransactions = expenseItems.map((e) => ({
    id: e.id,
    name: e.type === "salary" ? `Salary - ${e.employeeName || "Employee"}` : (e.type || "Expense"),
    date: e.effectiveFrom ? new Date(e.effectiveFrom).toLocaleDateString() : "",
    amount: -Math.abs(Number(e.amount || 0)),
    icon: Briefcase,
    color: "text-red-500"
  }));

  // Recent tax transactions
  const recentTaxTransactions = React.useMemo(() => {
    const confirmedBookings = bookings.filter(booking => 
      booking.status === "confirmed" || booking.status === "created"
    );
    
    // Create booking tax records
    const bookingTaxes = confirmedBookings.slice(0, 3).map(booking => {
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

    // Create payroll tax records
    const payrollTaxes = expenseItems.slice(0, 2).map(expense => {
      const amount = Number(expense.amount || 0);
      const taxes = calculatePayrollTax(amount);
      return {
        id: `payroll-${expense.id}`,
        name: `${expense.type === "salary" ? `${expense.employeeName || "Employee"}` : "Expense"} - Tax`,
        date: expense.effectiveFrom ? new Date(expense.effectiveFrom).toLocaleDateString() : "",
        amount: taxes.total,
        type: "Payroll Tax",
        icon: Receipt,
        color: "text-orange-500"
      };
    });

    return [...bookingTaxes, ...payrollTaxes]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [bookings, expenseItems]);

  const incomeChartData = useMemo(() => incomeSeries.map(d => ({ name: d.date, amount: d.amount })), [incomeSeries]);

  const expenseTrendData = useMemo(() => expenseSeries.map(d => ({ name: d.date, amount: d.amount })), [expenseSeries]);

  const financialOverviewData = [
    { name: "Total Balance", value: summary.totalBalance, color: "#8B5CF6" },
    { name: "Total Expenses", value: summary.totalExpenses, color: "#EF4444" },
    { name: "Total Income", value: summary.totalIncome, color: "#F97316" }
  ];

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Grid3X3 },
    { id: "income", label: "Income", icon: Wallet },
    { id: "expense", label: "Expense", icon: Receipt },
    { id: "tax", label: "Tax", icon: Receipt },
    { id: "logout", label: "Logout", icon: LogOut }
  ];

  const renderDashboard = () => {
    console.log("🎨 RENDERING DASHBOARD WITH SUMMARY:", summary);
    console.log("🎨 TOTAL INCOME IN RENDER:", summary.totalIncome);
    
    return (
    <div className="space-y-6">
      {lastUpdated && (
        <div className="text-right text-xs text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</div>
      )}
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">${formatCurrency(summary.totalBalance)}</p>
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
              <p className="text-2xl font-bold text-gray-900">${formatCurrency(realTimeTotalIncome || summary.totalIncome)}</p>
              <p className="text-xs text-blue-600">Real-time: ${realTimeTotalIncome} | Summary: ${summary.totalIncome}</p>
              <p className="text-xs text-green-600">Bookings: {bookings.length} | Updated: {lastUpdated?.toLocaleTimeString()}</p>
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
              <p className="text-2xl font-bold text-gray-900">${formatCurrency(summary.totalExpenses)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
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

        {/* Financial Overview Chart */}
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
              <p className="text-2xl font-bold text-gray-900">${formatCurrency(summary.totalBalance)}</p>
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
      </div>

      {/* Recent Payroll and Taxes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Payroll (Left) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Payroll</h3>
            <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              See All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {recentTransactions.slice(0, 5).map((transaction) => {
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

        {/* Recent Taxes (Right) */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Taxes</h3>
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
  };

  const renderIncome = () => (
    <div className="space-y-6">
      {/* Income Overview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Income Overview</h3>
            <p className="text-sm text-gray-600">Track your earnings over time and analyze your income trends.</p>
          </div>
          <button className="bg-[#042391] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#042391]/90 transition-colors">
            <Plus className="w-4 h-4" />
            Add Income
          </button>
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
          <button className="bg-[#042391] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#042391]/90 transition-colors">
            <Plus className="w-4 h-4" />
            Add Expense
                    </button>
                </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expenseTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
              <Bar dataKey="amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
                </div>

      {/* All Expenses */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">All Expenses</h3>
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border border-gray-300 px-3 py-2 rounded-lg">
            <Download className="w-4 h-4" />
            Download
                        </button>
                    </div>
        <div className="space-y-4">
          {recentTransactions.map((transaction) => {
            const IconComponent = transaction.icon;
            return (
              <div key={transaction.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.color.replace('text-', 'bg-').replace('-500', '-100')}`}>
                    <IconComponent className={`w-5 h-5 ${transaction.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.name}</p>
                    <p className="text-sm text-gray-500">{transaction.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-red-600">
                    - ${Math.abs(transaction.amount).toLocaleString()}
                  </span>
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
              </div>
            );
          })}
        </div>
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

    // Calculate payroll taxes
    let totalPayrollTax = 0;
    const payrollTaxRecords = expenseItems.map(expense => {
      const amount = Number(expense.amount || 0);
      const taxes = calculatePayrollTax(amount);
      totalPayrollTax += taxes.total;
      
      return {
        id: expense.id,
        type: "Payroll Tax",
        name: expense.type === "salary" ? `Salary - ${expense.employeeName || "Employee"}` : "Expense",
        amount: amount,
        payrollTax: taxes.payrollTax,
        totalTax: taxes.total,
        date: expense.effectiveFrom ? new Date(expense.effectiveFrom).toLocaleDateString() : "",
        status: "Calculated"
      };
    });

    // Combine all tax records
    const allTaxRecords = [...bookingTaxRecords, ...payrollTaxRecords]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalTaxLiability = totalBookingTax + totalPayrollTax;

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
    doc.text("TAX REPORT", 20, 48);
    
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
    doc.text(`Company Payroll Tax (8%): $${totalPayrollTax.toLocaleString()}`, 30, 120);
    doc.text(`Total Tax Liability: $${totalTaxLiability.toLocaleString()}`, 30, 135);
    
    // Tax records section
    doc.setFontSize(16);
    doc.text("TAX RECORDS", 20, 155);
    
    doc.setFontSize(10);
    let yPosition = 170;
    
    // Table headers
    doc.setFont("helvetica", "bold");
    doc.text("Type", 20, yPosition);
    doc.text("Description", 50, yPosition);
    doc.text("Amount", 110, yPosition);
    doc.text("Tax", 140, yPosition);
    doc.text("Date", 170, yPosition);
    
    yPosition += 10;
    doc.line(20, yPosition - 5, 190, yPosition - 5);
    
    // Table data
    doc.setFont("helvetica", "normal");
    allTaxRecords.slice(0, 20).forEach((record) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      const type = record.type === "Booking Tax" ? "Booking" : "Payroll";
      const description = record.name.substring(0, 20);
      const amount = `$${record.amount.toLocaleString()}`;
      const tax = `$${record.totalTax.toFixed(2)}`;
      const date = record.date;
      
      doc.text(type, 20, yPosition);
      doc.text(description, 50, yPosition);
      doc.text(amount, 110, yPosition);
      doc.text(tax, 140, yPosition);
      doc.text(date, 170, yPosition);
      
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
    doc.save(`tax-report-${new Date().toISOString().split('T')[0]}.pdf`);
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

    // Calculate payroll taxes
    let totalPayrollTax = 0;
    const payrollTaxRecords = expenseItems.map(expense => {
      const amount = Number(expense.amount || 0);
      const taxes = calculatePayrollTax(amount);
      totalPayrollTax += taxes.total;
      
      return {
        id: expense.id,
        type: "Payroll Tax",
        name: expense.type === "salary" ? `Salary - ${expense.employeeName || "Employee"}` : "Expense",
        amount: amount,
        payrollTax: taxes.payrollTax,
        socialSecurity: taxes.socialSecurity,
        totalTax: taxes.total,
        date: expense.effectiveFrom ? new Date(expense.effectiveFrom).toLocaleDateString() : "",
        status: "Calculated"
      };
    });

    // Combine all tax records and sort by date
    const allTaxRecords = [...bookingTaxRecords, ...payrollTaxRecords]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10); // Show latest 10 records

    // Filter tax records based on search query
    const filteredTaxRecords = allTaxRecords.filter((record) => {
      const searchTerm = taxSearchQuery.trim().toLowerCase();
      if (!searchTerm) return true;
      return (
        (record.name || "").toLowerCase().includes(searchTerm) ||
        (record.type || "").toLowerCase().includes(searchTerm) ||
        (record.customer || "").toLowerCase().includes(searchTerm) ||
        (record.status || "").toLowerCase().includes(searchTerm) ||
        record.amount.toString().includes(searchTerm) ||
        record.totalTax.toString().includes(searchTerm)
      );
    });

    const totalTaxLiability = totalBookingTax + totalPayrollTax;
    const netIncomeAfterTax = summary.totalIncome - totalTaxLiability;

    // Generate monthly tax data from actual transactions
    const monthlyTaxData = {};
    allTaxRecords.forEach(record => {
      const month = new Date(record.date).toLocaleDateString('en-US', { month: 'short' });
      if (!monthlyTaxData[month]) {
        monthlyTaxData[month] = { name: month, tax: 0, income: 0 };
      }
      monthlyTaxData[month].tax += record.totalTax;
      monthlyTaxData[month].income += record.amount;
    });
    
    const taxData = Object.values(monthlyTaxData).slice(0, 6);

    return (
      <div className="space-y-6">
        {lastUpdated && (
          <div className="text-right text-xs text-gray-500">Tax data updated: {lastUpdated.toLocaleTimeString()}</div>
        )}
        
        {/* Tax Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Service Tax</p>
                <p className="text-2xl font-bold text-gray-900">${formatCurrency(totalServiceTax)}</p>
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
                <p className="text-2xl font-bold text-gray-900">${formatCurrency(totalIncomeTax)}</p>
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
                <p className="text-2xl font-bold text-gray-900">${formatCurrency(totalPayrollTax)}</p>
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
                <p className="text-2xl font-bold text-gray-900">${formatCurrency(netIncomeAfterTax)}</p>
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
              <p className="text-sm text-gray-600">Tax calculations from actual bookings and payroll</p>
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
                  <Tooltip formatter={(value, name) => [`$${value.toLocaleString()}`, name === 'tax' ? 'Tax' : 'Income']} />
                  <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tax" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No tax data available yet</p>
            </div>
          )}
        </div>

        {/* Real-Time Tax Records */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Real-Time Tax Records</h3>
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
                    record.type === 'Booking Tax' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {record.type === 'Booking Tax' ? (
                      <Plane className="w-5 h-5 text-green-600" />
                    ) : (
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{record.name}</p>
                    <p className="text-sm text-gray-500">
                      {record.type} • {record.date}
                      {record.customer && ` • ${record.customer}`}
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
                  <p className="text-xs text-gray-500">{record.status}</p>
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
                  <p className="text-xl font-bold text-blue-700">${totalPayrollTax.toFixed(2)}</p>
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
                  MW
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Mike William</p>
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
          {activeTab === "expense" && renderExpense()}
          {activeTab === "tax" && renderTax()}
          {activeTab === "logout" && (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Logout functionality would be implemented here</p>
            </div>
        )}
        </div>
      </div>
        </div>
    );
}
