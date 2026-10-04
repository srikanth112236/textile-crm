export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee' | 'customer';
  mustChangePassword: boolean;
  employeeId?: string;
  customerId?: string;
  employeeInfo?: Employee;
}

export interface Employee {
  _id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  baseSalary: number;
  mandatoryWorkingHours: number;
  status: 'active' | 'inactive';
  userId?: string;
}

export interface Customer {
  _id: string;
  customerCode: string;
  name: string;
  contactPerson?: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  goodsCategory?: string;
  creditLimit?: number;
  paymentTerms?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
}

export interface Product {
  _id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  purchasePrice?: number;
  stockQuantity: number;
  minStockLevel?: number;
  taxRate?: number;
  description?: string;
}

export interface Attendance {
  _id: string;
  employee: string | Employee;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours: number;
  mandatoryHours: number;
  metMandatoryHours: boolean;
  status: 'present' | 'absent' | 'half_day' | 'leave';
  notes?: string;
}

export interface InvoiceItem {
  product?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  totalPrice: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customer?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  status: 'paid' | 'pending' | 'cancelled';
  issueDate: string;
}

export interface Payroll {
  _id: string;
  payrollNumber: string;
  employee: string | Employee;
  employeeCode: string;
  employeeName: string;
  month: number;
  year: number;
  totalWorkingDays: number;
  daysPresent: number;
  daysAbsent: number;
  totalHoursWorked: number;
  requiredHours: number;
  baseSalary: number;
  hourlyDeductions: number;
  unpaidLeaveDeductions: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  paidAt?: string;
  notes?: string;
}

export interface LeaveRequest {
  _id: string;
  employee: string | Employee;
  employeeCode: string;
  employeeName: string;
  leaveType: 'casual' | 'sick' | 'unpaid';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'payroll' | 'leave' | 'attendance' | 'system';
  isRead: boolean;
  createdAt: string;
}
