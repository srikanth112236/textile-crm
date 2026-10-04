import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Payroll } from '../types';

export const generateInvoicePDF = (invoice: Invoice) => {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('TEXTILE ENTERPRISE ERP', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('INVOICE / BILL OF SUPPLY', 150, 20);

  // Invoice Meta & Customer Details
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(10);

  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 14, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 14, 48);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, 54);

  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', 120, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`${invoice.customerName}`, 120, 48);
  doc.text(`Phone: ${invoice.customerPhone}`, 120, 54);
  doc.text(`Email: ${invoice.customerEmail}`, 120, 60);
  doc.text(`Address: ${invoice.customerAddress}`, 120, 66);

  // Items Table
  const tableData = invoice.items.map((item, index) => [
    index + 1,
    item.sku,
    item.name,
    item.quantity,
    `Rs. ${item.unitPrice.toFixed(2)}`,
    `${item.discountPercentage}%`,
    `Rs. ${item.totalPrice.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['#', 'SKU', 'Product Name', 'Qty', 'Unit Price', 'Disc %', 'Total']],
    body: tableData,
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 120;

  // Summary Totals
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal:`, 130, finalY + 10);
  doc.text(`Rs. ${invoice.subTotal.toFixed(2)}`, 175, finalY + 10);

  if (invoice.discountAmount > 0) {
    doc.text(`Discount:`, 130, finalY + 16);
    doc.text(`- Rs. ${invoice.discountAmount.toFixed(2)}`, 175, finalY + 16);
  }

  doc.text(`GST Tax (${invoice.taxRate}%):`, 130, finalY + 22);
  doc.text(`Rs. ${invoice.taxAmount.toFixed(2)}`, 175, finalY + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Grand Total:`, 130, finalY + 30);
  doc.text(`Rs. ${invoice.grandTotal.toFixed(2)}`, 175, finalY + 30);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for doing business with Textile Enterprise ERP!', 14, 280);

  doc.save(`${invoice.invoiceNumber}.pdf`);
};

export const generatePayslipPDF = (payroll: Payroll) => {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TEXTILE ENTERPRISE ERP', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('EMPLOYEE SALARY PAYSLIP', 140, 18);
  doc.text(`Month: ${payroll.month}/${payroll.year}`, 140, 25);

  // Employee Meta
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(10);

  doc.setFont('helvetica', 'bold');
  doc.text('Employee Details', 14, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${payroll.employeeName}`, 14, 48);
  doc.text(`Employee Code: ${payroll.employeeCode}`, 14, 54);
  doc.text(`Payslip Ref: ${payroll.payrollNumber}`, 14, 60);

  doc.setFont('helvetica', 'bold');
  doc.text('Attendance & Hours Log', 120, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Working Days: ${payroll.totalWorkingDays}`, 120, 48);
  doc.text(`Days Present: ${payroll.daysPresent}`, 120, 54);
  doc.text(`Days Absent: ${payroll.daysAbsent}`, 120, 60);
  doc.text(`Hours Worked: ${payroll.totalHoursWorked} hrs (Required: ${payroll.requiredHours} hrs)`, 120, 66);

  // Salary Breakdown Table
  const tableData = [
    ['Base Monthly Salary', `Rs. ${payroll.baseSalary.toLocaleString()}`],
    ['Unpaid Leave Deductions', `- Rs. ${payroll.unpaidLeaveDeductions.toLocaleString()}`],
    ['Short Hours Penalty Deductions', `- Rs. ${payroll.hourlyDeductions.toLocaleString()}`],
    ['NET PAYABLE SALARY', `Rs. ${payroll.netSalary.toLocaleString()}`],
  ];

  autoTable(doc, {
    startY: 75,
    head: [['Salary Component', 'Amount']],
    body: tableData,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 130;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Payment Status: ${payroll.status.toUpperCase()}`, 14, finalY + 15);
  if (payroll.paidAt) {
    doc.text(`Paid Date: ${new Date(payroll.paidAt).toLocaleDateString()}`, 14, finalY + 22);
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('This is a system generated payslip and requires no signature.', 14, 280);

  doc.save(`${payroll.payrollNumber}.pdf`);
};
