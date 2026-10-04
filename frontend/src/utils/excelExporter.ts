import * as XLSX from 'xlsx';
import { Employee } from '../types';

export const exportEmployeesToExcel = (employees: Employee[]) => {
  const data = employees.map((emp) => ({
    'Employee Code': emp.employeeCode,
    'First Name': emp.firstName,
    'Last Name': emp.lastName,
    Email: emp.email,
    Phone: emp.phone,
    Department: emp.department,
    Designation: emp.designation,
    'Base Salary (INR)': emp.baseSalary,
    'Mandatory Working Hours': emp.mandatoryWorkingHours,
    Status: emp.status,
    'Joining Date': new Date(emp.joiningDate).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

  XLSX.writeFile(workbook, `Textile_Employees_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const downloadEmployeeSampleExcel = () => {
  const sampleData = [
    {
      'Employee Code': 'EMP-1001',
      'First Name': 'Rajesh',
      'Last Name': 'Kumar',
      'Email': 'rajesh.kumar@textile-erp.com',
      'Phone': '9876543210',
      'Department': 'Production & Weaving',
      'Designation': 'Senior Loom Operator',
      'Base Salary': 35000,
      'Mandatory Working Hours': 8,
      'Status': 'active',
      'Joining Date': '2025-01-15',
    },
    {
      'Employee Code': 'EMP-1002',
      'First Name': 'Priya',
      'Last Name': 'Sharma',
      'Email': 'priya.sharma@textile-erp.com',
      'Phone': '9876543211',
      'Department': 'Quality Assurance',
      'Designation': 'Fabric Inspector',
      'Base Salary': 28000,
      'Mandatory Working Hours': 8,
      'Status': 'active',
      'Joining Date': '2025-02-01',
    },
    {
      'Employee Code': 'EMP-1003',
      'First Name': 'Amit',
      'Last Name': 'Verma',
      'Email': 'amit.verma@textile-erp.com',
      'Phone': '9876543212',
      'Department': 'Dyeing & Printing',
      'Designation': 'Technician',
      'Base Salary': 32000,
      'Mandatory Working Hours': 8,
      'Status': 'active',
      'Joining Date': '2025-03-10',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Import Template');

  XLSX.writeFile(workbook, 'Textile_ERP_Employee_Import_Sample.xlsx');
};
