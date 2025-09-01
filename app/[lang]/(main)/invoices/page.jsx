'use client';
import { useState, useEffect, useCallback } from 'react';
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

export default function Invoices({ params: { lang } }) {
    const isRTL = lang === 'ar';

    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [previewDialog, setPreviewDialog] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');

    // GET THE FIRST DAY OF THE MONTH
    const getFirstDayOfMonth = () => {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1);
    };

    const [dateRange, setDateRange] = useState({
        from: new Date(getFirstDayOfMonth()), // 2 days ago
        to: new Date() // today
    });

    const fetchInvoices = useCallback(async () => {
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
    }, [dateRange]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

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
        return new Date(rowData[field]).toLocaleString(lang === 'en' ? 'en-US' : 'ar-EG', {
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
                <Button icon="pi pi-eye" outlined severity="info" onClick={() => showPreviewDialog(rowData)} tooltip={lang === 'en' ? 'Preview' : 'معاينة'} tooltipOptions={{ position: 'left' }} />
                <Button
                    icon="pi pi-external-link"
                    outlined
                    severity="success"
                    type="button"
                    onClick={() => {
                        router.push(`/${lang}/invoices/${rowData._id}`);
                    }}
                    tooltip={lang === 'en' ? 'Open Details' : 'عرض التفاصيل'}
                    tooltipOptions={{ position: 'left' }}
                />
            </div>
        );
    };

    const showPreviewDialog = (invoice) => {
        setSelectedInvoice(invoice);
        setPreviewDialog(true);
    };

    return (
        <div className="card" dir={lang === 'en' ? 'ltr' : 'rtl'}>
            <div className="mb-4">
                <h2 className="text-3xl font-bold text-primary m-0">{lang === 'en' ? 'Invoices' : 'الفواتير'}</h2>
            </div>

            <div className="surface-100 p-4 border-round mb-4">
                <div className="flex flex-column gap-4">
                    <div className="flex flex-column md:flex-row align-items-center gap-3">
                        <div className="flex-auto">
                            <h3 className="text-lg font-semibold mb-2 flex align-items-center gap-2">
                                <i className="pi pi-calendar text-primary"></i>
                                {lang === 'en' ? 'Date Range' : 'نطاق التاريخ'}
                            </h3>
                            <div className="flex gap-3">
                                <div className="flex-auto">
                                    <Calendar
                                        id="dateFrom"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.value }))}
                                        showIcon
                                        dateFormat="dd/mm/yy"
                                        placeholder={lang === 'en' ? 'From date' : 'من تاريخ'}
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
                                        placeholder={lang === 'en' ? 'To date' : 'إلى تاريخ'}
                                        className="w-full"
                                        panelClassName="p-datepicker-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full">
                        <input
                            type="text"
                            className="p-inputtext p-component w-full text-lg p-3"
                            placeholder={lang === 'en' ? 'Search by client name, phone, car details...' : 'البحث عن طريق اسم العميل، الهاتف، تفاصيل السيارة...'}
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                        />
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
                emptyMessage={lang === 'en' ? 'No invoices found' : 'لم يتم العثور على فواتير'}
                className="p-datatable-striped"
                showGridlines
            >
                <Column field="clientName" header={lang === 'en' ? 'Client Name' : 'اسم العميل'} sortable style={{ minWidth: '200px' }} />
                <Column field="phoneNumber" header={lang === 'en' ? 'Phone Number' : 'رقم الهاتف'} style={{ minWidth: '150px' }} />
                <Column field="carBrand" header={lang === 'en' ? 'Car Brand' : 'ماركة السيارة'} style={{ minWidth: '120px' }} />
                <Column field="carModel" header={lang === 'en' ? 'Car Model' : 'موديل السيارة'} style={{ minWidth: '120px' }} />
                <Column field="date" header={lang === 'en' ? 'Date' : 'التاريخ'} sortable body={dateTemplate} style={{ minWidth: '120px' }} />
                <Column field="paymentStatus" header={lang === 'en' ? 'Status' : 'الحالة'} body={statusTemplate} sortable style={{ minWidth: '120px' }} />

                {/* down payment */}
                <Column field="downPayment" header={lang === 'en' ? 'Down Payment' : 'الدفعة المقدمة'} sortable body={(row) => (row.downPayment ? `${row.downPayment} ${lang === 'en' ? 'EGP' : 'ج.م'}` : `0 ${lang === 'en' ? 'EGP' : 'ج.م'}`)} />

                <Column field="subTotal" header={lang === 'en' ? 'Client Total' : 'إجمالي العميل'} sortable body={(row) => priceTemplate(row, { field: 'subTotal' })} style={{ minWidth: '120px' }} />
                <Column field="fixawiFare" header={lang === 'en' ? 'Sayyn Fare' : 'رسوم صيّن'} body={(row) => priceTemplate(row, { field: 'fixawiFare' })} style={{ minWidth: '120px' }} />
                <Column field="salesTaxAmount" header={lang === 'en' ? 'Tax' : 'ضريبة'} body={(row) => priceTemplate(row, { field: 'salesTaxAmount' })} style={{ minWidth: '120px' }} />
                <Column field="invoiceTotal" header={lang === 'en' ? 'Center Net' : 'صافي المركز'} sortable body={(row) => priceTemplate(row, { field: 'invoiceTotal' })} style={{ minWidth: '120px' }} />
                <Column header={lang === 'en' ? 'Actions' : 'الإجراءات'} body={actionsTemplate} style={{ minWidth: '100px' }} />
            </DataTable>

            <Dialog visible={previewDialog} dir={isRTL ? 'rtl' : 'ltr'} onHide={() => setPreviewDialog(false)} header={lang === 'en' ? 'Invoice Preview' : 'معاينة الفاتورة'} style={{ width: '90%', maxWidth: '800px' }} modal className="p-fluid">
                {selectedInvoice && (
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <h3 className="text-xl mb-3">{lang === 'en' ? 'Client Information' : 'معلومات العميل'}</h3>
                            <div className="surface-100 p-3 border-round mb-3">
                                <p>
                                    <strong>{lang === 'en' ? 'Name:' : 'الاسم:'}</strong> {selectedInvoice.clientName}
                                </p>
                                <p>
                                    <strong>{lang === 'en' ? 'Phone:' : 'الهاتف:'}</strong> {selectedInvoice.phoneNumber}
                                </p>
                                <p>
                                    <strong>{lang === 'en' ? 'Car:' : 'السيارة:'}</strong> {selectedInvoice.carBrand} {selectedInvoice.carModel}
                                </p>
                                <p>
                                    <strong>{lang === 'en' ? 'Date:' : 'التاريخ:'}</strong> {dateTemplate(selectedInvoice)}
                                </p>
                            </div>
                        </div>
                        <div className="col-12 md:col-6">
                            <h3 className="text-xl mb-3">{lang === 'en' ? 'Invoice Status' : 'حالة الفاتورة'}</h3>
                            <div className="surface-100 p-3 border-round mb-3">
                                <p>
                                    <strong>{lang === 'en' ? 'Payment Status:' : 'حالة الدفع:'}</strong> {statusTemplate(selectedInvoice)}
                                </p>
                                {/* paymentMethod */}
                                <p>
                                    <strong>{lang === 'en' ? 'Payment Method:' : 'طريقة الدفع:'}</strong> {selectedInvoice.paymentMethod || (lang === 'en' ? 'N/A' : 'غير متوفر')}
                                </p>

                                <p>
                                    <strong>{lang === 'en' ? 'Created:' : 'تاريخ الإنشاء:'}</strong> {timestampTemplate(selectedInvoice, 'createdAt')}
                                </p>
                                <p>
                                    <strong>{lang === 'en' ? 'Updated:' : 'تاريخ التحديث:'}</strong> {timestampTemplate(selectedInvoice, 'updatedAt')}
                                </p>
                            </div>
                        </div>
                        <div className="col-12">
                            <Divider />
                            <h3 className="text-xl mb-3">{lang === 'en' ? 'Services' : 'الخدمات'}</h3>
                            <div className="surface-100 p-3 border-round mb-3">
                                <DataTable value={selectedInvoice.invoiceDetails} showGridlines className="mb-3">
                                    <Column field="service" header={lang === 'en' ? 'Service' : 'الخدمة'} />
                                    <Column field="quantity" header={lang === 'en' ? 'Quantity' : 'الكمية'} />
                                    <Column field="price" header={lang === 'en' ? 'Price' : 'السعر'} body={(row) => `${row.price?.toFixed(2)} EGP`} />
                                    <Column field="amount" header={lang === 'en' ? 'Amount' : 'المبلغ'} body={(row) => `${row.amount?.toFixed(2)} EGP`} />
                                </DataTable>
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="surface-200 p-3 border-round">
                                <div className="flex justify-content-between">
                                    <span className="font-bold text-blue-700">{lang === 'en' ? 'Client Total:' : 'إجمالي العميل:'}</span>
                                    <span className="text-blue-700 font-bold">{priceTemplate(selectedInvoice, { field: 'subTotal' })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="surface-ground p-3 border-round">
                                <div className="flex justify-content-between mb-2">
                                    <span className="font-semibold">{lang === 'en' ? 'Sayyn Fare:' : 'رسوم صاين:'}</span>
                                    <span>{priceTemplate(selectedInvoice, { field: 'fixawiFare' })}</span>
                                </div>
                                <div className="flex justify-content-between mb-2">
                                    <span className="font-semibold">{lang === 'en' ? 'Tax:' : 'ضريبة:'}</span>
                                    <span>{priceTemplate(selectedInvoice, { field: 'salesTaxAmount' })}</span>
                                </div>

                                <hr style={{ border: '1px dashed #ccc' }} />
                                <div className="flex justify-content-between">
                                    <span className="font-semibold">{lang === 'en' ? '(Sayyn Total):' : '(الإجمالي):'}</span>
                                    <span>{(selectedInvoice.fixawiFare + selectedInvoice.salesTaxAmount).toFixed(2)} EGP</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12">
                            <div className="surface-ground p-3 border-round">
                                <div className="flex justify-content-between">
                                    <span className="font-bold text-xl">{lang === 'en' ? 'Center Net:' : 'صافي المركز:'}</span>
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
