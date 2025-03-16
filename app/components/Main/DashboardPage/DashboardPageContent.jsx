'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

export default function DashboardPageContent({ lang }) {
    const isRTL = lang === 'ar';

    // ROUTER
    const router = useRouter();

    // STATE
    const [visits, setVisits] = useState([]);
    const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
    const [selectedVisitId, setSelectedVisitId] = useState(null);

    // GET THE VISITS HANDLER
    function getVisits() {
        // GET THE TOKEN
        const token = localStorage.getItem('token') || null;

        axios
            .get(`${process.env.API_URL}/service/center/visits`, {
                headers: {
                    Authorization: `Bearer ${token}`
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
                        userId: visit?.userId?._id
                    };
                });

                setVisits(visitsTableArray || []);
            })
            .catch((error) => {
                toast.error(error.response?.data?.message || 'An error occurred');
                return null;
            });
    }

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

    useEffect(() => {
        getVisits();
    }, []);

    return (
        <>
            <div className="card mb-0" dir={isRTL ? 'rtl' : 'ltr'}>
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
                                return rowData.visitStatus === 'canceled' ? null : (
                                    <div className="flex gap-2">
                                        <Button
                                            icon="pi pi-file-edit"
                                            className="p-button-success p-button-sm"
                                            tooltip={lang === 'en' ? 'Create Check Report' : 'إنشاء تقرير فحص'}
                                            tooltipOptions={{ position: 'top' }}
                                            onClick={() => router.push(`/${lang}/check-reports?visitId=${rowData.userId}`)}
                                        />
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
        </>
    );
}
