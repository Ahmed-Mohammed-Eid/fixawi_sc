'use client';

import { useState, useEffect } from 'react';
// PRIME REACT
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';

// HELPERS
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';

import CustomFileUpload from '../../../../components/Main/Layout/customFileUpload/customFileUpload';

export default function EditPromotion({ params: { lang, id } }) {
    const router = useRouter();

    // STATES
    const [formData, setFormData] = useState({
        promotionTitle: '',
        promotionDetails: [{ title: '', discount: 0 }],
        promotionConditions: [''],
        expiryDate: null
    });

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // VALIDATE FORM
    const validateForm = () => {
        const newErrors = {};

        // Validate promotionTitle
        if (!formData.promotionTitle.trim()) {
            newErrors.promotionTitle = lang === 'en' ? 'Promotion Title is a required field.' : 'عنوان العرض مطلوب.';
        }

        // Validate expiryDate
        if (!formData.expiryDate) {
            newErrors.expiryDate = lang === 'en' ? 'Expiry Date is a required field.' : 'تاريخ الإنتهاء مطلوب.';
        }

        // Validate promotionDetails
        formData.promotionDetails.forEach((detail, index) => {
            if (!detail.title.trim()) {
                if (!newErrors.promotionDetails) newErrors.promotionDetails = [];
                if (!newErrors.promotionDetails[index]) newErrors.promotionDetails[index] = {};
                newErrors.promotionDetails[index].title = lang === 'en' ? 'Detail Title is a required field.' : 'عنوان التفصيل مطلوب.';
            }
            if (typeof detail.discount !== 'number' || detail.discount <= 0) {
                if (!newErrors.promotionDetails) newErrors.promotionDetails = [];
                if (!newErrors.promotionDetails[index]) newErrors.promotionDetails[index] = {};
                newErrors.promotionDetails[index].discount = lang === 'en' ? 'Discount must be a positive value.' : 'يجب أن يكون الخصم قيمة موجبة.';
            }
        });

        // Validate promotionConditions
        formData.promotionConditions.forEach((condition, index) => {
            if (!condition.trim()) {
                if (!newErrors.promotionConditions) newErrors.promotionConditions = [];
                newErrors.promotionConditions[index] = lang === 'en' ? 'Condition cannot be empty.' : 'لا يمكن أن يكون الشرط فارغًا.';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // FETCH PROMOTION DATA
    useEffect(() => {
        const fetchPromotion = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await axios.get(`${process.env.API_URL}/promotion/details?promotionId=${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const promotionData = response.data?.promotion;
                setFormData({
                    ...promotionData,
                    expiryDate: new Date(promotionData.expiryDate)
                });
            } catch (error) {
                console.error(error);
                toast.error(error?.response?.data?.message || (lang === 'en' ? 'Failed to fetch promotion' : 'فشل في جلب العرض'));
                // router.push(`/${lang}/promotions`);
            }
        };

        fetchPromotion();
    }, [id, lang, router]);

    // HANDLE INPUT CHANGES
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // HANDLE PROMOTION DETAILS CHANGES
    const handleDetailsChange = (index, field, value) => {
        setFormData((prev) => {
            const updatedDetails = [...prev.promotionDetails];
            updatedDetails[index] = {
                ...updatedDetails[index],
                [field]: value
            };
            return {
                ...prev,
                promotionDetails: updatedDetails
            };
        });
    };

    // HANDLE CONDITIONS CHANGES
    const handleConditionChange = (index, value) => {
        setFormData((prev) => {
            const updatedConditions = [...prev.promotionConditions];
            updatedConditions[index] = value;
            return {
                ...prev,
                promotionConditions: updatedConditions
            };
        });
    };

    // ADD NEW DETAIL
    const addDetail = () => {
        setFormData((prev) => ({
            ...prev,
            promotionDetails: [...prev.promotionDetails, { title: '', discount: 0 }]
        }));
    };

    // REMOVE DETAIL
    const removeDetail = (index) => {
        setFormData((prev) => ({
            ...prev,
            promotionDetails: prev.promotionDetails.filter((_, i) => i !== index)
        }));
    };

    // ADD NEW CONDITION
    const addCondition = () => {
        setFormData((prev) => ({
            ...prev,
            promotionConditions: [...prev.promotionConditions, '']
        }));
    };

    // REMOVE CONDITION
    const removeCondition = (index) => {
        setFormData((prev) => ({
            ...prev,
            promotionConditions: prev.promotionConditions.filter((_, i) => i !== index)
        }));
    }; // HANDLE SUBMIT
    const handleSubmit = async (e, saveAndClear = false) => {
        e.preventDefault();
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        // Create FormData instance
        const formDataToSend = new FormData();

        // Add promotion ID
        formDataToSend.append('promotionId', id);

        // Add basic promotion data
        formDataToSend.append('promotionTitle', formData.promotionTitle);
        formDataToSend.append('expiryDate', formData.expiryDate.toISOString());

        // Filter and add promotion details
        const cleanedDetails = formData.promotionDetails.filter((detail) => detail.title && detail.discount > 0);
        formDataToSend.append('promotionDetails', JSON.stringify(cleanedDetails));

        // Filter and add conditions
        const cleanedConditions = formData.promotionConditions.filter((condition) => condition.trim());
        formDataToSend.append('promotionConditions', JSON.stringify(cleanedConditions));

        // Add files
        if (files && files.length > 0) {
            files.forEach((file) => {
                formDataToSend.append('files', file);
            });
        }

        const token = localStorage.getItem('token');

        try {
            await axios.put(`${process.env.API_URL}/update/promotion`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success(lang === 'en' ? 'Promotion updated successfully' : 'تم تحديث العرض بنجاح');

            if (saveAndClear) {
                setFormData({
                    promotionTitle: '',
                    promotionDetails: [{ title: '', discount: 0 }],
                    promotionConditions: [''],
                    expiryDate: null
                });
                setFiles([]);
            } else {
                router.push(`/${lang}/promotions`);
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || (lang === 'en' ? 'Failed to update promotion' : 'فشل في تحديث العرض'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form dir={lang === 'en' ? 'ltr' : 'rtl'}>
                <div className="mb-4 card">
                    <h1 className="text-2xl mb-5 uppercase">{lang === 'en' ? 'Edit Promotion' : 'تعديل العرض'}</h1>

                    <div className="p-fluid formgrid grid">
                        {/* Promotion Title Section */}
                        <div className="field col-12 mb-4 md:col-6">
                            <label htmlFor="promotionTitle" className="font-medium mb-2 block">
                                {lang === 'en' ? 'Promotion Title' : 'عنوان العرض'}
                                <span className="text-red-500"> *</span>
                            </label>
                            <InputText id="promotionTitle" name="promotionTitle" value={formData.promotionTitle} onChange={handleChange} placeholder={lang === 'en' ? 'Enter promotion title' : 'أدخل عنوان العرض'} required className={`w-full ${errors.promotionTitle ? 'p-invalid' : ''}`} />
                            {errors.promotionTitle && <small className="p-error">{errors.promotionTitle}</small>}
                        </div>

                        {/* Expiry Date Section */}
                        <div className="field col-12 md:col-6">
                            <label htmlFor="expiryDate" className="font-medium mb-2 block">
                                {lang === 'en' ? 'Expiry Date' : 'تاريخ الانتهاء'}
                                <span className="text-red-500"> *</span>
                            </label>
                            <Calendar
                                id="expiryDate"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.value }))}
                                showIcon
                                dateFormat="dd/mm/yy"
                                minDate={new Date()}
                                placeholder={lang === 'en' ? 'Select expiry date' : 'اختر تاريخ الانتهاء'}
                                required
                                className={`w-full ${errors.expiryDate ? 'p-invalid' : ''}`}
                            />
                            {errors.expiryDate && <small className="p-error">{errors.expiryDate}</small>}
                        </div>

                        {/* Promotion Details Section */}
                        <div className="field col-12 mb-4">
                            <label className="font-medium mb-3 block">
                                {lang === 'en' ? 'Promotion Details' : 'تفاصيل العرض'}
                                <span className="text-red-500"> *</span>
                            </label>
                            <div className="border-1 border-round p-3 surface-border">
                                {formData.promotionDetails.map((detail, index) => (
                                    <div key={index} className="grid mb-3 align-items-center">
                                        <div className="col-12 md:col-6 field mb-2 md:mb-0">
                                            <label htmlFor={`detail-title-${index}`} className="block mb-2">
                                                {lang === 'en' ? 'Detail Title' : 'عنوان التفصيل'}
                                                <span className="text-red-500"> *</span>
                                            </label>
                                            <InputText
                                                id={`detail-title-${index}`}
                                                value={detail.title}
                                                onChange={(e) => handleDetailsChange(index, 'title', e.target.value)}
                                                placeholder={lang === 'en' ? 'Enter detail title' : 'أدخل عنوان التفصيل'}
                                                className={`w-full ${errors.promotionDetails?.[index]?.title ? 'p-invalid' : ''}`}
                                            />
                                            {errors.promotionDetails?.[index]?.title && <small className="p-error">{errors.promotionDetails[index].title}</small>}
                                        </div>
                                        <div className="col-12 md:col-5 field mb-2 md:mb-0">
                                            <label htmlFor={`detail-discount-${index}`} className="block mb-2">
                                                {lang === 'en' ? 'Discount' : 'الخصم'}
                                                <span className="text-red-500"> *</span>
                                            </label>
                                            <InputNumber
                                                id={`detail-discount-${index}`}
                                                value={detail.discount}
                                                onValueChange={(e) => handleDetailsChange(index, 'discount', e.value)}
                                                mode="decimal"
                                                minFractionDigits={2}
                                                maxFractionDigits={2}
                                                min={0.01} // Discount must be positive
                                                max={1}
                                                placeholder={lang === 'en' ? '0.01-1.00' : '0.01-1.00'}
                                                className={`w-full ${errors.promotionDetails?.[index]?.discount ? 'p-invalid' : ''}`}
                                            />
                                            {errors.promotionDetails?.[index]?.discount && <small className="p-error">{errors.promotionDetails[index].discount}</small>}
                                        </div>
                                        <div className="col-12 md:col-1 mt-auto flex align-items-end justify-content-center">
                                            <Button type="button" icon="pi pi-trash" severity="danger" onClick={() => removeDetail(index)} disabled={formData.promotionDetails.length === 1} className="p-button-rounded p-button-outlined" />
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" label={lang === 'en' ? 'Add Detail' : 'إضافة تفصيل'} icon="pi pi-plus" severity="secondary" onClick={addDetail} className="mt-3 p-button-outlined" />
                            </div>
                        </div>

                        {/* Conditions Section */}
                        <div className="field col-12 mb-4">
                            <label className="font-medium mb-3 block">
                                {lang === 'en' ? 'Conditions' : 'الشروط'}
                                <span className="text-red-500"> *</span>
                            </label>
                            <div className="border-1 border-round p-3 surface-border">
                                {formData.promotionConditions.map((condition, index) => (
                                    <div key={index} className="grid mb-3 align-items-center">
                                        <div className="col-12 md:col-11 field mb-2 md:mb-0">
                                            <label htmlFor={`condition-${index}`} className="block mb-2">
                                                {lang === 'en' ? `Condition ${index + 1}` : `الشرط ${index + 1}`}
                                                <span className="text-red-500"> *</span>
                                            </label>
                                            <InputText id={`condition-${index}`} value={condition} onChange={(e) => handleConditionChange(index, e.target.value)} placeholder={lang === 'en' ? 'Enter condition' : 'أدخل الشرط'} className={`w-full ${errors.promotionConditions?.[index] ? 'p-invalid' : ''}`} />
                                            {errors.promotionConditions?.[index] && <small className="p-error">{errors.promotionConditions[index]}</small>}
                                        </div>
                                        <div className="col-12 md:col-1 mt-auto flex align-items-end justify-content-center">
                                            <Button type="button" icon="pi pi-trash" severity="danger" onClick={() => removeCondition(index)} disabled={formData.promotionConditions.length === 1} className="p-button-rounded p-button-outlined" />
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" label={lang === 'en' ? 'Add Condition' : 'إضافة شرط'} icon="pi pi-plus" severity="secondary" onClick={addCondition} className="mt-3 p-button-outlined" />
                            </div>
                        </div>

                        {/* FILES */}
                        <div className={'field col-12'}>
                            <label htmlFor="files">{lang === 'en' ? 'Images' : 'الصور'}</label>
                            <CustomFileUpload id="files" multiple={false} setFiles={(files) => setFiles(files)} removeThisItem={() => setFiles([])} />
                        </div>
                    </div>
                    <div className="flex justify-content-center mt-5 gap-5">
                        <Button label={lang === 'en' ? 'Save and Clear' : 'حفظ وتفريغ'} icon="pi pi-save" onClick={(e) => handleSubmit(e, true)} loading={loading} className="p-button-lg flex-1" />
                        <Button severity="secondary" label={lang === 'en' ? 'Save and Exit' : 'حفظ والخروج'} icon="pi pi-save" onClick={(e) => handleSubmit(e, false)} loading={loading} className="p-button-lg flex-1" />
                    </div>
                </div>
            </form>
        </>
    );
}
