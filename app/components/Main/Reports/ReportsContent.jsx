'use client';

import { Dropdown } from 'primereact/dropdown';
import { useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function ReportsContent({ lang }) {

    // STATE
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportStartDate, setReportStartDate] = useState(null);
    const [reportEndDate, setReportEndDate] = useState(null);


    // HANDLER TO GET THE REPORT
    const getReport = () => {
        // GET THE TOKEN
        const token = localStorage.getItem('token');

        // URL
        const url = `${process.env.API_URL}/report`;


        // VALIDATION
        if (!selectedReport) {
            toast.error(lang === 'en' ? 'Please select a report' : 'الرجاء اختيار تقرير');
            return;
        }

        if (
            (selectedReport === 'kitchenMeals' ||
                selectedReport === 'paymentHistory') &&
            !reportStartDate
        ) {
            toast.error(lang === 'en' ? 'Please select a start date' : 'الرجاء اختيار تاريخ البداية');
            return;
        }

        if (selectedReport === 'paymentHistory' && !reportEndDate) {
            toast.error(lang === 'en' ? 'Please select an end date' : 'الرجاء اختيار تاريخ النهاية');
            return;
        }

        // GET THE REPORT
        axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: {
                reportName: selectedReport,
                dateFrom: reportStartDate,
                dateTo: reportEndDate
            }
        })
            .then(res => {
                const url = res.data?.url;
                if (url) {
                    const timer = setTimeout(() => {
                        window.open(url, '_blank');
                        clearTimeout(timer);
                    }, 1000);
                } else {
                    toast.error(lang === 'en' ? 'Failed to generate report' : 'فشل في إنشاء التقرير');
                }
            })
            .catch(err => {
                console.log(err);
            });
    };


    return (
        <div className={'card mb-0'}>
            <h5>{lang === 'en' ? 'Reports' : 'التقارير'}</h5>
            <hr />

            <div className={'grid'}>
                <div className={'col-12'}>
                    <label>
                        {lang === 'en' ? 'Report Type' : 'نوع التقرير'}
                    </label>
                    <Dropdown
                        className={'mt-2'}
                        value={selectedReport}
                        options={[
                            { label: lang === 'en' ? 'Active Clients' : 'العملاء النشطين', value: 'active clients' },
                            {
                                label: lang === 'en' ? 'Active Clients Offline' : 'العملاء النشطين غير متصلين',
                                value: 'active clients offline'
                            },
                            {
                                label: lang === 'en' ? 'Kitchen Meals Total' : 'إجمالي وجبات المطبخ',
                                value: 'kitchenMeals'
                            },
                            { label: lang === 'en' ? 'Payments\' History' : 'سجل المدفوعات', value: 'paymentHistory' },
                            { label: lang === 'en' ? 'Total Kitchen Meals' : 'اجمالى الوجبات الشهرى', value: 'totalKitchenMeals' }
                        ]}
                        onChange={(e) => setSelectedReport(e.value)}
                        placeholder={lang === 'en' ? 'Select Report' : 'اختر التقرير'}
                        style={{ width: '100%' }}
                    />
                </div>
                {(selectedReport !== 'active clients' && selectedReport !== 'active clients offline') && (
                    <div className={'col-6 flex flex-column'}>
                        <label>
                            {lang === 'en' ? 'Start Date' : 'تاريخ البداية'}
                        </label>
                        <Calendar
                            className={'mt-2'}
                            value={reportStartDate}
                            onChange={(e) => setReportStartDate(e.value)}
                            showIcon
                            placeholder={lang === 'en' ? 'Start Date' : 'تاريخ البداية'}
                        />
                    </div>)}
                {(selectedReport !== 'active clients' && selectedReport !== 'active clients offline') && (
                    <div className={'col-6 flex flex-column'}>
                        <label>
                            {lang === 'en' ? 'End Date' : 'تاريخ النهاية'}
                        </label>
                        <Calendar
                            className={'mt-2'}
                            value={reportEndDate}
                            onChange={(e) => setReportEndDate(e.value)}
                            showIcon
                            placeholder={lang === 'en' ? 'End Date' : 'تاريخ النهاية'}
                        />
                    </div>)}
                <div className={'col-12 mt-2'}>
                    <Button
                        label={lang === 'en' ? 'Generate Report' : 'إنشاء التقرير'}
                        className={'p-button-primary'}
                        style={{ width: '100%' }}
                        icon={'pi pi-file-pdf'}
                        onClick={getReport}
                    />
                </div>
            </div>
        </div>
    );
}