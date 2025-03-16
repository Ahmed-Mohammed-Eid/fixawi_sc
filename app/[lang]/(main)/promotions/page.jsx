'use client';

import { useEffect, useState } from 'react';
// PRIME REACT
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function PromotionsPage({ params: { lang } }) {
    // ROUTER
    const router = useRouter();

    // STATES
    const [promotions, setPromotions] = useState([]);
    const [selectedPromotionToDelete, setSelectedPromotionToDelete] = useState(null);
    const [infoDialog, setInfoDialog] = useState({
        visible: false,
        data: null
    });

    // EFFECT TO FETCH DATA
    useEffect(() => {
        getPromotions();
    }, []);

    // GET PROMOTIONS FUNCTION
    const getPromotions = () => {
        const token = localStorage.getItem('token');

        axios
            .get(`${process.env.API_URL}/all/promotions`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then((res) => {
                const promotions = res.data?.promotions || [];
                setPromotions(promotions);
            })
            .catch((err) => {
                console.log(err);
                toast.error(lang === 'en' ? 'Failed to fetch promotions' : 'فشل في جلب العروض');
            });
    };

    // DELETE PROMOTION
    const deletePromotion = () => {
        const token = localStorage.getItem('token');

        if (!selectedPromotionToDelete) {
            return toast.error(lang === 'en' ? 'Please select a promotion to delete' : 'يرجى تحديد عرض للحذف');
        }

        axios
            .delete(`${process.env.API_URL}/delete/promotion`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    promotionId: selectedPromotionToDelete?._id
                }
            })
            .then((_) => {
                setSelectedPromotionToDelete(null);
                toast.success(lang === 'en' ? 'Promotion deleted successfully' : 'تم حذف العرض بنجاح');
                getPromotions();
            })
            .catch((err) => {
                console.log(err);
                toast.error(lang === 'en' ? 'Failed to delete promotion' : 'فشل في حذف العرض');
            });
    };

    return (
        <>
            <div className="card">
                {/* Header Section */}
                <div className="flex align-items-center justify-content-between mb-4">
                    <h1 className="text-2xl m-0">{lang === 'en' ? 'PROMOTIONS' : 'العروض'}</h1>
                </div>

                <DataTable
                    dir={lang === 'en' ? 'ltr' : 'rtl'}
                    value={promotions || []}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    currentPageReportTemplate={lang === 'en' ? 'Showing {first} to {last} of {totalRecords} promotions' : 'عرض {first} إلى {last} من {totalRecords} عرض'}
                    emptyMessage={lang === 'en' ? 'No promotions found' : 'لم يتم العثور على عروض'}
                    className="p-datatable-sm"
                >
                    <Column
                        field="promotionTitle"
                        header={lang === 'en' ? 'Promotion Title' : 'عنوان العرض'}
                        sortable
                        filter
                        filterPlaceholder={lang === 'en' ? 'Search by title' : 'ابحث بالعنوان'}
                        style={{ whiteSpace: 'nowrap', minWidth: '300px' }}
                    />

                    <Column
                        field="expiryDate"
                        header={lang === 'en' ? 'Expiry Date' : 'تاريخ الانتهاء'}
                        sortable
                        filter
                        filterPlaceholder={lang === 'en' ? 'Search by date' : 'ابحث بالتاريخ'}
                        style={{ whiteSpace: 'nowrap' }}
                        body={(rowData) => new Date(rowData.expiryDate).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG')}
                    />

                    <Column
                        field="approved"
                        header={lang === 'en' ? 'Status' : 'الحالة'}
                        sortable
                        filter
                        filterPlaceholder={lang === 'en' ? 'Search by status' : 'ابحث بالحالة'}
                        style={{ whiteSpace: 'nowrap' }}
                        body={(rowData) => <Tag value={lang === 'en' ? (rowData.approved ? 'Approved' : 'Pending') : rowData.approved ? 'معتمد' : 'قيد الانتظار'} severity={rowData.approved ? 'success' : 'warning'} />}
                    />

                    <Column
                        body={(rowData) => (
                            <div className={'flex justify-center gap-2'}>
                                <button
                                    className={'p-button p-button-info p-button-text'}
                                    onClick={() => {
                                        setInfoDialog({
                                            visible: true,
                                            data: rowData
                                        });
                                    }}
                                >
                                    <i className="pi pi-eye"></i>
                                </button>
                                <button className={'p-button p-button-warning p-button-text'} onClick={() => router.push(`/${lang}/promotions/${rowData._id}`)}>
                                    <i className="pi pi-pencil"></i>
                                </button>
                                <button className={'p-button p-button-danger p-button-text'} onClick={() => setSelectedPromotionToDelete(rowData)}>
                                    <i className="pi pi-trash"></i>
                                </button>
                            </div>
                        )}
                        header={lang === 'en' ? 'Actions' : 'الإجراءات'}
                        style={{ width: '10%' }}
                    />
                </DataTable>

                {/* DELETE DIALOG */}
                <Dialog
                    visible={selectedPromotionToDelete}
                    onHide={() => setSelectedPromotionToDelete(null)}
                    header={lang === 'en' ? 'Delete Promotion' : 'حذف العرض'}
                    footer={
                        <div className={'flex justify-center gap-2'}>
                            <button className={'p-button p-button-danger'} onClick={() => deletePromotion()}>
                                {lang === 'en' ? 'Delete' : 'حذف'}
                            </button>
                            <button className={'p-button'} onClick={() => setSelectedPromotionToDelete(null)}>
                                {lang === 'en' ? 'Cancel' : 'إلغاء'}
                            </button>
                        </div>
                    }
                    position={'center'}
                    style={{ width: '100%', maxWidth: '500px' }}
                    draggable={false}
                    resizable={false}
                    dir={lang === 'en' ? 'ltr' : 'rtl'}
                >
                    <div className={'flex px-2'}>
                        <p>{lang === 'en' ? 'Are you sure you want to delete this promotion?' : 'هل أنت متأكد أنك تريد حذف هذا العرض؟'}</p>
                    </div>
                </Dialog>

                {/* INFO DIALOG */}
                <Dialog
                    visible={infoDialog.visible}
                    onHide={() => setInfoDialog({ visible: false, data: null })}
                    header={lang === 'en' ? 'Promotion Details' : 'تفاصيل العرض'}
                    position={'center'}
                    style={{ width: '100%', maxWidth: '1000px' }}
                    draggable={false}
                    resizable={false}
                    dir={lang === 'en' ? 'ltr' : 'rtl'}
                >
                    <div className="p-fluid formgrid grid card mx-0">
                        <div className={'field col-12'}>
                            <h5>{lang === 'en' ? 'Promotion Title' : 'عنوان العرض'}</h5>
                            <p className="text-lg">{infoDialog.data?.promotionTitle}</p>
                        </div>

                        <div className={'field col-12'}>
                            <h5>{lang === 'en' ? 'Promotion Details' : 'تفاصيل العرض'}</h5>
                            <div className="grid">
                                {infoDialog.data?.promotionDetails.map((detail, index) => (
                                    <div key={detail._id} className="col-12 md:col-6 lg:col-4">
                                        <div className="p-3 border-round surface-border border-1">
                                            <p className="font-bold mb-2">{detail.title}</p>
                                            <p className="text-xl">{(detail.discount * 100).toFixed(0)}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={'field col-12'}>
                            <h5>{lang === 'en' ? 'Conditions' : 'الشروط'}</h5>
                            <ul className="m-0 p-0 list-none">
                                {infoDialog.data?.promotionConditions.map((condition, index) => (
                                    <li key={index} className="mb-2 p-2 border-round surface-ground">
                                        {condition}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={'field col-12 md:col-6'}>
                            <h5>{lang === 'en' ? 'Expiry Date' : 'تاريخ الانتهاء'}</h5>
                            <p>{new Date(infoDialog.data?.expiryDate).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG')}</p>
                        </div>

                        <div className={'field col-12 md:col-6'}>
                            <h5>{lang === 'en' ? 'Status' : 'الحالة'}</h5>
                            <Tag value={lang === 'en' ? (infoDialog.data?.approved ? 'Approved' : 'Pending') : infoDialog.data?.approved ? 'معتمد' : 'قيد الانتظار'} severity={infoDialog.data?.approved ? 'success' : 'warning'} />
                        </div>
                    </div>
                </Dialog>
            </div>
        </>
    );
}
