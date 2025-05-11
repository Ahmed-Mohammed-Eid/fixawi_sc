'use client';

import { Tag } from 'primereact/tag';
import { format } from 'date-fns';
import { Avatar } from 'primereact/avatar';
import { Divider } from 'primereact/divider';
import { Badge } from 'primereact/badge';
import { Chart } from 'primereact/chart';
import { useState, useEffect } from 'react';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ServiceCentersView({ lang, data }) {
    const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [bookings, setBookings] = useState(data || []); // Use state for bookings to allow dynamic updates
    const router = useRouter();

    const formatDate = (date) => {
        return format(new Date(date), 'yyyy-MM-dd');
    };

    const formatTime = (time) => {
        const period = time >= 12 ? 'PM' : 'AM';
        const hour = time > 12 ? time - 12 : time;
        return `${hour}:00 ${period}`;
    };

    useEffect(() => {
        setBookings(data);
    }, [data]);

    const prepareAnalytics = (booking) => {
        const timeSlotData = {};
        const carBrandData = {};
        const dailyBookings = {};
        let totalClients = 0;
        let fullSlots = 0;
        let availableSlots = 0;

        booking.calendar.forEach((cal) => {
            const date = formatDate(cal.date);
            dailyBookings[date] = 0;

            cal.slots.forEach((slot) => {
                timeSlotData[slot.time] = (timeSlotData[slot.time] || 0) + slot.clients.length;
                dailyBookings[date] += slot.clients.length;
                totalClients += slot.clients.length;

                if (slot.slotIsFull) fullSlots++;
                else availableSlots++;

                slot.clients.forEach((client) => {
                    if (client.carBrand) {
                        carBrandData[client.carBrand] = (carBrandData[client.carBrand] || 0) + 1;
                    }
                });
            });
        });

        return {
            timeSlotChart: {
                labels: Object.keys(timeSlotData).map((time) => formatTime(parseInt(time))),
                datasets: [
                    {
                        label: lang === 'en' ? 'Bookings per Time Slot' : 'الحجوزات لكل فترة',
                        data: Object.values(timeSlotData),
                        backgroundColor: '#2196F3',
                        borderColor: '#1976D2',
                        borderWidth: 1
                    }
                ]
            },
            dailyBookingsChart: {
                labels: Object.keys(dailyBookings),
                datasets: [
                    {
                        label: lang === 'en' ? 'Daily Bookings' : 'الحجوزات اليومية',
                        data: Object.values(dailyBookings),
                        fill: true,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                        tension: 0.4
                    }
                ]
            },
            stats: {
                totalClients,
                fullSlots,
                availableSlots,
                occupancyRate: (fullSlots / (fullSlots + availableSlots)) * 100
            }
        };
    };
    const handleCancelBooking = (serviceId, clientId, slotId, date, phone) => {
        setSelectedBooking({ serviceId, clientId, slotId, date, phone });
        setCancelReason('');
        setCancelDialogVisible(true);
    };
    const confirmCancelBooking = async () => {
        if (!selectedBooking) return;
        if (!cancelReason.trim()) {
            toast.error(lang === 'en' ? 'Please provide a cancellation reason.' : 'يرجى تقديم سبب الإلغاء.');
            return;
        }

        const { serviceId, clientId, slotId, date, phone } = selectedBooking;

        // GET THE TOKEN
        const token = localStorage.getItem('token');

        try {
            const response = await axios.delete(`${process.env.API_URL}/cancel/booking`, {
                params: {
                    serviceId: serviceId,
                    slotId: slotId,
                    date: formatDate(date),
                    phone: phone,
                    clientId: clientId,
                    reason: cancelReason
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                // Remove the canceled booking from the UI

                toast.success(lang === 'en' ? 'Booking canceled successfully!' : 'تم إلغاء الحجز بنجاح!');
            }
        } catch (error) {
            console.error('Error canceling booking:', error);
            toast.error(error.response?.data?.message);
        } finally {
            setCancelDialogVisible(false);
            setSelectedBooking(null);
        }
    };

    const ClientCard = ({ client, serviceId, slotId, date }) => (
        <div className="surface-card p-3 border-round mb-2 shadow-1">
            <div className="flex align-items-center gap-3">
                <Avatar icon="pi pi-user" size="large" style={{ backgroundColor: '#2196F3', color: '#ffffff' }} />
                <div className="flex-1">
                    <h3 className="m-0 text-xl">{client.clientName}</h3>
                    <p className="m-0 text-500">
                        <i className="pi pi-phone mr-2"></i>
                        {client.phone}
                    </p>
                    {client.carBrand && (
                        <p className="m-0 text-500">
                            <i className="pi pi-car mr-2"></i>
                            {client.carBrand} {client.carModel}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    {client?.bookingStatus !== 'invoiced' && (
                        <Button
                            icon="pi pi-file-edit"
                            className="p-button-success p-button-outlined"
                            onClick={() => router.push(`/${lang}/check-reports?userId=${client.clientId || client._id}&visitId=${slotId}`)}
                            tooltip={lang === 'en' ? 'Create Check Report' : 'إنشاء تقرير فحص'}
                            tooltipOptions={{ position: 'top' }}
                        />
                    )}
                    <Button
                        icon="pi pi-times"
                        className="p-button-danger p-button-outlined"
                        onClick={() => handleCancelBooking(serviceId, client.clientId || client._id, slotId, date, client.phone)}
                        tooltip={lang === 'en' ? 'Cancel Booking' : 'إلغاء الحجز'}
                        tooltipOptions={{ position: 'top' }}
                    />
                </div>
            </div>
        </div>
    );

    const TimeSlotPanel = ({ slot, serviceId, date }) => (
        <div className="mb-4 surface-ground p-3 border-round">
            <div className="flex align-items-center justify-content-between mb-3">
                <h3 className="m-0">
                    <i className="pi pi-clock mr-2"></i>
                    {formatTime(slot.time)}
                </h3>
                <div className="flex align-items-center gap-2">
                    <Badge value={slot.clients.length} severity="info" />
                    <Tag severity={slot.slotIsFull ? 'danger' : 'success'} value={slot.slotIsFull ? (lang === 'en' ? 'Full' : 'ممتلئ') : lang === 'en' ? 'Available' : 'متاح'} />
                </div>
            </div>
            <div className="pl-4">
                {slot.clients.map((client) => (
                    <ClientCard key={client._id} client={client} serviceId={serviceId} slotId={slot._id} date={date} />
                ))}
            </div>
        </div>
    );

    const BookingAnalytics = ({ booking }) => {
        const analytics = prepareAnalytics(booking);
        const chartOptions = {
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            responsive: true,
            maintainAspectRatio: false
        };

        return (
            <div className="grid mt-4">
                <div className="col-12">
                    <Panel header={lang === 'en' ? 'Daily Bookings Trend' : 'اتجاه الحجوزات اليومية'}>
                        <div>
                            <Chart type="line" data={analytics.dailyBookingsChart} options={chartOptions} />
                        </div>
                    </Panel>
                </div>

                <div className="col-12 grid p-0 mx-0 mt-4">
                    <div className="col-12 md:col-4">
                        <div className="card text-center p-4">
                            <i className="pi pi-users text-4xl text-primary mb-2"></i>
                            <h3>{analytics.stats.totalClients}</h3>
                            <p>{lang === 'en' ? 'Total Clients' : 'إجمالي العملاء'}</p>
                        </div>
                    </div>
                    <div className="col-12 md:col-4">
                        <div className="card text-center p-4">
                            <i className="pi pi-check-circle text-4xl text-success mb-2"></i>
                            <h3>{analytics.stats.fullSlots}</h3>
                            <p>{lang === 'en' ? 'Full Slots' : 'الفترات الممتلئة'}</p>
                        </div>
                    </div>
                    <div className="col-12 md:col-4">
                        <div className="card text-center p-4">
                            <i className="pi pi-clock text-4xl text-warning mb-2"></i>
                            <h3>{analytics.stats.availableSlots}</h3>
                            <p>{lang === 'en' ? 'Available Slots' : 'الفترات المتاحة'}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const NoBookings = () => (
        <div className="card p-4 shadow-1 text-center">
            <i className="pi pi-calendar-times text-6xl text-500 mb-3"></i>
            <h3 className="text-2xl">{lang === 'en' ? 'No Bookings Available' : 'لا توجد حجوزات متاحة'}</h3>
        </div>
    );
    const cancelDialogFooter = (
        <div>
            <Button label={lang === 'en' ? 'No' : 'لا'} icon="pi pi-times" onClick={() => setCancelDialogVisible(false)} className="p-button-text" />
            <Button label={lang === 'en' ? 'Yes' : 'نعم'} icon="pi pi-check" onClick={confirmCancelBooking} autoFocus disabled={!cancelReason.trim()} />
        </div>
    );

    return (
        <div className="booking-view-container">
            {bookings.length === 0 ? (
                <NoBookings />
            ) : (
                bookings.map((booking) => (
                    <>
                        <div key={booking._id} className="card mb-4">
                            <div className="flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h2 className="m-0 text-2xl">
                                        <i className="pi pi-wrench mr-2"></i>
                                        {booking.serviceName}
                                    </h2>
                                </div>
                                <Tag value={`${booking.calendar.reduce((acc, cal) => acc + cal.slots.reduce((slotAcc, slot) => slotAcc + slot.clients.length, 0), 0)} ${lang === 'en' ? 'Bookings' : 'حجوزات'}`} severity="primary" rounded />
                            </div>

                            <BookingAnalytics booking={booking} />

                            <Divider />
                        </div>

                        <div className="card">
                            {booking.calendar.map((calendarItem) => (
                                <div key={calendarItem.date} className="mb-5">
                                    <div className="flex align-items-center gap-2 p-3 surface-section border-bottom-1 surface-border">
                                        <i className="pi pi-calendar text-xl"></i>
                                        <span className="font-bold text-xl">{formatDate(calendarItem.date)}</span>
                                        <Badge value={calendarItem.slots.reduce((acc, slot) => acc + slot.clients.length, 0)} severity="info" />
                                    </div>
                                    <div className="p-3">
                                        {calendarItem.slots
                                            .sort((a, b) => a.time - b.time)
                                            .map((slot, index) => (
                                                <TimeSlotPanel key={index} slot={slot} serviceId={booking.serviceId} date={calendarItem.date} />
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ))
            )}{' '}
            <Dialog header={lang === 'en' ? 'Cancel Booking' : 'إلغاء الحجز'} visible={cancelDialogVisible} style={{ width: '50vw' }} footer={cancelDialogFooter} onHide={() => setCancelDialogVisible(false)}>
                <div className="confirmation-content">
                    <span>{lang === 'en' ? 'Are you sure you want to cancel this booking? Please provide a reason.' : 'هل أنت متأكد أنك تريد إلغاء هذا الحجز؟ يرجى تقديم سبب.'}</span>

                    <div className="field mt-3">
                        <label htmlFor="cancelReason" className="block mb-2">
                            {lang === 'en' ? 'Cancellation Reason' : 'سبب الإلغاء'}
                        </label>
                        <textarea id="cancelReason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} required rows={3} className="w-full p-2" style={{ resize: 'vertical' }} />
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
