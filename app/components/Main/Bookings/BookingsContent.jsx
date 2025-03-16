'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ServiceCentersView from './ServiceCentersView';

export default function BookingsContent({ lang }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);

    // Get bookings for selected center and date
    const getBookings = () => {
        if (!selectedDate) return;

        setLoading(true);
        const token = localStorage.getItem('token');
        const formattedDate = new Date(selectedDate)
            .toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            })
            .replace(/\//g, '-');

        axios
            .get(`${process.env.API_URL}/bookings/calendar`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    date: formattedDate
                }
            })
            .then((res) => {
                setBookings(res.data?.bookings || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                toast.error(lang === 'en' ? 'Failed to fetch bookings' : 'فشل في جلب الحجوزات');
                setLoading(false);
            });
    };

    // Fetch bookings when date changes
    useEffect(() => {
        if (selectedDate) {
            getBookings();
        }
    }, [selectedDate]);

    // Fetch bookings for today when component mounts
    useEffect(() => {
        // This will trigger the above useEffect since selectedDate is already set to today
    }, []);

    return (
        <>
            <div className="card" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <h1 className="text-2xl mb-5 uppercase">{lang === 'en' ? 'Service Center Bookings' : 'حجوزات مركز الخدمة'}</h1>

                <div className="p-fluid formgrid grid mb-4">
                    <div className="field col-12">
                        <label htmlFor="date">{lang === 'en' ? 'Date' : 'التاريخ'}</label>
                        <Calendar id="date" value={selectedDate} onChange={(e) => setSelectedDate(e.value)} showIcon dateFormat="yy-mm-dd" placeholder={lang === 'en' ? 'Select Date' : 'اختر التاريخ'} />
                    </div>
                </div>
            </div>
            <ServiceCentersView lang={lang} data={bookings} loading={loading} />
        </>
    );
}
