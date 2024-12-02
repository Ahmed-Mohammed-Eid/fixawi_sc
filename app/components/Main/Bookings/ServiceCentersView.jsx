'use client';

import { TabView, TabPanel } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { format } from 'date-fns';
import { Avatar } from 'primereact/avatar';
import { Divider } from 'primereact/divider';
import { Badge } from 'primereact/badge';
import { Chart } from 'primereact/chart';
import { useState } from 'react';
import { Panel } from 'primereact/panel';

export default function ServiceCentersView({ lang, data }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const formatDate = (date) => {
        return format(new Date(date), 'yyyy-MM-dd');
    };

    const formatTime = (time) => {
        const period = time >= 12 ? 'PM' : 'AM';
        const hour = time > 12 ? time - 12 : time;
        return `${hour}:00 ${period}`;
    };

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

    const ClientCard = ({ client }) => (
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
            </div>
        </div>
    );

    const TimeSlotPanel = ({ slot }) => (
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
                    <ClientCard key={client._id} client={client} />
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
                <div className="col-12 grid p-0 mx-0">
                    <div className="col-12 md:col-4">
                        <div className="card text-center shadow-1">
                            <i className="pi pi-users text-4xl text-primary mb-2"></i>
                            <h3>{analytics.stats.totalClients}</h3>
                            <p>{lang === 'en' ? 'Total Clients' : 'إجمالي العملاء'}</p>
                        </div>
                    </div>
                    <div className="col-12 md:col-4">
                        <div className="card text-center shadow-1">
                            <i className="pi pi-check-circle text-4xl text-success mb-2"></i>
                            <h3>{analytics.stats.fullSlots}</h3>
                            <p>{lang === 'en' ? 'Full Slots' : 'الفترات الممتلئة'}</p>
                        </div>
                    </div>
                    <div className="col-12 md:col-4">
                        <div className="card text-center shadow-1">
                            <i className="pi pi-clock text-4xl text-warning mb-2"></i>
                            <h3>{analytics.stats.availableSlots}</h3>
                            <p>{lang === 'en' ? 'Available Slots' : 'الفترات المتاحة'}</p>
                        </div>
                    </div>
                </div>

                <div className="col-12 md:col-6">
                    <Panel header={lang === 'en' ? 'Bookings by Time Slot' : 'الحجوزات حسب الفترة'}>
                        <div>
                            <Chart type="bar" data={analytics.timeSlotChart} options={chartOptions} />
                        </div>
                    </Panel>
                </div>
                <div className="col-12 md:col-6">
                    <Panel header={lang === 'en' ? 'Daily Bookings Trend' : 'اتجاه الحجوزات اليومية'}>
                        <div>
                            <Chart type="line" data={analytics.dailyBookingsChart} options={chartOptions} />
                        </div>
                    </Panel>
                </div>
            </div>
        );
    };

    return (
        <div className="booking-view-container">
            {data.map((booking) => (
                <div key={booking._id} className="card mb-4">
                    <div className="flex justify-content-between align-items-center mb-3">
                        <div>
                            <h2 className="m-0 text-2xl">
                                <i className="pi pi-wrench mr-2"></i>
                                {booking.serviceName}
                            </h2>
                            <p className="m-0 text-500">
                                {lang === 'en' ? 'Created on: ' : 'تم الإنشاء في: '}
                                {formatDate(booking.createdAt)}
                            </p>
                        </div>
                        <Tag value={`${booking.calendar.reduce((acc, cal) => acc + cal.slots.reduce((slotAcc, slot) => slotAcc + slot.clients.length, 0), 0)} ${lang === 'en' ? 'Bookings' : 'حجوزات'}`} severity="primary" rounded />
                    </div>

                    <BookingAnalytics booking={booking} />

                    <Divider />

                    <TabView className="booking-tabs" activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                        {booking.calendar.map((calendarItem) => (
                            <TabPanel
                                key={calendarItem.date}
                                header={
                                    <div className="flex align-items-center gap-2">
                                        <i className="pi pi-calendar"></i>
                                        <span>{formatDate(calendarItem.date)}</span>
                                        <Badge value={calendarItem.slots.reduce((acc, slot) => acc + slot.clients.length, 0)} severity="info" />
                                    </div>
                                }
                            >
                                {calendarItem.slots
                                    .sort((a, b) => a.time - b.time)
                                    .map((slot, index) => (
                                        <TimeSlotPanel key={index} slot={slot} />
                                    ))}
                            </TabPanel>
                        ))}
                    </TabView>
                </div>
            ))}
        </div>
    );
}
