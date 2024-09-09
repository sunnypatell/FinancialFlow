"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  ArcElement,
  RadialLinearScale,
  Filler,
  ChartData,
  ChartOptions
} from 'chart.js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowUpRight, ArrowDownRight, DollarSign, PiggyBank, Trash2, Github, Linkedin, Globe, Settings, Wallet, CreditCard } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler
)

interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
}

interface Goal {
  id: number
  name: string
  target: number
  current: number
  deadline: string
}

interface UserData {
  name: string
  initialBalance: string
  monthlyIncome: string
  monthlyExpenses: string
}

interface BudgetCategory {
  category: string
  limit: number
}

const categories = [
  'Food', 'Transport', 'Entertainment', 'Utilities', 'Rent', 'Shopping', 'Health', 'Education', 'Savings', 'Other'
]

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const validateNumber = (value: string): boolean => {
  return /^\d+(\.\d{1,2})?$/.test(value)
}

const validateName = (value: string): boolean => {
  return /^[a-zA-Z\s]{2,30}$/.test(value)
}

const calculateFinancialHealth = (income: number, expenses: number, savings: number, debt: number): number => {
  const savingsRate = savings / income
  const debtToIncomeRatio = debt / income
  const expenseRatio = expenses / income

  let score = 0
  score += savingsRate * 40 // Weight savings rate at 40%
  score += (1 - debtToIncomeRatio) * 30 // Weight debt-to-income ratio at 30%
  score += (1 - expenseRatio) * 30 // Weight expense ratio at 30%

  return Math.min(Math.max(score * 100, 0), 100) // Ensure score is between 0 and 100
}

export default function FinanceTracker() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [balance, setBalance] = useState(0)
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [savings, setSavings] = useState(0)
  const [debt, setDebt] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', type: 'expense' as 'income' | 'expense', category: '', date: new Date().toISOString().split('T')[0] })
  const [newGoal, setNewGoal] = useState({ name: '', target: '', current: '', deadline: '' })
  const [showQuestionnaire, setShowQuestionnaire] = useState(true)
  const [userData, setUserData] = useState<UserData>({ name: '', initialBalance: '', monthlyIncome: '', monthlyExpenses: '' })
  const [errors, setErrors] = useState<Partial<UserData>>({})
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  const [newBudgetCategory, setNewBudgetCategory] = useState({ category: '', limit: '' })
  const [financialHealthScore, setFinancialHealthScore] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showTosDialog, setShowTosDialog] = useState(false)
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)
  const { toast } = useToast()

  const chartRef = useRef<ChartJS<"doughnut", number[], unknown> | null>(null)

  useEffect(() => {
    const storedData = localStorage.getItem('financeTrackerData')
    if (storedData) {
      const parsedData = JSON.parse(storedData)
      setBalance(parsedData.balance)
      setIncome(parsedData.income)
      setExpenses(parsedData.expenses)
      setSavings(parsedData.savings)
      setDebt(parsedData.debt)
      setTransactions(parsedData.transactions)
      setGoals(parsedData.goals)
      setBudgetCategories(parsedData.budgetCategories)
      setUserData(parsedData.userData)
      setShowQuestionnaire(false)
    }
  }, [])

  useEffect(() => {
    const score = calculateFinancialHealth(income, expenses, savings, debt)
    setFinancialHealthScore(score)
  }, [income, expenses, savings, debt])

  const saveData = () => {
    const dataToSave = {
      balance,
      income,
      expenses,
      savings,
      debt,
      transactions,
      goals,
      budgetCategories,
      userData
    }
    localStorage.setItem('financeTrackerData', JSON.stringify(dataToSave))
  }

  const validateUserData = (): boolean => {
    const newErrors: Partial<UserData> = {}
    if (!validateName(userData.name)) {
      newErrors.name = 'Please enter a valid name (2-30 alphabetic characters)'
    }
    if (!validateNumber(userData.initialBalance)) {
      newErrors.initialBalance = 'Please enter a valid number'
    }
    if (!validateNumber(userData.monthlyIncome)) {
      newErrors.monthlyIncome = 'Please enter a valid number'
    }
    if (!validateNumber(userData.monthlyExpenses)) {
      newErrors.monthlyExpenses = 'Please enter a valid number'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleQuestionnaireSubmit = () => {
    if (validateUserData()) {
      const initialBalance = parseFloat(userData.initialBalance)
      const monthlyIncome = parseFloat(userData.monthlyIncome)
      const monthlyExpenses = parseFloat(userData.monthlyExpenses)

      setBalance(initialBalance)
      setIncome(monthlyIncome)
      setExpenses(monthlyExpenses)
      setSavings(initialBalance + monthlyIncome - monthlyExpenses)

      const currentDate = new Date().toISOString().split('T')[0]
      setTransactions([
        { id: 1, date: currentDate, description: 'Initial Balance', amount: initialBalance, type: 'income', category: 'Other' },
        { id: 2, date: currentDate, description: 'Monthly Income', amount: monthlyIncome, type: 'income', category: 'Other' },
        { id: 3, date: currentDate, description: 'Monthly Expenses', amount: monthlyExpenses, type: 'expense', category: 'Other' },
      ])

      setShowQuestionnaire(false)
      saveData()
      toast({
        description: 'Welcome to FinancialFlow 💸! Your initial data has been saved.',
      })
    }
  }

  const addTransaction = () => {
    if (newTransaction.description && newTransaction.amount && newTransaction.category) {
      if (!validateNumber(newTransaction.amount)) {
        toast({
          description: 'Please enter a valid amount',
        })
        return
      }
      const amount = newTransaction.type === 'income' ? parseFloat(newTransaction.amount) : -parseFloat(newTransaction.amount)
      const transaction: Transaction = {
        id: transactions.length + 1,
        date: newTransaction.date,
        description: newTransaction.description,
        amount,
        type: newTransaction.type,
        category: newTransaction.category,
      }
      const updatedTransactions = [transaction, ...transactions]
      setTransactions(updatedTransactions)
      updateFinances(amount)
      setNewTransaction({ description: '', amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0] })
      saveData()
      toast({
        description: 'Transaction added successfully',
      })
    } else {
      toast({
        description: 'Please fill in all fields for the transaction',
      })
    }
  }

  const addGoal = () => {
    if (newGoal.name && newGoal.target && newGoal.current && newGoal.deadline) {
      if (!validateNumber(newGoal.target) || !validateNumber(newGoal.current)) {
        toast({
          description: 'Please enter valid numbers for goal amounts',
        })
        return
      }
      const goal: Goal = {
        id: goals.length + 1,
        name: newGoal.name,
        target: parseFloat(newGoal.target),
        current: parseFloat(newGoal.current),
        deadline: newGoal.deadline,
      }
      const updatedGoals = [...goals, goal]
      setGoals(updatedGoals)
      setNewGoal({ name: '', target: '', current: '', deadline: '' })
      saveData()
      toast({
        description: 'Goal added successfully',
      })
    } else {
      toast({
        description: 'Please fill in all fields for the goal',
      })
    }
  }

  const updateFinances = (amount: number) => {
    setBalance(prevBalance => {
      const newBalance = prevBalance + amount
      if (amount > 0) {
        setIncome(prevIncome => prevIncome + amount)
      } else {
        setExpenses(prevExpenses => prevExpenses - amount)
      }
      setSavings(newBalance)
      return newBalance
    })
  }

  const addBudgetCategory = () => {
    if (newBudgetCategory.category && newBudgetCategory.limit) {
      if (!validateNumber(newBudgetCategory.limit)) {
        toast({
          description: 'Please enter a valid budget limit',
        })
        return
      }
      const category: BudgetCategory = {
        category: newBudgetCategory.category,
        limit: parseFloat(newBudgetCategory.limit),
      }
      const updatedCategories = [...budgetCategories, category]
      setBudgetCategories(updatedCategories)
      setNewBudgetCategory({ category: '', limit: '' })
      saveData()
      toast({
        description: 'Budget category added successfully',
      })
    } else {
      toast({
        description: 'Please fill in all fields for the budget category',
      })
    }
  }

  const deleteTransaction = (id: number) => {
    const transactionToDelete = transactions.find(t => t.id === id)
    if (transactionToDelete) {
      const updatedTransactions = transactions.filter(t => t.id !== id)
      setTransactions(updatedTransactions)
      updateFinances(-transactionToDelete.amount)
      saveData()
      toast({
        description: 'Transaction deleted successfully',
      })
    }
  }

  const deleteGoal = (id: number) => {
    const updatedGoals = goals.filter(g => g.id !== id)
    setGoals(updatedGoals)
    saveData()
    toast({
      description: 'Goal deleted successfully',
    })
  }

  const deleteBudgetCategory = (category: string) => {
    const updatedCategories = budgetCategories.filter(c => c.category !== category)
    setBudgetCategories(updatedCategories)
    saveData()
    toast({
      description: 'Budget category deleted successfully',
    })
  }

  const getCategoryData = () => {
    return categories.map(category => {
      const total = transactions
        .filter(t => t.category === category && t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      return total
    })
  }

  const getBudgetComparisonData = () => {
    return budgetCategories.map(bc => {
      const spent = transactions
        .filter(t => t.category === bc.category && t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      return {
        category: bc.category,
        limit: bc.limit,
        spent: spent,
      }
    })
  }

  const generateBudgetRecommendations = () => {
    const recommendations = [];
    const totalIncome = income;
    const totalExpenses = expenses;
    const savingsRate = (savings / totalIncome) * 100;
    const budgetComparisonData = getBudgetComparisonData();

    // Check if the array is not empty before reduce
    const highestExpenseCategory = budgetComparisonData.length > 0
    ? budgetComparisonData.reduce((prev, current) => (prev.spent > current.spent) ? prev : current) : null;

    // Savings rate recommendation
    if (savingsRate < 20) {
      recommendations.push(`Aim to increase your savings rate to at least 20% of your income. Currently, you're saving ${savingsRate.toFixed(1)}%.`);
    } else {
      recommendations.push(`Great job on your savings! You're currently saving ${savingsRate.toFixed(1)}% of your income.`);
    }

    // Expense reduction recommendation
    if (highestExpenseCategory) {
      recommendations.push(`Your highest expense category is ${highestExpenseCategory.category}. Look for ways to reduce spending in this area, such as finding cheaper alternatives or negotiating better rates.`);
    }

    // Emergency fund recommendation
    const emergencyFundTarget = totalExpenses * 3; // 3 months of expenses
    if (savings < emergencyFundTarget) {
      recommendations.push(`Work on building an emergency fund of ${formatCurrency(emergencyFundTarget)}. This will cover 3 months of expenses.`);
    }

    // Debt reduction recommendation
    if (debt > 0) {
      const debtToIncomeRatio = (debt / totalIncome) * 100;
      if (debtToIncomeRatio > 36) {
        recommendations.push(`Your debt-to-income ratio is high at ${debtToIncomeRatio.toFixed(1)}%. Focus on paying down your debt, starting with high-interest loans.`);
      }
    }

    // Income increase recommendation
    if (totalExpenses / totalIncome > 0.7) {
      recommendations.push("Your expenses are taking up a large portion of your income. Consider ways to increase your income, such as asking for a raise, finding a side hustle, or developing new skills.");
    }

    return recommendations;
  };

  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Income',
        data: transactions.filter(t => t.type === 'income').map(t => t.amount),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Expenses',
        data: transactions.filter(t => t.type === 'expense').map(t => Math.abs(t.amount)),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  }

  const barChartData = {
    labels: categories,
    datasets: [
      {
        label: 'Expenses by Category',
        data: getCategoryData(),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
          'rgba(83, 102, 255, 0.6)',
          'rgba(40, 159, 64, 0.6)',
          'rgba(206, 102, 255, 0.6)',
        ],
      },
    ],
  }

  const doughnutChartData = {
    labels: ['Savings', 'Expenses', 'Debt'],
    datasets: [
      {
        data: [savings, expenses, debt],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const radarChartData = {
    labels: ['Savings Rate', 'Debt Management', 'Expense Control', 'Income Growth', 'Investment Diversification'],
    datasets: [
      {
        label: 'Financial Health',
        data: [
          (savings / income) * 100,
          100 - (debt / income) * 100,
          100 - (expenses / income) * 100,
          (income / (expenses + savings)) * 100,
          50, // Placeholder for investment diversification
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgb(75, 192, 192)',
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(75, 192, 192)',
      },
    ],
  }

  const resetAllData = () => {
    localStorage.removeItem('financeTrackerData')
    setBalance(0)
    setIncome(0)
    setExpenses(0)
    setSavings(0)
    setDebt(0)
    setTransactions([])
    setGoals([])
    setBudgetCategories([])
    setUserData({ name: '', initialBalance: '', monthlyIncome: '', monthlyExpenses: '' })
    setShowQuestionnaire(true)
    setShowResetDialog(false)
    toast({
      description: 'All data has been reset. Please enter your initial information.',
    })
  }

  const handleSettingsChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }))
  }

  const saveSettings = () => {
    if (validateUserData()) {
      const newMonthlyIncome = parseFloat(userData.monthlyIncome)
      const newMonthlyExpenses = parseFloat(userData.monthlyExpenses)
      
      setIncome(newMonthlyIncome)
      setExpenses(newMonthlyExpenses)
      setSavings(prev => prev + (newMonthlyIncome - income) - (newMonthlyExpenses - expenses))
      
      saveData()
      setShowSettings(false)
      toast({
        description: "Settings updated successfully",
      })
    } else {
      toast({
        description: "Please enter valid values for all fields",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AnimatePresence>
        {showQuestionnaire && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Welcome to FinancialFlow 💸</CardTitle>
                <CardDescription>Please provide some initial information to get started.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initialBalance">Initial Balance ($)</Label>
                    <Input
                      id="initialBalance"
                      type="text"
                      value={userData.initialBalance}
                      onChange={(e) => setUserData({ ...userData, initialBalance: e.target.value })}
                    />
                    {errors.initialBalance && <p className="text-red-500 text-sm">{errors.initialBalance}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyIncome">Monthly Income ($)</Label>
                    <Input
                      id="monthlyIncome"
                      type="text"
                      value={userData.monthlyIncome}
                      onChange={(e) => setUserData({ ...userData, monthlyIncome: e.target.value })}
                    />
                    {errors.monthlyIncome && <p className="text-red-500 text-sm">{errors.monthlyIncome}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyExpenses">Monthly Expenses ($)</Label>
                    <Input
                      id="monthlyExpenses"
                      type="text"
                      value={userData.monthlyExpenses}
                      onChange={(e) => setUserData({ ...userData, monthlyExpenses: e.target.value })}
                    />
                    {errors.monthlyExpenses && <p className="text-red-500 text-sm">{errors.monthlyExpenses}</p>}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleQuestionnaireSubmit} className="w-full">Start Tracking</Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-gray-800 shadow-md">
        <nav className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold">FinancialFlow 💸</div>
            <div className="flex space-x-4">
              <Button variant="ghost" onClick={() => setActiveTab('dashboard')}>Dashboard</Button>
              <Button variant="ghost" onClick={() => setActiveTab('transactions')}>Transactions</Button>
              <Button variant="ghost" onClick={() => setActiveTab('goals')}>Goals</Button>
              <Button variant="ghost" onClick={() => setActiveTab('budget')}>Budget</Button>
              <Button variant="ghost" onClick={() => setActiveTab('insights')}>Insights</Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-8">Welcome back, {userData.name || 'User'}!</h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
              <p className="text-xs text-muted-foreground">
                {balance > 0 ? '+' : ''}{((balance / income) * 100).toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Income</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(income)}</div>
              <p className="text-xs text-muted-foreground">
                +{((income / (expenses + savings)) * 100).toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expenses</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(expenses)}</div>
              <p className="text-xs text-muted-foreground">
                {((expenses / income) * 100).toFixed(1)}% of income
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savings</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(savings)}</div>
              <p className="text-xs text-muted-foreground">
                {((savings / income) * 100).toFixed(1)}% of income
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gray-700 text-white">Dashboard</TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-gray-700 text-white">Transactions</TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:bg-gray-700 text-white">Goals</TabsTrigger>
            <TabsTrigger value="budget" className="data-[state=active]:bg-gray-700 text-white">Budget</TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-gray-700 text-white">Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Income vs Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <Line data={lineChartData} options={{ responsive: true }} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <Bar data={barChartData} options={{ responsive: true }} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <Doughnut
                    data={doughnutChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw as number;
                              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number;
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                          }
                        }
                      },
                      onHover: (event, elements) => {
                        if (elements && elements.length) {
                          setHoveredSection(doughnutChartData.labels[elements[0].index] as string);
                        } else {
                          setHoveredSection(null);
                        }
                      }
                    }}
                    ref={chartRef}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {hoveredSection === 'Savings' && <Wallet className="h-12 w-12 text-teal-500" />}
                    {hoveredSection === 'Expenses' && <ArrowDownRight className="h-12 w-12 text-pink-500" />}
                    {hoveredSection === 'Debt' && <CreditCard className="h-12 w-12 text-yellow-500" />}
                    {!hoveredSection && <DollarSign className="h-12 w-12 text-gray-400" />}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.slice(0, 5).map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{transaction.date}</TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell className={transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                              {formatCurrency(Math.abs(transaction.amount))}
                            </TableCell>
                            <TableCell>{transaction.category}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>Manage your income and expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                    <Input
                      placeholder="Description"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    />
                    <Input
                      type="text"
                      placeholder="Amount"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    />
                    <Select
                      value={newTransaction.type}
                      onValueChange={(value: 'income' | 'expense') => setNewTransaction({ ...newTransaction, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={newTransaction.category}
                      onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    />
                    <Button onClick={addTransaction}>Add Transaction</Button>
                  </div>
                </div>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell className={transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                            {formatCurrency(Math.abs(transaction.amount))}
                          </TableCell>
                          <TableCell>{transaction.type}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => deleteTransaction(transaction.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <CardTitle>Financial Goals</CardTitle>
                <CardDescription>Track your savings goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <Input
                      placeholder="Goal Name"
                      value={newGoal.name}
                      onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    />
                    <Input
                      type="text"
                      placeholder="Target Amount"
                      value={newGoal.target}
                      onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                    />
                    <Input
                      type="text"
                      placeholder="Current Amount"
                      value={newGoal.current}
                      onChange={(e) => setNewGoal({ ...newGoal, current: e.target.value })}
                    />
                    <Input
                      type="date"
                      placeholder="Deadline"
                      value={newGoal.deadline}
                      onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    />
                    <Button onClick={addGoal}>Add Goal</Button>
                  </div>
                </div>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Goal</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Current</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {goals.map((goal) => (
                        <TableRow key={goal.id}>
                          <TableCell>{goal.name}</TableCell>
                          <TableCell>{formatCurrency(goal.target)}</TableCell>
                          <TableCell>{formatCurrency(goal.current)}</TableCell>
                          <TableCell>{goal.deadline}</TableCell>
                          <TableCell>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${(goal.current / goal.target) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{((goal.current / goal.target) * 100).toFixed(1)}%</span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => deleteGoal(goal.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="budget">
            <Card>
              <CardHeader>
                <CardTitle>Budget Management</CardTitle>
                <CardDescription>Set and track your budget for different categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Select
                      value={newBudgetCategory.category}
                      onValueChange={(value) => setNewBudgetCategory({ ...newBudgetCategory, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="text"
                      placeholder="Budget Limit"
                      value={newBudgetCategory.limit}
                      onChange={(e) => setNewBudgetCategory({ ...newBudgetCategory, limit: e.target.value })}
                    />
                    <Button onClick={addBudgetCategory}>Add Budget Category</Button>
                  </div>
                </div>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Budget Limit</TableHead>
                        <TableHead>Spent</TableHead>
                        <TableHead>Remaining</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getBudgetComparisonData().map((item) => (
                        <TableRow key={item.category}>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{formatCurrency(item.limit)}</TableCell>
                          <TableCell>{formatCurrency(item.spent)}</TableCell>
                          <TableCell>{formatCurrency(item.limit - item.spent)}</TableCell>
                          <TableCell>
                            <Progress value={(item.spent / item.limit) * 100} className="w-[60%]" />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => deleteBudgetCategory(item.category)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="insights">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Spending Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <Line data={lineChartData} options={{ responsive: true }} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Budget Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 text-lg">
                    {generateBudgetRecommendations().map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 mt-1">💡</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Financial Health Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-2">{financialHealthScore.toFixed(0)}</div>
                    <p className="text-sm text-muted-foreground">
                      {financialHealthScore >= 80 ? 'Excellent' :
                       financialHealthScore >= 60 ? 'Good' :
                       financialHealthScore >= 40 ? 'Fair' : 'Needs Improvement'}
                    </p>
                  </div>
                  <div className="mt-4">
                    <p className="text-xl">
                      {financialHealthScore >= 80
                        ? "🏆 Congratulations on your excellent financial health! You're a true money maestro. 💰 Your smart decisions have paid off, creating a solid foundation for your future. Keep maximizing your savings, exploring diverse investment opportunities, and staying informed about market trends. Consider setting more ambitious financial goals, like early retirement or starting a passion project. Remember, even at the top, there's always room for growth – maybe it's time to mentor others or contribute to charitable causes you care about. 🌟"
                        : financialHealthScore >= 60
                        ? "👍 Good job on maintaining a healthy financial status! You're on the right track, but there's potential for even greater success. 📈 Focus on fine-tuning your budget to increase your savings rate. Look for areas where you can trim unnecessary expenses without sacrificing your quality of life. Consider automating your savings and exploring new investment avenues to diversify your portfolio. Don't forget to review and possibly increase your insurance coverage to protect your growing assets. With a few tweaks, you could soon join the ranks of financial excellence! 💪"
                        : financialHealthScore >= 40
                        ? "⚖️ Your financial health is fair, which means you have a solid foundation to build upon. It's time to roll up your sleeves and make some positive changes! 🛠️ Start by creating a detailed budget to understand where every dollar is going. Prioritize paying down high-interest debt while simultaneously building your emergency fund. Look for ways to increase your income, whether through a side hustle or asking for a raise at work. Education is key – consider taking financial literacy courses or reading personal finance books to empower yourself. Remember, small, consistent steps can lead to significant improvements over time. You've got this! 🌱"
                        : "🚨 Your financial health needs some serious TLC, but don't worry – everyone starts somewhere, and you've already taken the first step by acknowledging it. 🏁 It's time for a financial reset. Start by listing all your debts and creating a repayment plan, focusing on high-interest debts first. Simultaneously, build a small emergency fund to avoid falling back into debt for unexpected expenses. Ruthlessly cut unnecessary expenses and consider temporary lifestyle changes to free up more money. Explore ways to increase your income, even if it means taking on temporary work. Seek free financial counseling services in your community for personalized advice. Remember, this is a marathon, not a sprint – celebrate small victories along the way. With dedication and the right strategies, you can turn your financial health around! 💼🔄"}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Financial Health Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Radar data={radarChartData} options={{ responsive: true, scales: { r: { min: 0, max: 100 } } }} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-between items-center">
            <div className="w-full md:w-1/3 text-center md:text-left">
              <h3 className="text-lg font-semibold mb-2">FinancialFlow 💸</h3>
              <p className="text-sm">Your personal finance companion</p>
            </div>
            <div className="w-full md:w-1/3 text-center mt-4 md:mt-0">
              <p className="text-sm">&copy; 2024 Sunny Patel - sunnypatel124555@gmail.com</p>
              <p className="text-sm">&copy; This web project is protected by copyright. You may not copy, modify, or distribute this work without explicit permission from the author.</p>
              <Button variant="link" className="mt-4 bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600 transition-colors duration-300 font-semibold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105" onClick={() => setShowTosDialog(true)}>
                Terms of Service ⚠️
              </Button>
            </div>
            <div className="w-full md:w-1/3 text-center md:text-right mt-4 md:mt-0">
              <div className="flex justify-center md:justify-end space-x-4">
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://github.com/sunnypatell/FinancialFlow" target="_blank" rel="noopener noreferrer">
                    <Github className="h-5 w-5" />
                    <span className="sr-only">GitHub</span>
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://www.linkedin.com/in/sunny-patel-30b460204/" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-5 w-5" />
                    <span className="sr-only">LinkedIn</span>
                  </a>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://www.sunnypatel.net" target="_blank" rel="noopener noreferrer">
                    <Globe className="h-5 w-5" />
                    <span className="sr-only">Portfolio</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-white text-black">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Update your personal information and preferences</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={userData.name}
                onChange={(e) => handleSettingsChange('name', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monthlyIncome" className="text-right">
                Monthly Income
              </Label>
              <Input
                id="monthlyIncome"
                value={userData.monthlyIncome}
                onChange={(e) => handleSettingsChange('monthlyIncome', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monthlyExpenses" className="text-right">
                Monthly Expenses
              </Label>
              <Input
                id="monthlyExpenses"
                value={userData.monthlyExpenses}
                onChange={(e) => handleSettingsChange('monthlyExpenses', e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="bg-white text-black">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete all your financial data and reset the application to its initial state.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={resetAllData}>Yes, Reset All Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTosDialog} onOpenChange={setShowTosDialog}>
        <DialogContent className="bg-white text-black max-w-3xl">
          <DialogHeader>
            <DialogTitle>Terms of Service ⚠️</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-4">
              <h2 className="text-xl font-bold">1. Acceptance of Terms</h2>
              <p>By accessing or using FinancialFlow, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>

              <h2 className="text-xl font-bold">2. Description of Service</h2>
              <p>FinancialFlow is a personal finance management tool designed to help users track their income, expenses, and financial goals. This service is provided for personal use only and should not be used for professional financial advice.</p>

              <h2 className="text-xl font-bold">3. User Responsibilities</h2>
              <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>

              <h2 className="text-xl font-bold">4. Intellectual Property</h2>
              <p>FinancialFlow is the sole property of Sunny Jayendra Patel. The service, including its original content, features, and functionality, is protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>

              <h2 className="text-xl font-bold">5. Prohibited Uses</h2>
              <p>You agree not to use FinancialFlow:</p>
              <ul className="list-disc list-inside">
                <li>For any unlawful purpose or to solicit the performance of any illegal activity</li>
                <li>To harass, abuse, or harm another person</li>
                <li>To impersonate or attempt to impersonate the author, another user, or any other person or entity</li>
                <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which, as determined by us, may harm or offend the author or users of the Service or expose them to liability</li>
              </ul>

              <h2 className="text-xl font-bold">6. Disclaimer</h2>
              <p>FinancialFlow is provided on an "as is" and "as available" basis. The author makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

              <h2 className="text-xl font-bold">7. Limitation of Liability</h2>
              <p>In no event shall the author be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>

              <h2 className="text-xl font-bold">8. Changes to Terms</h2>
              <p>The author reserves the right, at his sole discretion, to modify or replace these Terms at any time. It is your responsibility to check these Terms periodically for changes.</p>

              <h2 className="text-xl font-bold">9. Contact Information</h2>
              <p>If you have any questions about these Terms, please contact Sunny Jayendra Patel at sunnypatel124555@gmail.com.</p>

              <h2 className="text-xl font-bold">10. Copyright Notice</h2>
              <p>This web project is protected by copyright. You may not copy, modify, or distribute this work without explicit permission from the author, Sunny Jayendra Patel. Any unauthorized use, reproduction, or distribution of this work may result in severe civil and criminal penalties, and will be prosecuted to the maximum extent possible under the law.</p>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setShowTosDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button 
        variant="outline" 
        className="fixed bottom-4 right-4"
        onClick={() => setShowResetDialog(true)}
      >
        Reset All Data
      </Button>

      <Toaster />
    </div>
  )
}