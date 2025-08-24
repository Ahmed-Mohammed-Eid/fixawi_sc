'use client';

import { useState } from 'react';
// PRIME REACT
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';

// HELPERS
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation';

import CustomFileUpload from '../../../../components/Main/Layout/customFileUpload/customFileUpload';

export default function AddPromotion({ params: { lang } }) {
    const router = useRouter();

    // STATES
    const [formData, setFormData] = useState({
        promotionTitle: '',
        promotionDetails: [{ title: '', discount: 0 }],
        promotionConditions: [''],
        expiryDate: null,
        discountType: 'ratio',
        discountAmount: 0
    });

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // VALIDATE FORM
    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        // Validate promotionTitle
        if (!formData.promotionTitle.trim()) {
            newErrors.promotionTitle = lang === 'en' ? 'Promotion Title is a required field.' : 'عنوان العرض مطلوب.';
            isValid = false;
        }

        // Validate expiryDate
        if (!formData.expiryDate) {
            newErrors.expiryDate = lang === 'en' ? 'Expiry Date is a required field.' : 'تاريخ الإنتهاء مطلوب.';
            isValid = false;
        }

        // Validate discountType
        if (!formData.discountType) {
            newErrors.discountType = lang === 'en' ? 'Discount Type is a required field.' : 'نوع الخصم مطلوب.';
            isValid = false;
        }

        // Validate discountAmount
        if (formData.discountAmount <= 0) {
            newErrors.discountAmount = lang === 'en' ? 'Discount Amount must be a positive value.' : 'يجب أن يكون مبلغ الخصم قيمة موجبة.';
            isValid = false;
        }

        // Validate promotionDetails
        newErrors.promotionDetails = [];
        formData.promotionDetails.forEach((detail, index) => {
            const detailErrors = {};
            if (!detail.title.trim()) {
                detailErrors.title = lang === 'en' ? 'Detail Title is a required field.' : 'عنوان التفصيل مطلوب.';
                isValid = false;
            }
            // if (detail.discount <= 0) {
            //     detailErrors.discount = lang === 'en' ? 'Discount must be a positive value.' : 'يجب أن يكون الخصم قيمة موجبة.';
            //     isValid = false;
            // }
            if (Object.keys(detailErrors).length > 0) {
                newErrors.promotionDetails[index] = detailErrors;
            }
        });
        if (newErrors.promotionDetails.every(err => !err)) {
            delete newErrors.promotionDetails;
        }


        // Validate promotionConditions
        newErrors.promotionConditions = [];
        formData.promotionConditions.forEach((condition, index) => {
            if (!condition.trim()) {
                newErrors.promotionConditions[index] = lang === 'en' ? 'Condition cannot be empty.' : 'لا يمكن أن يكون الشرط فارغًا.';
                isValid = false;
            }
        });
        if (newErrors.promotionConditions.every(err => !err)) {
            delete newErrors.promotionConditions;
        }

        setErrors(newErrors);
        return isValid;
    };

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
    const handleSubmit = async (e, addAndClear = false) => {
        e.preventDefault();
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        // Create FormData instance
        const formDataToSend = new FormData();

        // Add basic promotion data
        formDataToSend.append('promotionTitle', formData.promotionTitle);
        formDataToSend.append('expiryDate', formData.expiryDate.toISOString());
        formDataToSend.append('discountType', formData.discountType);
        formDataToSend.append('discountValue', formData.discountAmount);

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
            await axios.post(`${process.env.API_URL}/sc/create/promotion`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success(lang === 'en' ? 'Promotion added successfully' : 'تمت إضافة العرض بنجاح');

            if (addAndClear) {
                setFormData({
                    promotionTitle: '',
                    promotionDetails: [{ title: '', discount: 0 }],
                    promotionConditions: [''],
                    expiryDate: null,
                    discountType: 'ratio',
                    discountAmount: 0
                });
            } else {
                router.push(`/${lang}/promotions`);
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || (lang === 'en' ? 'Failed to add promotion' : 'فشل في إضافة العرض'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form dir={lang === 'en' ? 'ltr' : 'rtl'}>
                <div className="mb-4 card">
                    <h1 className="text-2xl mb-5 uppercase">{lang === 'en' ? 'Add New Promotion' : 'إضافة عرض جديد'}</h1>

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

                        {/* Discount Type Section */}
                        <div className="field col-12 md:col-6">
                            <label htmlFor="discountType" className="font-medium mb-2 block">
                                {lang === 'en' ? 'Discount Type' : 'نوع الخصم'}
                                <span className="text-red-500"> *</span>
                            </label>
                            <Dropdown
                                id="discountType"
                                name="discountType"
                                value={formData.discountType}
                                options={[
                                    { label: lang === 'en' ? 'Ratio' : 'نسبة', value: 'ratio' },
                                    { label: lang === 'en' ? 'Fixed Amount' : 'مبلغ ثابت', value: 'fixed amount' }
                                ]}
                                onChange={(e) => handleChange({ target: { name: 'discountType', value: e.value } })}
                                placeholder={lang === 'en' ? 'Select discount type' : 'اختر نوع الخصم'}
                                required
                                className={`w-full \${errors.discountType ? 'p-invalid' : ''}`}
                            />
                            {errors.discountType && <small className="p-error">{errors.discountType}</small>}
                        </div>

                        {/* Discount Amount Section */}
                        <div className="field col-12 md:col-6">
                            <label htmlFor="discountAmount" className="font-medium mb-2 block">
                                {lang === 'en' ? 'Discount Amount' : 'مبلغ الخصم'}
                                <span className="text-red-500"> *</span>
                            </label>
                            <InputNumber
                                id="discountAmount"
                                name="discountAmount"
                                value={formData.discountAmount}
                                onValueChange={(e) => handleChange({ target: { name: 'discountAmount', value: e.value } })}
                                placeholder={lang === 'en' ? 'Enter discount amount' : 'أدخل مبلغ الخصم'}
                                required
                                mode="decimal"
                                minFractionDigits={0}
                                maxFractionDigits={2}
                                min={0}
                                className={`w-full \${errors.discountAmount ? 'p-invalid' : ''}`}
                            />
                            {errors.discountAmount && <small className="p-error">{errors.discountAmount}</small>}
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
                                                {lang === 'en' ? 'Detail Title' : 'عنوان الخدمة'}
                                                <span className="text-red-500"> *</span>
                                            </label>
                                            <InputText
                                                id={`detail-title-${index}`}
                                                value={detail.title}
                                                onChange={(e) => handleDetailsChange(index, 'title', e.target.value)}
                                                placeholder={lang === 'en' ? 'Enter detail title' : 'أدخل عنوان الخدمة'}
                                                className={`w-full ${errors.promotionDetails?.[index]?.title ? 'p-invalid' : ''}`}
                                            />
                                            {errors.promotionDetails?.[index]?.title && <small className="p-error">{errors.promotionDetails[index].title}</small>}
                                        </div>
                                        <div className="col-12 md:col-5 field mb-2 md:mb-0">
                                            <label htmlFor={`detail-discount-${index}`} className="block mb-2">
                                                {lang === 'en' ? 'Discount' : 'الخصم'}
                                                {/* <span className="text-red-500"> *</span> */}
                                            </label>
                                            <InputNumber
                                                id={`detail-discount-${index}`}
                                                value={detail.discount}
                                                onValueChange={(e) => handleDetailsChange(index, 'discount', e.value)}
                                                mode="decimal"
                                                minFractionDigits={2}
                                                maxFractionDigits={2}
                                                min={0}
                                                max={1}
                                                step={0.01}
                                                showButtons
                                                placeholder={lang === 'en' ? '0.00-1.00' : '0.00-1.00'}
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
                        <Button label={lang === 'en' ? 'Add and Clear' : 'إضافة وتفريغ'} icon="pi pi-plus" onClick={(e) => handleSubmit(e, true)} loading={loading} className="p-button-lg flex-1" />
                        <Button severity="secondary" label={lang === 'en' ? 'Add and Exit' : 'إضافة والخروج'} icon="pi pi-plus" onClick={(e) => handleSubmit(e, false)} loading={loading} className="p-button-lg flex-1" />
                    </div>
                </div>
            </form>
        </>
    );
}
