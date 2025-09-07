'use client';
import { useState, useEffect, useCallback } from 'react';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function GetCheckReports({ lang }) {
    const isRTL = lang === 'ar';

    const router = useRouter();

    const [date, setDate] = useState(new Date());
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [globalFilter, setGlobalFilter] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [reportToDelete, setReportToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchReports = useCallback(
        async (e) => {
            if (e) e.preventDefault();

            if (!date) {
                return toast.error(lang === 'en' ? 'Please select a date' : 'يرجى اختيار تاريخ');
            }

            try {
                setLoading(true);

                const token = localStorage.getItem('token');
                const response = await axios.get(`${process.env.API_URL}/check/reports`, {
                    params: { date },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // Ensure reports is always an array
                const reportsData = Array.isArray(response?.data?.checkReports) ? response.data?.checkReports : [];
                setReports(reportsData);
            } catch (error) {
                toast.error(error.response?.data?.message || (lang === 'en' ? 'Failed to fetch reports' : 'فشل في جلب التقارير'));
            } finally {
                setLoading(false);
            }
        },
        [date, lang]
    );

    // Fetch reports for today when component mounts
    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    return (
        <div className="card" dir={isRTL ? 'rtl' : 'ltr'}>
            <h3 className="text-2xl mb-5 uppercase">{lang === 'en' ? 'Get Check Reports' : 'استرجاع تقارير الفحص'}</h3>
            <hr />

            <div className="flex justify-content-between">
                <div className="flex gap-3 mb-5">
                    <Calendar value={date} onChange={(e) => setDate(e.value)} dateFormat="mm/dd/yy" placeholder={lang === 'en' ? 'Select date' : 'اختر التاريخ'} showIcon />
                    <Button label={lang === 'en' ? 'Get Reports' : 'استرجاع التقارير'} icon="pi pi-search" onClick={fetchReports} loading={loading} />
                </div>

                <div className="flex justify-content-between mb-3">
                    <span className="p-input-icon-left flex align-items-center">
                        <i className="pi pi-search" />
                        <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder={lang === 'en' ? 'Search...' : 'بحث...'} />
                    </span>
                </div>
            </div>

            <DataTable value={reports} loading={loading} paginator rows={100} globalFilter={globalFilter} emptyMessage={lang === 'en' ? 'No reports found' : 'لم يتم العثور على تقارير'}>
                <Column field="clientName" header={lang === 'en' ? 'Client Name' : 'اسم العميل'} sortable />
                <Column field="phoneNumber" header={lang === 'en' ? 'Phone Number' : 'رقم الهاتف'} sortable />
                <Column field="carBrand" header={lang === 'en' ? 'Car Brand' : 'ماركة السيارة'} sortable />
                <Column field="carModel" header={lang === 'en' ? 'Car Model' : 'موديل السيارة'} sortable />
                {/* down payment */}
                <Column field="downPayment" header={lang === 'en' ? 'Down Payment' : 'الدفعة المقدمة'} sortable body={(row) => (row.downPayment ? `${row.downPayment} ${lang === 'en' ? 'EGP' : 'ج.م'}` : `0 ${lang === 'en' ? 'EGP' : 'ج.م'}`)} />

                <Column field="total" header={lang === 'en' ? 'Total' : 'الإجمالي'} sortable body={(row) => `${row.total} ${lang === 'en' ? 'EGP' : 'ج.م'}`} />
                <Column
                    field="date"
                    header={lang === 'en' ? 'Booking Date' : 'تاريخ الحجز'}
                    sortable
                    body={(row) => {
                        const dateObj = new Date(row.date);
                        return dateObj.toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }}
                />
                {/* CreatedAt */}
                <Column
                    field="createdAt"
                    header={lang === 'en' ? 'Created At' : 'تاريخ الإنشاء'}
                    sortable
                    body={(row) => {
                        const dateObj = new Date(row.createdAt);
                        return dateObj.toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }}
                />
                {/* reportStatus */}
                <Column field="reportStatus" header={lang === 'en' ? 'Report Status' : 'حالة التقرير'} sortable />
                {/* clientApproved */}
                <Column
                    body={(row) => (
                        <div className="flex gap-2">
                            {/* add a button for creating an invoice which will redirect to the /invoices/create?check-report-id */}
                            {row.reportStatus !== 'invoiced' && (
                                <Button
                                    tooltip={lang === 'en' ? 'Create Invoice' : 'إنشاء فاتورة'}
                                    icon="pi pi-file"
                                    className="p-button-rounded p-button-success p-button-text"
                                    onClick={() => {
                                        const searchParamsObj = {
                                            'check-report-id': row._id,
                                            userId: row.userId,
                                            downPayment: row.downPayment || 0
                                        }

                                        const searchParams = new URLSearchParams(searchParamsObj);
                                        router.push(`/invoices/create?${searchParams.toString()}`);
                                    }}
                                />
                            )}

                            <Button
                                tooltip={lang === 'en' ? 'Check Report Details' : 'تفاصيل تقرير الفحص'}
                                icon="pi pi-eye"
                                className="p-button-rounded p-button-text"
                                onClick={() => {
                                    setSelectedReport(row);
                                    setDialogVisible(true);
                                }}
                            />
                            {row.reportStatus !== 'invoiced' && (
                                <Button
                                    tooltip={lang === 'en' ? 'Delete Report' : 'حذف التقرير'}
                                    icon="pi pi-trash"
                                    className="p-button-rounded p-button-danger p-button-text"
                                    onClick={() => {
                                        setReportToDelete(row);
                                        setDeleteDialogVisible(true);
                                    }}
                                />
                            )}
                        </div>
                    )}
                />
            </DataTable>

            <Dialog header={lang === 'en' ? 'Check Report Details' : 'تفاصيل تقرير الفحص'} visible={dialogVisible} style={{ width: '50vw' }} onHide={() => setDialogVisible(false)}>
                {selectedReport && (
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <h5>{lang === 'en' ? 'Client Information' : 'معلومات العميل'}</h5>
                            <p>
                                <strong>{lang === 'en' ? 'Name' : 'الاسم'}:</strong> {selectedReport.clientName}
                            </p>
                            <p>
                                <strong>{lang === 'en' ? 'Phone' : 'الهاتف'}:</strong> {selectedReport.phoneNumber}
                            </p>
                        </div>
                        <div className="col-12 md:col-6">
                            <h5>{lang === 'en' ? 'Car Information' : 'معلومات السيارة'}</h5>
                            <p>
                                <strong>{lang === 'en' ? 'Brand' : 'الماركة'}:</strong> {selectedReport.carBrand}
                            </p>
                            <p>
                                <strong>{lang === 'en' ? 'Model' : 'الموديل'}:</strong> {selectedReport.carModel}
                            </p>
                        </div>
                        <div className="col-12">
                            <h5>{lang === 'en' ? 'Check Details' : 'تفاصيل الفحص'}</h5>
                            {/* DOWN PAYMENT */}
                            {selectedReport.downPayment > 0 && (
                                <p>
                                    <strong>{lang === 'en' ? 'Down Payment' : 'الدفعة المقدمة'}:</strong> {selectedReport.downPayment} {lang === 'en' ? 'EGP' : 'ج.م'}
                                </p>
                            )}

                            <DataTable value={selectedReport.checkDetails} size="small">
                                <Column field="service" header={lang === 'en' ? 'Service' : 'الخدمة'} />
                                <Column field="quantity" header={lang === 'en' ? 'Quantity' : 'الكمية'} />
                                <Column field="price" header={lang === 'en' ? 'Price' : 'السعر'} />
                                <Column field="amount" header={lang === 'en' ? 'Amount' : 'المبلغ'} />
                                <Column field="clientApproved" header={lang === 'en' ? 'Client Approved' : 'موافقة العميل'} body={(row) => (row.clientApproved ? <i className="pi pi-check" /> : <i className="pi pi-times" />)} />
                            </DataTable>
                        </div>
                    </div>
                )}
            </Dialog>

            <Dialog
                header={lang === 'en' ? 'Delete Check Report' : 'حذف تقرير الفحص'}
                visible={deleteDialogVisible}
                style={{ width: '30vw' }}
                onHide={() => setDeleteDialogVisible(false)}
                footer={
                    <div>
                        <Button label={lang === 'en' ? 'Cancel' : 'إلغاء'} icon="pi pi-times" className="p-button-text" onClick={() => setDeleteDialogVisible(false)} />
                        <Button
                            label={lang === 'en' ? 'Delete' : 'حذف'}
                            icon="pi pi-trash"
                            className="p-button-danger"
                            loading={deleteLoading}
                            onClick={async () => {
                                try {
                                    setDeleteLoading(true);
                                    const token = localStorage.getItem('token');
                                    await axios.delete(`${process.env.API_URL}/delete/check/report`, {
                                        params: { checkReportId: reportToDelete._id },
                                        headers: {
                                            Authorization: `Bearer ${token}`
                                        }
                                    });

                                    setReports(reports.filter((report) => report._id !== reportToDelete._id));
                                    setDeleteDialogVisible(false);
                                    toast.success(lang === 'en' ? 'Report deleted successfully' : 'تم حذف التقرير بنجاح');
                                } catch (error) {
                                    toast.error(error.response?.data?.message || (lang === 'en' ? 'Failed to delete report' : 'فشل في حذف التقرير'));
                                } finally {
                                    setDeleteLoading(false);
                                }
                            }}
                        />
                    </div>
                }
            >
                <p>{lang === 'en' ? 'Are you sure you want to delete this report?' : 'هل أنت متأكد من رغبتك في حذف هذا التقرير؟'}</p>
            </Dialog>
        </div>
    );
}
