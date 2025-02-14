'use client';
import { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Invoices() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [previewDialog, setPreviewDialog] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [dateRange, setDateRange] = useState({
        from: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        to: new Date() // today
    });

    const fetchInvoices = async () => {
        // GET TOKEN
        const token = localStorage.getItem('token');

        setLoading(true);
        try {
            // Format dates as MM-DD-YYYY
            const formatDate = (date) => {
                return date
                    .toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric'
                    })
                    .replace(/\//g, '-');
            };

            const response = await axios.get(`${process.env.API_URL}/service/center/invoices?dateFrom=${formatDate(dateRange.from)}&dateTo=${formatDate(dateRange.to)}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200 && response.data.success) {
                setInvoices(response.data.invoices);
            } else {
                console.warn('API response indicates failure:', response.data);
                toast.error('Failed to fetch invoices');
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [dateRange]);

    // Templates
    const priceTemplate = (rowData, column) => {
        return `${rowData[column.field]?.toFixed(2)} EGP`;
    };

    const dateTemplate = (rowData) => {
        return new Date(rowData.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const statusTemplate = (rowData) => {
        const severity = rowData.paymentStatus === 'paid' ? 'success' : 'warning';
        return <Tag severity={severity} value={rowData.paymentStatus} />;
    };

    const timestampTemplate = (rowData, field) => {
        return new Date(rowData[field]).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const actionsTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-eye" outlined severity="info" onClick={() => showPreviewDialog(rowData)} tooltip="Preview" tooltipOptions={{ position: 'left' }} />
                <Button icon="pi pi-external-link" outlined severity="success" onClick={() => router.push(`/invoices/${rowData._id}`)} tooltip="Open Details" tooltipOptions={{ position: 'left' }} />
            </div>
        );
    };

    const showPreviewDialog = (invoice) => {
        setSelectedInvoice(invoice);
        setPreviewDialog(true);
    };

    return (
        <div className="card">
            <div className="mb-4">
                <h2 className="text-3xl font-bold text-primary m-0">Invoices</h2>
            </div>

            <div className="surface-100 p-4 border-round mb-4">
                <div className="flex flex-column gap-4">
                    <div className="flex flex-column md:flex-row align-items-center gap-3">
                        <div className="flex-auto">
                            <h3 className="text-lg font-semibold mb-2 flex align-items-center gap-2">
                                <i className="pi pi-calendar text-primary"></i>
                                Date Range
                            </h3>
                            <div className="flex gap-3">
                                <div className="flex-auto">
                                    <Calendar
                                        id="dateFrom"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.value }))}
                                        showIcon
                                        dateFormat="dd/mm/yy"
                                        placeholder="From date"
                                        className="w-full"
                                        panelClassName="p-datepicker-lg"
                                    />
                                </div>
                                <div className="flex-auto">
                                    <Calendar
                                        id="dateTo"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.value }))}
                                        showIcon
                                        dateFormat="dd/mm/yy"
                                        placeholder="To date"
                                        className="w-full"
                                        panelClassName="p-datepicker-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full">
                        <input type="text" className="p-inputtext p-component w-full text-lg p-3" placeholder="Search by client name, phone, car details..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
                    </div>
                </div>
            </div>

            <DataTable
                value={invoices}
                loading={loading}
                paginator
                rows={100}
                rowsPerPageOptions={[100, 200, 300, 400, 500]}
                globalFilter={globalFilter}
                globalFilterFields={['clientName', 'phoneNumber', 'carBrand', 'carModel', 'paymentStatus']}
                sortMode="multiple"
                removableSort
                responsiveLayout="scroll"
                emptyMessage="No invoices found"
                className="p-datatable-striped"
                showGridlines
            >
                <Column field="clientName" header="Client Name" sortable style={{ minWidth: '200px' }} />
                <Column field="phoneNumber" header="Phone Number" style={{ minWidth: '150px' }} />
                <Column field="carBrand" header="Car Brand" style={{ minWidth: '120px' }} />
                <Column field="carModel" header="Car Model" style={{ minWidth: '120px' }} />
                <Column field="date" header="Date" sortable body={dateTemplate} style={{ minWidth: '120px' }} />
                <Column field="paymentStatus" header="Status" body={statusTemplate} sortable style={{ minWidth: '120px' }} />
                <Column field="subTotal" header="Subtotal" sortable body={(row) => priceTemplate(row, { field: 'subTotal' })} style={{ minWidth: '120px' }} />
                <Column field="fixawiFare" header="Fixawi Fare" body={(row) => priceTemplate(row, { field: 'fixawiFare' })} style={{ minWidth: '120px' }} />
                <Column field="salesTaxAmount" header="Sales Tax" body={(row) => priceTemplate(row, { field: 'salesTaxAmount' })} style={{ minWidth: '120px' }} />
                <Column field="invoiceTotal" header="Total" sortable body={(row) => priceTemplate(row, { field: 'invoiceTotal' })} style={{ minWidth: '120px' }} />
                <Column header="Actions" body={actionsTemplate} style={{ minWidth: '100px' }} />
            </DataTable>

            <Dialog visible={previewDialog} onHide={() => setPreviewDialog(false)} header="Invoice Preview" style={{ width: '90%', maxWidth: '800px' }} modal className="p-fluid">
                {selectedInvoice && (
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <h3 className="text-xl mb-3">Client Information</h3>
                            <div className="surface-100 p-3 border-round mb-3">
                                <p>
                                    <strong>Name:</strong> {selectedInvoice.clientName}
                                </p>
                                <p>
                                    <strong>Phone:</strong> {selectedInvoice.phoneNumber}
                                </p>
                                <p>
                                    <strong>Car:</strong> {selectedInvoice.carBrand} {selectedInvoice.carModel}
                                </p>
                                <p>
                                    <strong>Date:</strong> {dateTemplate(selectedInvoice)}
                                </p>
                            </div>
                        </div>
                        <div className="col-12 md:col-6">
                            <h3 className="text-xl mb-3">Invoice Status</h3>
                            <div className="surface-100 p-3 border-round mb-3">
                                <p>
                                    <strong>Payment Status:</strong> {statusTemplate(selectedInvoice)}
                                </p>
                                <p>
                                    <strong>Created:</strong> {timestampTemplate(selectedInvoice, 'createdAt')}
                                </p>
                                <p>
                                    <strong>Updated:</strong> {timestampTemplate(selectedInvoice, 'updatedAt')}
                                </p>
                            </div>
                        </div>
                        <div className="col-12">
                            <Divider />
                            <h3 className="text-xl mb-3">Services</h3>
                            <div className="surface-100 p-3 border-round mb-3">
                                <DataTable value={selectedInvoice.invoiceDetails} showGridlines className="mb-3">
                                    <Column field="service" header="Service" />
                                    <Column field="quantity" header="Quantity" />
                                    <Column field="price" header="Price" body={(row) => `${row.price?.toFixed(2)} EGP`} />
                                    <Column field="amount" header="Amount" body={(row) => `${row.amount?.toFixed(2)} EGP`} />
                                </DataTable>
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="surface-ground p-3 border-round">
                                <div className="flex justify-content-between mb-2">
                                    <span className="font-semibold">Subtotal:</span>
                                    <span>{priceTemplate(selectedInvoice, { field: 'subTotal' })}</span>
                                </div>
                                <div className="flex justify-content-between mb-2">
                                    <span className="font-semibold">Fixawi Fare:</span>
                                    <span>{priceTemplate(selectedInvoice, { field: 'fixawiFare' })}</span>
                                </div>
                                <div className="flex justify-content-between mb-2">
                                    <span className="font-semibold">Sales Tax:</span>
                                    <span>{priceTemplate(selectedInvoice, { field: 'salesTaxAmount' })}</span>
                                </div>
                                <Divider />
                                <div className="flex justify-content-between">
                                    <span className="font-bold text-xl">Total:</span>
                                    <span className="font-bold text-xl">{priceTemplate(selectedInvoice, { field: 'invoiceTotal' })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
}
