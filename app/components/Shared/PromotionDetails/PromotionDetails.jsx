import React, { useCallback, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import styles from './PromotionDetails.module.scss';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';

function PromotionDetails({ promotionId, lang = 'en' }) {
    const [promotionDetails, setPromotionDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    // FUNCTION TO GET THE PROMOTION DETAILS
    const getPromotionDetails = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error(lang === 'en' ? 'Authentication token not found.' : 'لم يتم العثور على رمز المصادقة.');
            setLoading(false);
            return;
        }

        setLoading(true);
        axios
            .get(`${process.env.API_URL}/sc/promotion/details?promotionId=${promotionId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then((response) => {
                setPromotionDetails(response.data?.promotion);
                setLoading(false);
            })
            .catch((error) => {
                toast.error(error.response?.data?.message || 'An error occurred');
                setLoading(false);
            });
    }, [promotionId, lang]);

    useEffect(() => {
        getPromotionDetails();
    }, [getPromotionDetails]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDiscount = (discount, type) => {
        if (type === 'ratio') {
            return `${(discount * 100).toFixed(0)}%`;
        }
        return `${discount} ${lang === 'en' ? 'EGP' : 'ج.م'}`;
    };

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center h-20rem">
                <i className="pi pi-spin pi-spinner text-3xl text-primary"></i>
            </div>
        );
    }

    if (!promotionDetails) {
        return (
            <div className="flex flex-column align-items-center justify-content-center h-20rem">
                <i className="pi pi-exclamation-triangle text-5xl text-red-500 mb-3"></i>
                <p className="text-500">{lang === 'en' ? 'Promotion not found' : 'العرض غير موجود'}</p>
            </div>
        );
    }

    return (
        <div className={styles.promotionDetails}>
            <div className="card">
                {/* Header Section */}
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <h2 className={styles.promotionTitle}>{promotionDetails.promotionTitle}</h2>
                        <Tag
                            value={promotionDetails.approved ?
                                (lang === 'en' ? 'Approved' : 'معتمد') :
                                (lang === 'en' ? 'Pending' : 'قيد الانتظار')
                            }
                            severity={promotionDetails.approved ? 'success' : 'warning'}
                            className={styles.statusTag}
                        />
                    </div>
                    
                    {promotionDetails.imageUrl && (
                        <img
                            crossOrigin='anonymous'
                            src={promotionDetails.imageUrl}
                            alt={promotionDetails.promotionTitle}
                            className={styles.promotionImage}
                        />
                    )}
                </div>

                <Divider />

                {/* Discount Details */}
                <div className={styles.discountSection}>
                    <h3 className={styles.sectionTitle}>
                        {lang === 'en' ? 'Discount Details' : 'تفاصيل الخصم'}
                    </h3>
                    <div className="grid">
                        {promotionDetails.promotionDetails?.map((detail, index) => (
                            <div key={detail._id} className="col-12 md:col-6">
                                <div className={styles.discountCard}>
                                    <div className={styles.discountTitle}>{detail.title}</div>
                                    <div className={styles.discountValue}>
                                        {formatDiscount(detail.discount, promotionDetails.discountType)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Divider />

                {/* Conditions */}
                {promotionDetails.promotionConditions?.length > 0 && (
                    <div className={styles.conditionsSection}>
                        <h3 className={styles.sectionTitle}>
                            {lang === 'en' ? 'Conditions' : 'الشروط'}
                        </h3>
                        <ul className={styles.conditionsList}>
                            {promotionDetails.promotionConditions.map((condition, index) => (
                                <li key={index} className={styles.conditionItem}>
                                    <i className="pi pi-check-circle text-green-500 mr-2"></i>
                                    {condition}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <Divider />

                {/* Service Center Info */}
                <div className={styles.serviceCenterSection}>
                    <h3 className={styles.sectionTitle}>
                        {lang === 'en' ? 'Service Center' : 'مركز الخدمة'}
                    </h3>
                    <div className={styles.serviceCenterCard}>
                        <div className={styles.serviceCenterId}>
                            {promotionDetails.serviceCenterId}
                        </div>
                    </div>
                </div>

                <Divider />

                {/* Expiry Date */}
                <div className={styles.expirySection}>
                    <div className={styles.expiryInfo}>
                        <i className="pi pi-calendar text-primary mr-2"></i>
                        <span className={styles.expiryLabel}>
                            {lang === 'en' ? 'Expires on:' : 'ينتهي في:'}
                        </span>
                        <span className={styles.expiryDate}>
                            {formatDate(promotionDetails.expiryDate)}
                        </span>
                    </div>
                </div>
                
                {/* Additional Info */}
                <div className={styles.additionalInfo}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>{lang === 'en' ? 'Created:' : 'تم الإنشاء:'}</span>
                        <span className={styles.infoValue}>{formatDate(promotionDetails.createdAt)}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>{lang === 'en' ? 'Last Updated:' : 'آخر تحديث:'}</span>
                        <span className={styles.infoValue}>{formatDate(promotionDetails.updatedAt)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PromotionDetails;
