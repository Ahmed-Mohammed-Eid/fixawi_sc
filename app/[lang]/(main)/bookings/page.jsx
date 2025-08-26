'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// PRIME REACT
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { InputTextarea } from 'primereact/inputtextarea';

export default function ServiceCenterBookingsPage({ params: { lang } }) {
    const router = useRouter();

    // STATES
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bookingStats, setBookingStats] = useState({ pending: 0, invoiced: 0, checking: 0, total: 0 });
    const [infoDialog, setInfoDialog] = useState({
        visible: false,
        data: null
    });
    const [cancelDialog, setCancelDialog] = useState({
        visible: false,
        data: null,
        reason: ''
    });

    const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [month, day, year].join('-');
    };

    const calculateBookingStats = (bookingsData) => {
        if (!bookingsData || bookingsData.length === 0) {
            setBookingStats({ pending: 0, invoiced: 0, checking: 0, total: 0 });
            return;
        }

        let pending = 0;
        let invoiced = 0;
        let checking = 0;

        bookingsData.forEach((booking) => {
            switch (booking.bookingStatus?.toLowerCase()) {
                case 'pending':
                    pending++;
                    break;
                case 'invoiced':
                    invoiced++;
                    break;
                case 'checking':
                    checking++;
                    break;
                default:
                    break;
            }
        });

        setBookingStats({
            pending,
            invoiced,
            checking,
            total: bookingsData.length
        });
    };

    const fetchBookings = useCallback(
        async (dateFromParam, dateToParam) => {
            setLoading(true);
            setBookings([]);
            setBookingStats({ pending: 0, invoiced: 0, checking: 0, total: 0 });
            try {
                const token = localStorage.getItem('token');
                const params = {};

                const formattedDateFrom = formatDate(dateFromParam);
                const formattedDateTo = formatDate(dateToParam);

                if (formattedDateFrom) {
                    params.dateFrom = formattedDateFrom;
                }
                if (formattedDateTo) {
                    params.dateTo = formattedDateTo;
                }

                // Changed endpoint to bookings
                const response = await axios.get(`${process.env.API_URL}/bookings/calendar`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    params
                });

                const fetchedBookings = response.data.bookings || [];
                setBookings(fetchedBookings);
                calculateBookingStats(fetchedBookings);

                if (fetchedBookings.length === 0) {
                    toast.success(lang === 'en' ? 'No bookings found for the selected criteria.' : 'لم يتم العثور على حجوزات للمعايير المحددة.');
                }
            } catch (error) {
                console.error('Failed to fetch bookings:', error);
                toast.error(error?.response?.data?.message || (lang === 'en' ? 'Failed to load bookings.' : 'فشل تحميل الحجوزات.'));
                setBookings([]);
                setBookingStats({ pending: 0, invoiced: 0, checking: 0, total: 0 });
            } finally {
                setLoading(false);
            }
        },
        [lang]
    );

    // Set default date range on first render (first day of month to current day)
    useEffect(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        setDateFrom(firstDayOfMonth);
        setDateTo(now);

        // Fetch bookings with default date range
        fetchBookings(firstDayOfMonth, now);
    }, [fetchBookings]); // Empty dependency array ensures this runs only once on mount

    // Handler for search button

    const handleSearchBookings = () => {
        fetchBookings(dateFrom, dateTo);
    };

    const handleCancelBooking = async () => {
        if (!cancelDialog.reason.trim()) {
            toast.error(lang === 'en' ? 'Please enter a cancellation reason.' : 'يرجى إدخال سبب الإلغاء.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const booking = cancelDialog.data;

            // Format date as MM-DD-YYYY
            const formattedDate = new Date(booking.date).toLocaleDateString('en-US');

            const params = {
                serviceId: booking.serviceId,
                slotId: booking.slotId,
                date: formattedDate,
                phone: booking.clientPhone,
                clientId: booking.clientId,
                reason: cancelDialog.reason
            };

            await axios.delete(`${process.env.API_URL}/cancel/booking`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params
            });

            // Update the booking status in the local state
            setBookings((prevBookings) => prevBookings.map((b) => (b._id === booking._id ? { ...b, bookingStatus: 'cancelled' } : b)));

            // Update stats
            calculateBookingStats(bookings.map((b) => (b._id === booking._id ? { ...b, bookingStatus: 'cancelled' } : b)));

            // Close dialog and reset reason
            setCancelDialog({
                visible: false,
                data: null,
                reason: ''
            });

            toast.success(lang === 'en' ? 'Booking cancelled successfully.' : 'تم إلغاء الحجز بنجاح.');
        } catch (error) {
            console.error('Failed to cancel booking:', error);
            toast.error(error?.response?.data?.message || (lang === 'en' ? 'Failed to cancel booking.' : 'فشل إلغاء الحجز.'));
        }
    };

    return (
        <div className="card" dir={lang === 'en' ? 'ltr' : 'rtl'}>
            <h1 className="text-2xl mb-5 uppercase">{lang === 'en' ? 'Service Center Bookings' : 'حجوزات مراكز الخدمة'}</h1>

            {/* Stats Section - Updated for bookings */}
            <div className="grid mb-4">
                <div className="col-12 md:col-6 lg:col-3">
                    <div className="card surface-card shadow-2 p-3 border-1 border-50 border-round">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">{lang === 'en' ? 'Total Bookings' : 'إجمالي الحجوزات'}</span>
                                <div className="text-900 font-medium text-xl">{bookingStats.total}</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-list text-blue-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                    <div className="card surface-card shadow-2 p-3 border-1 border-50 border-round">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">{lang === 'en' ? 'Pending' : 'قيد الانتظار'}</span>
                                <div className="text-900 font-medium text-xl">{bookingStats.pending}</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-clock text-orange-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                    <div className="card surface-card shadow-2 p-3 border-1 border-50 border-round">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">{lang === 'en' ? 'Invoiced' : 'تم الفوترة'}</span>
                                <div className="text-900 font-medium text-xl">{bookingStats.invoiced}</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-file text-cyan-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 md:col-6 lg:col-3">
                    <div className="card surface-card shadow-2 p-3 border-1 border-50 border-round">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">{lang === 'en' ? 'Checking' : 'قيد المراجعة'}</span>
                                <div className="text-900 font-medium text-xl">{bookingStats.checking}</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-green-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-check-circle text-green-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section - Same as visits page */}
            <div className="p-fluid formgrid grid mb-4">
                <div className="field col-12 md:col-5">
                    <label htmlFor="dateFrom" className="font-medium mb-2 block">
                        {lang === 'en' ? 'Date From' : 'من تاريخ'}
                    </label>
                    <Calendar id="dateFrom" value={dateFrom} onChange={(e) => setDateFrom(e.value)} dateFormat="mm/dd/yy" placeholder={lang === 'en' ? 'MM/DD/YYYY' : 'يوم/شهر/سنة'} showIcon className="w-full" />
                </div>

                <div className="field col-12 md:col-5">
                    <label htmlFor="dateTo" className="font-medium mb-2 block">
                        {lang === 'en' ? 'Date To' : 'إلى تاريخ'}
                    </label>
                    <Calendar id="dateTo" value={dateTo} onChange={(e) => setDateTo(e.value)} dateFormat="mm/dd/yy" placeholder={lang === 'en' ? 'MM/DD/YYYY' : 'يوم/شهر/سنة'} showIcon minDate={dateFrom} className="w-full" />
                </div>

                <div className="field col-12 md:col-2 flex align-items-end">
                    <Button label={lang === 'en' ? 'Search' : 'بحث'} icon="pi pi-search" onClick={handleSearchBookings} loading={loading} disabled={loading} className="w-full" />
                </div>
            </div>

            {/* DataTable Section - Updated for bookings */}
            <DataTable
                value={bookings}
                loading={loading}
                responsiveLayout="scroll"
                emptyMessage={lang === 'en' ? 'No bookings found.' : 'لم يتم العثور على حجوزات.'}
                paginator
                rows={10}
                currentPageReportTemplate={lang === 'en' ? 'Showing {first} to {last} of {totalRecords} entries' : 'عرض {first} إلى {last} من {totalRecords} إدخال'}
            >
                <Column field="_id" header={lang === 'en' ? 'Booking ID' : 'معرف الحجز'} sortable style={{ minWidth: '150px' }} />
                <Column field="date" header={lang === 'en' ? 'Date' : 'التاريخ'} sortable body={(rowData) => (rowData.date ? new Date(rowData.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG') : '-')} style={{ minWidth: '150px' }} />
                <Column field="time" header={lang === 'en' ? 'Time' : 'الوقت'} sortable body={(rowData) => (rowData.time ? `${rowData.time}:00` : '-')} style={{ minWidth: '100px' }} />
                <Column field="clientName" header={lang === 'en' ? 'Client Name' : 'اسم العميل'} sortable style={{ minWidth: '150px' }} />
                <Column field="clientPhone" header={lang === 'en' ? 'Phone' : 'الهاتف'} sortable style={{ minWidth: '130px' }} />
                <Column field="carBrand" header={lang === 'en' ? 'Car Brand' : 'ماركة السيارة'} sortable style={{ minWidth: '150px' }} />
                <Column field="carModel" header={lang === 'en' ? 'Car Model' : 'موديل السيارة'} sortable style={{ minWidth: '150px' }} />
                <Column field="serviceName" header={lang === 'en' ? 'Service' : 'الخدمة'} sortable style={{ minWidth: '150px' }} />
                <Column field="serviceCenterTitle" header={lang === 'en' ? 'Service Center' : 'مركز الخدمة'} sortable body={(rowData) => (lang === 'en' ? rowData.serviceCenterTitleEn : rowData.serviceCenterTitle)} style={{ minWidth: '200px' }} />
                <Column
                    field="bookingStatus"
                    header={lang === 'en' ? 'Status' : 'الحالة'}
                    sortable
                    body={(rowData) => <Tag value={rowData.bookingStatus} severity={rowData.bookingStatus === 'invoiced' ? 'success' : rowData.bookingStatus === 'checking' ? 'info' : 'warning'} />}
                    style={{ minWidth: '120px' }}
                />
                {/* Has Promotion */}
                <Column
                    field="promotionId"
                    header={lang === 'en' ? 'Has Promotion' : 'يحتوي على ترقية'}
                    sortable
                    body={(rowData) => <Tag value={lang === 'en' ? (rowData.promotionId ? 'Yes' : 'No') : rowData.promotionId ? 'نعم' : 'لا'} severity={rowData.promotionId ? 'success' : 'danger'} />}
                    style={{ minWidth: '130px' }}
                />
                <Column
                    body={(rowData) => (
                        <div className="flex justify-center gap-2">
                            <button
                                className="p-button p-button-info p-button-text"
                                onClick={() => {
                                    setInfoDialog({
                                        visible: true,
                                        data: rowData
                                    });
                                }}
                            >
                                <i className="pi pi-eye"></i>
                            </button>
                            {rowData.bookingStatus !== 'cancelled' && (
                                <button
                                    className="p-button p-button-danger p-button-text"
                                    onClick={() => {
                                        setCancelDialog({
                                            visible: true,
                                            data: rowData,
                                            reason: ''
                                        });
                                    }}
                                >
                                    <i className="pi pi-times"></i>
                                </button>
                            )}
                        </div>
                    )}
                    header={lang === 'en' ? 'Actions' : 'الإجراءات'}
                    style={{ width: '10%' }}
                />
            </DataTable>

            {/* INFO DIALOG - Updated for bookings */}
            <Dialog
                visible={infoDialog.visible}
                onHide={() => setInfoDialog({ visible: false, data: null })}
                header={lang === 'en' ? 'Booking Information' : 'معلومات الحجز'}
                position="center"
                style={{ width: '100%', maxWidth: '1000px' }}
                draggable={false}
                resizable={false}
                dir={lang === 'en' ? 'ltr' : 'rtl'}
            >
                {infoDialog.data && (
                    <div className="p-fluid formgrid grid card mx-0">
                        <div className="field col-12 md:col-6">
                            <h5>{lang === 'en' ? 'Booking ID' : 'معرف الحجز'}</h5>
                            <p>{infoDialog.data._id}</p>
                        </div>
                        <div className="field col-12 md:col-6">
                            <h5>{lang === 'en' ? 'Date' : 'التاريخ'}</h5>
                            <p>{infoDialog.data.date ? new Date(infoDialog.data.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG') : '-'}</p>
                        </div>
                        <div className="field col-12 md:col-6">
                            <h5>{lang === 'en' ? 'Time' : 'الوقت'}</h5>
                            <p>{infoDialog.data.time ? `${infoDialog.data.time}:00` : '-'}</p>
                        </div>
                        <div className="field col-12 md:col-6">
                            <h5>{lang === 'en' ? 'Status' : 'الحالة'}</h5>
                            <Tag value={infoDialog.data.bookingStatus} severity={infoDialog.data.bookingStatus === 'invoiced' ? 'success' : infoDialog.data.bookingStatus === 'checking' ? 'info' : 'warning'} />
                        </div>
                        <div className="field col-12 md:col-6">
                            <h5>{lang === 'en' ? 'Client Name' : 'اسم العميل'}</h5>
                            <p>{infoDialog.data.clientName}</p>
                        </div>
                        <div className="field col-12 md:col-6">
                            <h5>{lang === 'en' ? 'Phone' : 'الهاتف'}</h5>
                            <p>{infoDialog.data.clientPhone}</p>
                        </div>
                        <div className="field col-12 md:col-6">
                            <h5>{lang === 'en' ? 'Car Brand' : 'ماركة السيارة'}</h5>
                            <p>{infoDialog.data.carBrand || '-'}</p>
                        </div>
                        <div className="field col-12 md:col-6">
                            <h5>{lang === 'en' ? 'Car Model' : 'موديل السيارة'}</h5>
                            <p>{infoDialog.data.carModel || '-'}</p>
                        </div>
                        <div className="field col-12 md:col-6">
                            <h5>{lang === 'en' ? 'Service' : 'الخدمة'}</h5>
                            <p>{infoDialog.data.serviceName}</p>
                        </div>
                        <div className="field col-12 md:col-6">
                            <h5>{lang === 'en' ? 'Service Center' : 'مركز الخدمة'}</h5>
                            <p>{lang === 'en' ? infoDialog.data.serviceCenterTitleEn : infoDialog.data.serviceCenterTitle}</p>
                        </div>
                    </div>
                )}
            </Dialog>

            {/* CANCEL DIALOG */}
            <Dialog
                visible={cancelDialog.visible}
                onHide={() => setCancelDialog({ visible: false, data: null, reason: '' })}
                header={lang === 'en' ? 'Cancel Booking' : 'إلغاء الحجز'}
                position="center"
                style={{ width: '100%', maxWidth: '500px' }}
                draggable={false}
                resizable={false}
                dir={lang === 'en' ? 'ltr' : 'rtl'}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label={lang === 'en' ? 'Cancel' : 'إلغاء'} icon="pi pi-times" onClick={() => setCancelDialog({ visible: false, data: null, reason: '' })} className="flex-1" outlined />
                        <Button label={lang === 'en' ? 'Confirm' : 'تأكيد'} icon="pi pi-check" onClick={handleCancelBooking} autoFocus className="flex-1" severity="danger" disabled={!cancelDialog.reason.trim()} />
                    </div>
                }
            >
                {cancelDialog.data && (
                    <div className="p-fluid formgrid grid card mx-0">
                        <div className="field col-12 md:col-6">
                            <h5>{lang === 'en' ? 'Client Name' : 'اسم العميل'}</h5>
                            <p>{cancelDialog.data.clientName}</p>
                        </div>
                        <div className="field col-12 md:col-6">
                            <h5>{lang === 'en' ? 'Service' : 'الخدمة'}</h5>
                            <p>{cancelDialog.data.serviceName}</p>
                        </div>
                        <div className="field col-12">
                            <h5>{lang === 'en' ? 'Reason for Cancellation' : 'سبب الإلغاء'}</h5>
                            <InputTextarea
                                value={cancelDialog.reason}
                                onChange={(e) => setCancelDialog((prev) => ({ ...prev, reason: e.target.value }))}
                                rows={4}
                                className="w-full"
                                placeholder={lang === 'en' ? 'Enter reason for cancellation...' : 'أدخل سبب الإلغاء...'}
                            />
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
}
