'use client';

import axios from 'axios';
import { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ServiceCenterPreview from '../ServiceCenters/ServiceCenterPreview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea'; // Import InputTextarea

export default function DashboardPageContent({ lang }) {
    const isRTL = lang === 'ar';

    // ROUTER
    const router = useRouter();

    // STATE
    const [visits, setVisits] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
    const [selectedVisitId, setSelectedVisitId] = useState(null);
    // Add state for booking cancellation
    const [cancelBookingDialogVisible, setCancelBookingDialogVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    // Service Center Profile State
    const [serviceCenterImage, setServiceCenterImage] = useState('');
    const [averageRating, setAverageRating] = useState(0);
    const [serviceTypesDisplay, setServiceTypesDisplay] = useState([]);
    const [isActive, setIsActive] = useState(false);
    const [isApproved, setIsApproved] = useState(false);
    const [serviceCenterTitle, setServiceCenterTitle] = useState('');
    const [serviceCenterTitleEn, setServiceCenterTitleEn] = useState('');
    const [address, setAddress] = useState('');
    const [area, setArea] = useState('');
    const [openAt, setOpenAt] = useState(null);
    const [closeAt, setCloseAt] = useState(null);
    const [contacts, setContacts] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [carBrandsDisplay, setCarBrandsDisplay] = useState([]);
    const [visitTypeDisplay, setVisitTypeDisplay] = useState('');

    // GET THE VISITS HANDLER
    const getVisits = useCallback(() => {
        // Wrap with useCallback
        // GET THE TOKEN
        const token = localStorage.getItem('token') || null;

        axios
            .get(`${process.env.API_URL}/sc/visits`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    date: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).toISOString()
                }
            })
            .then((response) => {
                // CREATE NEW ARRAY FOR TABLE USE
                const visitsTableArray = response.data?.visits.map((visit) => {
                    const { carModel, carBrand, carNumber, modelYear } = visit?.userId?.userCars[0] || {};
                    const carInfo = `${carBrand} - ${carModel} - ${modelYear} - ${carNumber}`;

                    return {
                        fullName: visit?.userId?.fullName,
                        phoneNumber: visit?.userId?.phoneNumber,
                        createdAt: visit?.createdAt,
                        car: carInfo,
                        visitStatus: visit?.visitStatus,
                        _id: visit?._id,
                        userId: visit?.userId?._id,
                        checkReportId: visit?.checkReportId
                    };
                });

                setVisits(visitsTableArray || []);

                // Ensure bookings have necessary data (assuming API provides it)
                setBookings(response.data?.bookings || []);
            })
            .catch((error) => {
                toast.error(error.response?.data?.message || 'An error occurred');
                return null;
            });
    }, [selectedDate, lang]); // Add dependencies for useCallback

    // DELETE VISIT HANDLER
    function cancelVisit() {
        const token = localStorage.getItem('token') || null;

        axios
            .post(
                `${process.env.API_URL}/cancel/visit`,
                { visitId: selectedVisitId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )
            .then(() => {
                toast.success(lang === 'en' ? 'Visit cancelled successfully' : 'تم إلغاء الزيارة بنجاح');
                setCancelDialogVisible(false);
                getVisits(); // Refresh the visits list
            })
            .catch((error) => {
                toast.error(error.response?.data?.message || 'An error occurred');
            });
    }

    // CANCEL BOOKING HANDLER
    function cancelBooking() {
        if (!selectedBooking || !cancelReason) {
            toast.error(lang === 'en' ? 'Please provide a cancellation reason.' : 'يرجى تقديم سبب الإلغاء.');
            return;
        }

        const token = localStorage.getItem('token') || null;
        const { serviceId, slotId, phone, clientId, bookingDate, _id: bookingId } = selectedBooking; // Assuming these fields exist in the booking object

        console.log('Selected Booking:', selectedBooking);

        // Format date to MM-DD-YYYY as per the Postman request example
        const formattedDate = new Date(bookingDate)
            .toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            })
            .replace(/\//g, '-');

        axios
            .delete(`${process.env.API_URL}/cancel/booking`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    serviceId,
                    slotId,
                    date: formattedDate, // Use formatted date
                    phone,
                    clientId,
                    reason: cancelReason
                }
            })
            .then(() => {
                toast.success(lang === 'en' ? 'Booking cancelled successfully' : 'تم إلغاء الحجز بنجاح');
                setCancelBookingDialogVisible(false);
                setSelectedBooking(null);
                setCancelReason('');
                getVisits(); // Refresh the bookings list (as it's fetched with visits)
            })
            .catch((error) => {
                toast.error(error.response?.data?.message || 'An error occurred while cancelling the booking');
            });
    }

    // GET SERVICE CENTER PROFILE HANDLER
    const getServiceCenterProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error(lang === 'en' ? 'Authentication token not found.' : 'لم يتم العثور على رمز المصادقة.');
            return;
        }

        try {
            const response = await axios.get(`${process.env.API_URL}/service/center/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const profileData = response.data?.serviceCenter;

            if (profileData) {
                setServiceCenterImage(profileData.image || '');
                setAverageRating(profileData.averageRating || 0);
                setServiceTypesDisplay(profileData.serviceTypes || []);
                setIsActive(profileData.isActive || false);
                setIsApproved(profileData.isApproved || false);
                setServiceCenterTitle(profileData.serviceCenterTitle || '');
                setServiceCenterTitleEn(profileData.serviceCenterTitleEn || '');
                setAddress(profileData.address || '');
                setArea(profileData.area || '');
                setOpenAt(profileData.openAt !== undefined ? profileData.openAt : null);
                setCloseAt(profileData.closeAt !== undefined ? profileData.closeAt : null);
                setContacts(profileData.contacts || '');
                setEmail(profileData.email || '');
                setWebsite(profileData.website || '');
                setCarBrandsDisplay(profileData.carBrands || []);
                setVisitTypeDisplay(profileData.visitType || '');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || (lang === 'en' ? 'Failed to fetch service center profile.' : 'فشل في جلب ملف مركز الخدمة.'));
        }
    };

    useEffect(() => {
        getVisits();
    }, [selectedDate, getVisits]); // Keep getVisits in dependency array

    useEffect(() => {
        getServiceCenterProfile();
        // getVisits(); // getVisits is already called in another useEffect
    }, [lang]);

    return (
        <>
            <ServiceCenterPreview
                lang={lang}
                serviceCenterImage={serviceCenterImage}
                isActive={isActive}
                isApproved={isApproved}
                serviceCenterTitle={serviceCenterTitle}
                serviceCenterTitleEn={serviceCenterTitleEn}
                averageRating={averageRating}
                area={area}
                address={address}
                openAt={openAt}
                closeAt={closeAt}
                contacts={contacts}
                email={email}
                website={website}
                visitType={visitTypeDisplay}
                serviceTypes={serviceTypesDisplay}
                carBrands={carBrandsDisplay}
            />
            <div className="grid" dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Date Selector */}
                <div className="col-12">
                    <div className="card mb-3">
                        <div className="card-body">
                            <h3 className="card-title">{lang === 'en' ? 'Filter by Date' : 'تصفية حسب التاريخ'}</h3>
                            <div className="field w-full">
                                <label htmlFor="date-filter" className="block mb-2">
                                    {lang === 'en' ? 'Select a date to view visits and bookings' : 'حدد تاريخًا لعرض الزيارات والحجوزات'}
                                </label>
                                <Calendar
                                    id="date-filter"
                                    value={selectedDate}
                                    onChange={(e) => {
                                        setSelectedDate(e.value);
                                        getVisits();
                                    }}
                                    showIcon
                                    dateFormat="dd/mm/yy"
                                    placeholder={lang === 'en' ? 'Select a date...' : 'اختر تاريخًا...'}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Direct Visits Table */}
                <div className="col-12">
                    <div className="card mb-3">
                        <div className="card-body">
                            <h3 className="card-title">{lang === 'en' ? 'Direct Visits' : 'الزيارات المباشرة'}</h3>
                            <DataTable
                                value={visits || []}
                                paginator
                                rows={25}
                                rowsPerPageOptions={[25, 50, 100]}
                                className="p-datatable-sm"
                                emptyMessage={lang === 'en' ? 'No records found' : 'لم يتم العثور على سجلات'}
                                header={lang === 'en' ? 'Direct Visits' : 'الزيارات المباشرة'}
                            >
                                <Column field={'fullName'} header={lang === 'en' ? 'Full Name' : 'الاسم الكامل'} sortable filter={true} />
                                {/*  PHONE NUMBER  */}
                                <Column field={'phoneNumber'} header={lang === 'en' ? 'Phone Number' : 'رقم الهاتف'} sortable filter={true} />
                                {/*  DATE  */}
                                <Column
                                    field={'createdAt'}
                                    header={lang === 'en' ? 'Date' : 'التاريخ'}
                                    sortable
                                    filter={true}
                                    body={(rowData) => {
                                        const date = new Date(rowData.createdAt);
                                        return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric'
                                        });
                                    }}
                                />
                                {/*  CAR  */}
                                <Column field={'car'} header={lang === 'en' ? 'Car' : 'السيارة'} sortable />
                                {/*  status  */}
                                <Column
                                    field={'visitStatus'}
                                    header={lang === 'en' ? 'Status' : 'الحالة'}
                                    sortable
                                    filter={true}
                                    body={(rowData) => {
                                        const getBadgeSeverity = (status) => {
                                            switch (status) {
                                                case 'pending':
                                                    return 'warning';
                                                case 'canceled':
                                                    return 'secondary';
                                                default:
                                                    return 'success';
                                            }
                                        };
                                        return <Badge value={rowData.visitStatus} severity={getBadgeSeverity(rowData.visitStatus)} />;
                                    }}
                                />

                                {/*  ACTIONS  */}
                                <Column
                                    field={'_id'}
                                    header={lang === 'en' ? 'Actions' : 'الإجراءات'}
                                    body={(rowData) => {
                                        console.log(rowData);
                                        return rowData.visitStatus === 'canceled' ? null : (
                                            <div className="flex gap-2">
                                                {rowData.visitStatus !== "visited" && (<Button
                                                    icon="pi pi-file-edit"
                                                    className="p-button-success p-button-sm"
                                                    tooltip={lang === 'en' ? 'Create Check Report' : 'إنشاء تقرير فحص'}
                                                    tooltipOptions={{ position: 'top' }}
                                                    onClick={() => router.push(`/${lang}/check-reports?userId=${rowData.userId}&visitId=${rowData._id}`)}
                                                />)}
                                                {/* CREATE INVOICE */}
                                                {(rowData?.checkReportId && rowData.visitStatus !== "visited") && (
                                                    <Button
                                                        icon="pi pi-file"
                                                        className="p-button-info p-button-sm"
                                                        tooltip={lang === 'en' ? 'Create Invoice' : 'إنشاء فاتورة'}
                                                        tooltipOptions={{ position: 'top' }}
                                                        onClick={() => router.push(`/invoices/create?check-report-id=${rowData.checkReportId}`)}
                                                    />
                                                )}

                                                {rowData.visitStatus === 'pending' && (
                                                    <Button
                                                        icon="pi pi-times-circle"
                                                        className="p-button-warning p-button-sm"
                                                        tooltip={lang === 'en' ? 'Cancel Visit' : 'إلغاء الزيارة'}
                                                        tooltipOptions={{ position: 'top' }}
                                                        onClick={() => {
                                                            setSelectedVisitId(rowData._id);
                                                            setCancelDialogVisible(true);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    }}
                                />
                            </DataTable>
                        </div>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="col-12">
                    <div className="card mb-0">
                        <div className="card-body">
                            <h3 className="card-title">{lang === 'en' ? 'Bookings' : 'الحجوزات'}</h3>

                            <DataTable
                                value={bookings || []}
                                paginator
                                rows={25}
                                rowsPerPageOptions={[25, 50, 100]}
                                className="p-datatable-sm"
                                emptyMessage={lang === 'en' ? 'No records found' : 'لم يتم العثور على سجلات'}
                                header={lang === 'en' ? 'Bookings' : 'الحجوزات'}
                            >
                                <Column field={'clientName'} header={lang === 'en' ? 'Client Name' : 'اسم العميل'} sortable filter={true} />
                                {/*  TIME  */}
                                <Column
                                    field={'time'}
                                    header={lang === 'en' ? 'Time' : 'الوقت'}
                                    sortable
                                    filter={true}
                                    body={(rowData) => {
                                        return <span>{rowData.time}:00</span>;
                                    }}
                                />
                                {/* bookingStatus */}
                                <Column
                                    field={'bookingStatus'}
                                    header={lang === 'en' ? 'Status' : 'الحالة'}
                                    sortable
                                    filter={true}
                                    body={(rowData) => {
                                        const getBadgeSeverity = (status) => {
                                            switch (status) {
                                                case 'pending':
                                                    return 'warning';
                                                case 'checking':
                                                    return 'secondary';
                                                case 'invoiced':
                                                    return 'info';
                                                default:
                                                    return 'success';
                                            }
                                        };
                                        return <Badge value={rowData.bookingStatus} severity={getBadgeSeverity(rowData.bookingStatus)} />;
                                    }}
                                />

                                <Column field={'phone'} header={lang === 'en' ? 'Phone' : 'رقم الهاتف'} sortable filter={true} />
                                <Column field={'carInfo'} header={lang === 'en' ? 'Car Info' : 'معلومات السيارة'} sortable body={(rowData) => `${rowData.carBrand} - ${rowData.carModel}`} />
                                {/* Add Actions Column for Bookings */}
                                <Column
                                    header={lang === 'en' ? 'Actions' : 'الإجراءات'}
                                    body={(rowData) => (
                                        <div className="flex gap-2">
                                            {rowData?.bookingStatus !== 'invoiced' && (
                                                <Button
                                                    icon="pi pi-file-edit"
                                                    className="p-button-success p-button-sm"
                                                    tooltip={lang === 'en' ? 'Create Check Report' : 'إنشاء تقرير فحص'}
                                                    tooltipOptions={{ position: 'top' }}
                                                    onClick={() => router.push(`/${lang}/check-reports?userId=${rowData.clientId}&visitId=${rowData._id}&isBooking=true&time=${rowData.time}&date=${selectedDate}&bookingId=${rowData.bookingId}`)}
                                                />
                                            )}
                                            {/* CREATE INVOICE */}
                                            {rowData?.checkReportId && rowData?.bookingStatus !== 'invoiced' && (
                                                <Button
                                                    icon="pi pi-file"
                                                    className="p-button-info p-button-sm"
                                                    tooltip={lang === 'en' ? 'Create Invoice' : 'إنشاء فاتورة'}
                                                    tooltipOptions={{ position: 'top' }}
                                                    onClick={() => router.push(`/invoices/create?check-report-id=${rowData.checkReportId}&userId=${rowData.clientId}`)}
                                                />
                                            )}
                                            {/* Add Cancel Button */}
                                            {rowData?.bookingStatus !== 'invoiced' && (
                                                <Button
                                                    icon="pi pi-times-circle"
                                                    className="p-button-warning p-button-sm"
                                                    tooltip={lang === 'en' ? 'Cancel Booking' : 'إلغاء الحجز'}
                                                    tooltipOptions={{ position: 'top' }}
                                                    onClick={() => {
                                                        setSelectedBooking(rowData); // Store the whole booking object
                                                        setCancelBookingDialogVisible(true);
                                                    }}
                                                />
                                            )}
                                            {/* Potentially add other actions like 'Create Visit' later */}
                                        </div>
                                    )}
                                />
                            </DataTable>
                        </div>
                    </div>
                </div>
            </div>

            {/* CANCEL CONFIRMATION DIALOG */}
            <Dialog
                visible={cancelDialogVisible}
                onHide={() => setCancelDialogVisible(false)}
                header={lang === 'en' ? 'Confirm Cancellation' : 'تأكيد الإلغاء'}
                footer={
                    <div>
                        <Button label={lang === 'en' ? 'Back' : 'رجوع'} icon="pi pi-times" onClick={() => setCancelDialogVisible(false)} className="p-button-text" />
                        <Button label={lang === 'en' ? 'Confirm' : 'تأكيد'} icon="pi pi-check" onClick={cancelVisit} className="p-button-warning" autoFocus />
                    </div>
                }
            >
                <p>{lang === 'en' ? 'Are you sure you want to cancel this visit?' : 'هل أنت متأكد أنك تريد إلغاء هذه الزيارة؟'}</p>
            </Dialog>

            {/* CANCEL BOOKING CONFIRMATION DIALOG */}
            <Dialog
                visible={cancelBookingDialogVisible}
                style={{ width: '450px' }}
                header={lang === 'en' ? 'Confirm Booking Cancellation' : 'تأكيد إلغاء الحجز'}
                modal
                footer={
                    <div>
                        <Button
                            label={lang === 'en' ? 'Back' : 'رجوع'}
                            icon="pi pi-times"
                            onClick={() => {
                                setCancelBookingDialogVisible(false);
                                setCancelReason('');
                                setSelectedBooking(null);
                            }}
                            className="p-button-text"
                        />
                        <Button label={lang === 'en' ? 'Confirm Cancellation' : 'تأكيد الإلغاء'} icon="pi pi-check" onClick={cancelBooking} className="p-button-warning" autoFocus disabled={!cancelReason} />
                    </div>
                }
                onHide={() => {
                    setCancelBookingDialogVisible(false);
                    setCancelReason('');
                    setSelectedBooking(null);
                }}
            >
                <div className="confirmation-content">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>{lang === 'en' ? 'Are you sure you want to cancel this booking? Please provide a reason.' : 'هل أنت متأكد أنك تريد إلغاء هذا الحجز؟ يرجى تقديم سبب.'}</span>

                    <div className="field mt-3">
                        <label htmlFor="cancelReason" className="block mb-2">
                            {lang === 'en' ? 'Cancellation Reason' : 'سبب الإلغاء'}
                        </label>
                        <InputTextarea id="cancelReason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} required rows={3} cols={20} className="w-full" autoResize />
                    </div>
                </div>
            </Dialog>
        </>
    );
}
