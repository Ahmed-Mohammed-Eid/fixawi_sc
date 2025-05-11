'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { toast } from 'react-hot-toast';
import { Calendar } from 'primereact/calendar';

export default function CreateCheckReport({ lang }) {
    const isRTL = lang === 'ar';

    // ROUTER
    const router = useRouter();
    // SEARCH PARAMS
    const searchParams = useSearchParams();
    const visitId = searchParams?.get('visitId') || null;
    const userId = searchParams?.get('userId') || null;
    const isBooking = searchParams?.get('isBooking') || null;
    const time = searchParams?.get('time') || null;
    const date = searchParams?.get('date') || null;
    const bookingId = searchParams?.get('bookingId') || null;

    if (!visitId) {
        new Promise(() => router.push(`/${lang}`)).then(() => {
            toast.error(lang === 'en' ? 'Please select a visit first' : 'يرجى تحديد زيارة أولاً');
        });
    }

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [checkReport, setCheckReport] = useState({
        clientName: '',
        phoneNumber: '',
        carBrand: '',
        carModel: '',
        date: new Date(),
        checkDetails: [],
        total: 0
    });

    const validateForm = () => {
        const newErrors = { checkDetails: [] };
        let isValid = true;

        if (!checkReport.clientName) {
            newErrors.clientName = lang === 'en' ? 'Client Name is required.' : 'اسم العميل مطلوب.';
            isValid = false;
        }
        if (!checkReport.phoneNumber) {
            newErrors.phoneNumber = lang === 'en' ? 'Phone Number is required.' : 'رقم الهاتف مطلوب.';
            isValid = false;
        }
        if (!checkReport.carBrand) {
            newErrors.carBrand = lang === 'en' ? 'Car Brand is required.' : 'ماركة السيارة مطلوبة.';
            isValid = false;
        }
        if (!checkReport.carModel) {
            newErrors.carModel = lang === 'en' ? 'Car Model is required.' : 'موديل السيارة مطلوب.';
            isValid = false;
        }
        if (!checkReport.date) {
            newErrors.date = lang === 'en' ? 'Date is required.' : 'التاريخ مطلوب.';
            isValid = false;
        }

        if (checkReport.checkDetails.length === 0) {
            newErrors.checkDetailsGeneral = lang === 'en' ? 'Please add at least one check detail.' : 'يرجى إضافة تفصيل فحص واحد على الأقل.';
            isValid = false;
        } else {
            checkReport.checkDetails.forEach((detail, index) => {
                const detailErrors = {};
                if (!detail.service) {
                    detailErrors.service = lang === 'en' ? 'Service is required.' : 'الخدمة مطلوبة.';
                    isValid = false;
                }
                if (!(detail.quantity > 0)) {
                    detailErrors.quantity = lang === 'en' ? 'Quantity must be greater than 0.' : 'يجب أن تكون الكمية أكبر من 0.';
                    isValid = false;
                }
                if (!(detail.price > 0)) {
                    detailErrors.price = lang === 'en' ? 'Price must be greater than 0.' : 'يجب أن يكون السعر أكبر من 0.';
                    isValid = false;
                }
                newErrors.checkDetails[index] = detailErrors;
            });
        }

        setErrors(newErrors);
        return isValid;
    };


    useEffect(() => {
        const fetchVisitorDetails = async () => {
            if (!visitId) return;

            const token = localStorage.getItem('token') || null;

            try {
                const response = await axios.get(`${process.env.API_URL}/visitor/details`, {
                    params: { userId: userId, visitId: visitId },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const visitor = response.data;

                let defaultCar = visitor.user.userCars?.findIndex((car) => car.isDefaultCar);
                defaultCar = defaultCar !== -1 ? visitor.user.userCars[defaultCar] : visitor.user.userCars[0];

                const objectToSet = {
                    clientName: visitor?.user?.fullName,
                    phoneNumber: visitor.user?.phoneNumber,
                    carBrand: defaultCar?.carBrand || '',
                    carModel: defaultCar?.carModel || ''
                };

                if (visitor.user.userCars.length > 0) {
                    setCheckReport((prev) => ({
                        ...prev,
                        ...objectToSet
                    }));
                }
            } catch (error) {
                toast.error(error.response?.data?.message || (lang === 'en' ? 'Failed to fetch visitor details' : 'فشل في جلب بيانات الزائر'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchVisitorDetails();
    }, [visitId, lang, userId]);

    function addCheckDetail() {
        setCheckReport((prev) => ({
            ...prev,
            checkDetails: [
                ...prev.checkDetails,
                {
                    service: '',
                    quantity: 1,
                    price: 0,
                    amount: 0
                }
            ]
        }));
    }

    function removeCheckDetail(index) {
        setCheckReport((prev) => ({
            ...prev,
            checkDetails: prev.checkDetails.filter((_, i) => i !== index)
        }));
    }

    function updateCheckDetail(index, field, value) {
        setCheckReport((prev) => {
            const updatedDetails = [...prev.checkDetails];
            updatedDetails[index] = {
                ...updatedDetails[index],
                [field]: value
            };

            // Calculate amount if quantity or price changes
            if (field === 'quantity' || field === 'price') {
                updatedDetails[index].amount = updatedDetails[index].quantity * updatedDetails[index].price;
            }

            // Calculate total
            const total = updatedDetails.reduce((sum, item) => sum + item.amount, 0);

            return {
                ...prev,
                checkDetails: updatedDetails,
                total
            };
        });
    }

    async function submitCheckReport(event) {
        event.preventDefault();
        setIsSubmitting(true);

        if (!validateForm()) {
            setIsSubmitting(false);
            return;
        }

        if(isBooking === 'true' && (!time || !date || !bookingId)) {
            toast.error(lang === 'en' ? 'Please select a time and date for the booking' : 'يرجى تحديد الوقت والتاريخ للحجز');
            setIsSubmitting(false);
            return;
        }

        // Get token
        const token = localStorage.getItem('token') || null;

        // Prepare payload
        const payload = {
            ...checkReport,
            visitId: visitId,
            isBooking: isBooking === 'true' ? true : false,
            date: checkReport.date.toISOString(),
            time: time,
            bookingId: bookingId,
        };

        try {
            // setIsSubmitting(true); // Moved up
            await axios.post(`${process.env.API_URL}/create/check/report`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            toast.success(lang === 'en' ? 'Check report created successfully' : 'تم إنشاء تقرير الفحص بنجاح');

            router.push(`/${lang}/check-reports/get-check-reports`);
        } catch (error) {
            toast.error(error.response?.data?.message || (lang === 'en' ? 'Something went wrong' : 'حدث خطأ ما'));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <form onSubmit={submitCheckReport} className="p-fluid" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="card">
                    <h3 className="text-2xl mb-5 uppercase">{lang === 'en' ? 'Create Check Report' : 'إنشاء تقرير فحص'}</h3>
                    <hr />

                    <div className="formgrid grid">
                        <div className="field col-12 md:col-6">
                            <label htmlFor="clientName" className="font-bold">
                                {lang === 'en' ? 'Client Name' : 'اسم العميل'} <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="clientName"
                                value={checkReport.clientName}
                                onChange={(e) =>
                                    setCheckReport((prev) => ({
                                        ...prev,
                                        clientName: e.target.value
                                    }))
                                }
                                placeholder={lang === 'en' ? 'Enter client name' : 'أدخل اسم العميل'}
                                className={errors.clientName ? 'p-invalid' : ''}
                            />
                            {errors.clientName && <small className="p-error">{errors.clientName}</small>}
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="phoneNumber" className="font-bold">
                                {lang === 'en' ? 'Phone Number' : 'رقم الهاتف'} <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="phoneNumber"
                                value={checkReport.phoneNumber}
                                onChange={(e) =>
                                    setCheckReport((prev) => ({
                                        ...prev,
                                        phoneNumber: e.target.value
                                    }))
                                }
                                placeholder={lang === 'en' ? 'Enter phone number' : 'أدخل رقم الهاتف'}
                                className={errors.phoneNumber ? 'p-invalid' : ''}
                            />
                            {errors.phoneNumber && <small className="p-error">{errors.phoneNumber}</small>}
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="carBrand" className="font-bold">
                                {lang === 'en' ? 'Car Brand' : 'ماركة السيارة'} <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="carBrand"
                                value={checkReport.carBrand}
                                onChange={(e) =>
                                    setCheckReport((prev) => ({
                                        ...prev,
                                        carBrand: e.target.value
                                    }))
                                }
                                placeholder={lang === 'en' ? 'Enter car brand' : 'أدخل ماركة السيارة'}
                                className={errors.carBrand ? 'p-invalid' : ''}
                            />
                            {errors.carBrand && <small className="p-error">{errors.carBrand}</small>}
                        </div>

                        <div className="field col-12 md:col-6">
                            <label htmlFor="carModel" className="font-bold">
                                {lang === 'en' ? 'Car Model' : 'موديل السيارة'} <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="carModel"
                                value={checkReport.carModel}
                                onChange={(e) =>
                                    setCheckReport((prev) => ({
                                        ...prev,
                                        carModel: e.target.value
                                    }))
                                }
                                placeholder={lang === 'en' ? 'Enter car model' : 'أدخل موديل السيارة'}
                                className={errors.carModel ? 'p-invalid' : ''}
                            />
                            {errors.carModel && <small className="p-error">{errors.carModel}</small>}
                        </div>

                        <div className="field col-12">
                            <label htmlFor="date" className="font-bold">
                                {lang === 'en' ? 'Date' : 'التاريخ'} <span className="text-red-500">*</span>
                            </label>
                            <Calendar
                                id="date"
                                type="date"
                                value={checkReport.date}
                                showIcon
                                onChange={(e) =>
                                    setCheckReport((prev) => ({
                                        ...prev,
                                        date: e.target.value
                                    }))
                                }
                                placeholder={lang === 'en' ? 'Select date' : 'اختر التاريخ'}
                                className={errors.date ? 'p-invalid' : ''}
                            />
                            {errors.date && <small className="p-error">{errors.date}</small>}
                        </div>
                    </div>
                </div>

                <div className="card mt-5">
                    <h4 className="text-xl mb-3">{lang === 'en' ? 'Check Details' : 'تفاصيل الفحص'} <span className="text-red-500">*</span></h4>
                    {errors.checkDetailsGeneral && <small className="p-error d-block mb-2">{errors.checkDetailsGeneral}</small>}

                    {checkReport.checkDetails.map((detail, index) => (
                        <div className="formgrid grid mb-3" key={index}>
                            <div className="field col-12 md:col-4">
                                <label htmlFor={`service-${index}`}>{lang === 'en' ? 'Service' : 'الخدمة'} <span className="text-red-500">*</span></label>
                                <InputText id={`service-${index}`} value={detail.service} onChange={(e) => updateCheckDetail(index, 'service', e.target.value)} placeholder={lang === 'en' ? 'Enter service' : 'أدخل الخدمة'} className={errors.checkDetails?.[index]?.service ? 'p-invalid' : ''} />
                                {errors.checkDetails?.[index]?.service && <small className="p-error">{errors.checkDetails[index].service}</small>}
                            </div>

                            <div className="field col-12 md:col-3">
                                <label htmlFor={`quantity-${index}`}>{lang === 'en' ? 'Quantity' : 'الكمية'} <span className="text-red-500">*</span></label>
                                <InputNumber id={`quantity-${index}`} value={detail.quantity} onValueChange={(e) => updateCheckDetail(index, 'quantity', e.value)} min={1} placeholder={lang === 'en' ? 'Quantity' : 'الكمية'} className={errors.checkDetails?.[index]?.quantity ? 'p-invalid' : ''} />
                                {errors.checkDetails?.[index]?.quantity && <small className="p-error">{errors.checkDetails[index].quantity}</small>}
                            </div>

                            <div className="field col-12 md:col-2">
                                <label htmlFor={`price-${index}`}>{lang === 'en' ? 'Price' : 'السعر'} <span className="text-red-500">*</span></label>
                                <InputNumber id={`price-${index}`} value={detail.price} onValueChange={(e) => updateCheckDetail(index, 'price', e.value)} min={0} placeholder={lang === 'en' ? 'Price' : 'السعر'} className={errors.checkDetails?.[index]?.price ? 'p-invalid' : ''} />
                                {errors.checkDetails?.[index]?.price && <small className="p-error">{errors.checkDetails[index].price}</small>}
                            </div>

                            <div className="field col-12 md:col-2">
                                <label htmlFor={`amount-${index}`}>{lang === 'en' ? 'Amount' : 'المبلغ'}</label>
                                <InputNumber id={`amount-${index}`} value={detail.amount} readOnly />
                            </div>

                            <div className={`field col-12 md:col-1 flex align-items-end`}>
                                <Button type="button" icon="pi pi-trash" className="p-button-danger" onClick={() => removeCheckDetail(index)} />
                            </div>
                        </div>
                    ))}

                    <Button type="button" label={lang === 'en' ? 'Add Check Detail' : 'إضافة تفصيل فحص'} icon="pi pi-plus" className="p-button-outlined" onClick={addCheckDetail} />
                </div>

                <div className="card mt-5 p-5 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <div className="flex justify-between items-center p-4 flex flex-column justify-content-center align-items-center">
                        <h4 className="text-xl font-bold text-blue-800 dark:text-blue-100">{lang === 'en' ? 'Total' : 'الإجمالي'}</h4>
                        <span className="text-2xl font-bold text-blue-800 dark:text-blue-100">
                            {checkReport.total} {lang === 'en' ? 'EGP' : 'ج.م'}
                        </span>
                    </div>
                </div>

                <div className="flex justify-center mt-5">
                    <Button label={lang === 'en' ? 'Create Check Report' : 'إنشاء تقرير الفحص'} icon="pi pi-check" type="submit" loading={isSubmitting} disabled={isSubmitting} />
                </div>
            </form>
        </>
    );
}
