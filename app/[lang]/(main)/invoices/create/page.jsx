'use client';
import { useState, useEffect, useCallback } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import PromotionDetails from '../../../../components/Shared/PromotionDetails/PromotionDetails';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function CreateInvoice({ params: { lang } }) {
    const isRTL = lang === 'ar';
    const router = useRouter();

    const searchParams = useSearchParams();
    const downPayment = parseInt(searchParams.get('downPayment') || 0);
    const [errors, setErrors] = useState({});

    const [invoice, setInvoice] = useState({
        clientName: '',
        phoneNumber: '',
        carBrand: '',
        carModel: '',
        date: null,
        invoiceDetails: [
            {
                service: '',
                quantity: 0,
                price: 0,
                amount: 0
            }
        ],
        subTotal: 0,
        fixawiFare: 0,
        fixawiFareType: '',
        salesTaxRate: 0.0,
        salesTaxAmount: 0,
        invoiceTotal: 0
    });

    const updateInvoiceDetails = (index, field, value) => {
        const updatedDetails = [...invoice.invoiceDetails];
        updatedDetails[index][field] = value;

        // Auto calculate amount
        if (field === 'quantity' || field === 'price') {
            updatedDetails[index].amount = updatedDetails[index].quantity * updatedDetails[index].price;
        }

        setInvoice((prev) => ({
            ...prev,
            invoiceDetails: updatedDetails
        }));

        // Clear specific error
        const errorKey = `invoiceDetails.${index}.${field}`;
        if (errors[errorKey]) {
            setErrors((prevErrors) => {
                const newErrors = { ...prevErrors };
                delete newErrors[errorKey];
                return newErrors;
            });
        }
    };

    const addNewRow = () => {
        setInvoice((prev) => ({
            ...prev,
            invoiceDetails: [...prev.invoiceDetails, { service: '', quantity: 0, price: 0, amount: 0 }]
        }));
    };

    const removeRow = (index) => {
        if (invoice.invoiceDetails.length > 1) {
            const updatedDetails = invoice.invoiceDetails.filter((_, i) => i !== index);
            setInvoice((prev) => ({
                ...prev,
                invoiceDetails: updatedDetails
            }));

            // Clear errors related to invoiceDetails as indices have shifted or items removed
            setErrors((prevErrors) => {
                const newErrors = { ...prevErrors };
                Object.keys(newErrors).forEach((key) => {
                    if (key.startsWith('invoiceDetails.')) {
                        delete newErrors[key];
                    }
                });
                return newErrors;
            });
        }
    };

    // GET CHECK REPORT ID
    const getCheckReportId = useCallback(
        async (reportId) => {
            // GET TOKEN
            const token = localStorage.getItem('token');

            try {
                const response = await axios.get(`${process.env.API_URL}/sc/check/report/details?checkReportId=${reportId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (response.status === 200) {
                    const { checkReport, fixawiFareType, fareValue, salesTaxRate } = response.data;

                    // Map check details to invoice details format
                    let mappedDetails = checkReport.checkDetails.map((detail) => {
                        if (detail.clientApproved) {
                            return {
                                service: detail.service,
                                quantity: detail.quantity,
                                price: detail.price,
                                amount: detail.amount
                            };
                        } else {
                            return;
                        }
                    });

                    mappedDetails = mappedDetails.filter((detail) => detail !== undefined);

                    // Set invoice state with check report data
                    setInvoice((prev) => ({
                        ...prev,
                        clientName: checkReport.clientName,
                        phoneNumber: checkReport.phoneNumber,
                        carBrand: checkReport.carBrand,
                        carModel: checkReport.carModel,
                        date: new Date(checkReport.date),
                        invoiceDetails: mappedDetails,
                        fixawiFare: fareValue,
                        fixawiFareType: fixawiFareType,
                        salesTaxRate: salesTaxRate,
                        subTotal: checkReport.total
                    }));
                }
            } catch (error) {
                console.error('Error getting check report:', error);
                toast.error(error.response?.data?.message || (lang === 'en' ? 'Failed to get check report. Please try again.' : 'فشل الحصول على تقرير الفحص. يرجى المحاولة مرة أخرى.'));
            }
        },
        [lang]
    );

    // FIXAWI FARE AMOUNT GET REQUEST
    const getFixawiFare = useCallback(async () => {
        // GET TOKEN
        const token = localStorage.getItem('token');

        try {
            const response = await axios.get(`${process.env.API_URL}/service/center/fees`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.status === 200) {
                setInvoice((prev) => ({
                    ...prev,
                    fixawiFare: response.data.fareValue,
                    fixawiFareType: response.data.fixawiFareType,
                    salesTaxRate: response.data.salesTaxRate
                }));
            }
        } catch (error) {
            console.error('Error getting fixawi fare:', error);
            toast.error(error.response?.data?.message || (lang === 'en' ? 'Failed to get fixawi fare. Please try again.' : 'فشل الحصول على رسوم فيكساوي. يرجى المحاولة مرة أخرى.'));
        }
    }, [lang]);

    useEffect(() => {
        // Calculate totals whenever invoice details change
        const subTotal = invoice.invoiceDetails.reduce((sum, item) => sum + (item.amount || 0), 0);
        const salesTaxAmount = subTotal * invoice.salesTaxRate;

        const isRatioFare = invoice.fixawiFareType === 'ratio';

        // const invoiceTotal = subTotal + invoice.fixawiFare + salesTaxAmount;
        let invoiceTotal;
        if (isRatioFare) {
            invoiceTotal = subTotal + subTotal * (invoice.fixawiFare / 100) + salesTaxAmount;
        } else {
            invoiceTotal = subTotal + invoice.fixawiFare + salesTaxAmount;
        }

        setInvoice((prev) => ({
            ...prev,
            subTotal,
            salesTaxAmount,
            invoiceTotal
        }));
    }, [invoice.invoiceDetails, invoice.fixawiFare, invoice.fixawiFareType, invoice.salesTaxRate]);

    useEffect(() => {
        getFixawiFare();
        const checkReportId = searchParams.get('check-report-id');
        if (checkReportId) {
            getCheckReportId(checkReportId);
        }
    }, [getCheckReportId, getFixawiFare, searchParams]);

    const handleSubmit = async () => {
        setErrors({}); // Clear previous errors at the beginning of a new submission attempt

        const validateForm = () => {
            const newErrors = {};
            const { clientName, phoneNumber, carBrand, carModel, date, invoiceDetails } = invoice;

            if (!clientName.trim()) newErrors.clientName = lang === 'en' ? 'Client Name is required' : 'اسم العميل مطلوب';
            if (!phoneNumber.trim()) newErrors.phoneNumber = lang === 'en' ? 'Phone Number is required' : 'رقم الهاتف مطلوب';
            if (!carBrand.trim()) newErrors.carBrand = lang === 'en' ? 'Car Brand is required' : 'ماركة السيارة مطلوبة';
            if (!carModel.trim()) newErrors.carModel = lang === 'en' ? 'Car Model is required' : 'موديل السيارة مطلوب';
            if (!date) newErrors.date = lang === 'en' ? 'Date is required' : 'التاريخ مطلوب';

            invoiceDetails.forEach((detail, index) => {
                if (!detail.service.trim()) newErrors[`invoiceDetails.${index}.service`] = lang === 'en' ? 'Service is required' : 'الخدمة مطلوبة';
                if (detail.quantity === null || detail.quantity === undefined || detail.quantity <= 0) {
                    newErrors[`invoiceDetails.${index}.quantity`] = lang === 'en' ? 'Quantity must be greater than 0' : 'يجب أن تكون الكمية أكبر من الصفر';
                }
                if (detail.price === null || detail.price === undefined || detail.price <= 0) {
                    newErrors[`invoiceDetails.${index}.price`] = lang === 'en' ? 'Price must be greater than 0' : 'يجب أن يكون السعر أكبر من الصفر';
                }
            });
            return newErrors;
        };

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error(lang === 'en' ? 'Please correct the errors in the form.' : 'يرجى تصحيح الأخطاء في النموذج.');
            return;
        }

        // GET TOKEN
        const token = localStorage.getItem('token');
        const checkReportId = searchParams.get('check-report-id');
        const userId = searchParams.get('userId');
        if (!checkReportId) {
            toast.error(lang === 'en' ? 'Please select a check report to create an invoice.' : 'يرجى اختيار تقرير فحص لإنشاء الفاتورة.');
            return;
        }

        if (!userId) {
            toast.error(lang === 'en' ? 'User ID not found.' : 'معرف المستخدم غير موجود.');
            return;
        }

        try {
            // Format the date as MM-DD-YYYY
            const formattedDate = invoice.date
                ? invoice.date
                      .toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric'
                      })
                      .replace(/\//g, '-')
                : null;

            const invoiceData = {
                userId: userId,
                clientName: invoice.clientName,
                phoneNumber: invoice.phoneNumber,
                carBrand: invoice.carBrand,
                carModel: invoice.carModel,
                date: formattedDate,
                invoiceDetails: invoice.invoiceDetails,
                subTotal: invoice.subTotal,
                fixawiFare: invoice.fixawiFare,
                salesTaxAmount: invoice.salesTaxAmount,
                invoiceTotal: invoice.invoiceTotal,
                checkId: checkReportId
            };

            const response = await axios.post(`${process.env.API_URL}/create/invoice`, invoiceData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 || response.status === 201) {
                toast.success(lang === 'en' ? 'Invoice created successfully' : 'تم إنشاء الفاتورة بنجاح');
                // Use Next.js router for navigation
                const timer = setTimeout(() => {
                    router.push(`/${lang}/invoices`);
                    clearTimeout(timer);
                }, 1000);
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            toast.error(error.response?.data?.message || (lang === 'en' ? 'Failed to create invoice. Please try again.' : 'فشل إنشاء الفاتورة. يرجى المحاولة مرة أخرى.'));
        }
    };

    return (
        <div className="" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="card">
                <h2 className="text-3xl font-bold mb-6 text-primary">{lang === 'en' ? 'Create New Invoice' : 'إنشاء فاتورة جديدة'}</h2>

                <div className="mb-6">
                    <div className="flex align-items-center mb-4 gap-2">
                        <i className="pi pi-user mr-2 text-xl"></i>
                        <h3 className="text-xl m-0">{lang === 'en' ? 'Client & Vehicle Information' : 'معلومات العميل والمركبة'}</h3>
                    </div>
                    <div className="grid">
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="clientName" className="font-semibold">
                                    {lang === 'en' ? 'Client Name' : 'اسم العميل'} <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="clientName"
                                    value={invoice.clientName}
                                    onChange={(e) => {
                                        setInvoice((prev) => ({ ...prev, clientName: e.target.value }));
                                        if (errors.clientName) setErrors((prev) => ({ ...prev, clientName: null }));
                                    }}
                                    placeholder={lang === 'en' ? "Enter client's full name" : 'أدخل اسم العميل بالكامل'}
                                    className="w-full"
                                    invalid={!!errors.clientName}
                                />
                                {errors.clientName && <small className="p-error block mt-1">{errors.clientName}</small>}
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="phoneNumber" className="font-semibold">
                                    {lang === 'en' ? 'Phone Number' : 'رقم الهاتف'} <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="phoneNumber"
                                    value={invoice.phoneNumber}
                                    onChange={(e) => {
                                        setInvoice((prev) => ({ ...prev, phoneNumber: e.target.value }));
                                        if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: null }));
                                    }}
                                    placeholder={lang === 'en' ? 'Enter phone number' : 'أدخل رقم الهاتف'}
                                    className="w-full"
                                    invalid={!!errors.phoneNumber}
                                />
                                {errors.phoneNumber && <small className="p-error block mt-1">{errors.phoneNumber}</small>}
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="carBrand" className="font-semibold">
                                    {lang === 'en' ? 'Car Brand' : 'ماركة السيارة'} <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="carBrand"
                                    value={invoice.carBrand}
                                    onChange={(e) => {
                                        setInvoice((prev) => ({ ...prev, carBrand: e.target.value }));
                                        if (errors.carBrand) setErrors((prev) => ({ ...prev, carBrand: null }));
                                    }}
                                    placeholder={lang === 'en' ? 'Enter car brand' : 'أدخل ماركة السيارة'}
                                    className="w-full"
                                    invalid={!!errors.carBrand}
                                />
                                {errors.carBrand && <small className="p-error block mt-1">{errors.carBrand}</small>}
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="carModel" className="font-semibold">
                                    {lang === 'en' ? 'Car Model' : 'موديل السيارة'} <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="carModel"
                                    value={invoice.carModel}
                                    onChange={(e) => {
                                        setInvoice((prev) => ({ ...prev, carModel: e.target.value }));
                                        if (errors.carModel) setErrors((prev) => ({ ...prev, carModel: null }));
                                    }}
                                    placeholder={lang === 'en' ? 'Enter car model' : 'أدخل موديل السيارة'}
                                    className="w-full"
                                    invalid={!!errors.carModel}
                                />
                                {errors.carModel && <small className="p-error block mt-1">{errors.carModel}</small>}
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="date" className="font-semibold">
                                    {lang === 'en' ? 'Date' : 'التاريخ'} <span className="text-red-500">*</span>
                                </label>
                                <Calendar
                                    id="date"
                                    value={invoice.date}
                                    onChange={(e) => {
                                        setInvoice((prev) => ({ ...prev, date: e.value }));
                                        if (errors.date) setErrors((prev) => ({ ...prev, date: null }));
                                    }}
                                    placeholder={lang === 'en' ? 'Select date' : 'اختر التاريخ'}
                                    showIcon
                                    className="w-full"
                                    invalid={!!errors.date}
                                />
                                {errors.date && <small className="p-error block mt-1">{errors.date}</small>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {searchParams.get('promotionId') && <PromotionDetails lang={lang} promotionId={searchParams.get('promotionId')} />}

            <div className="mb-6 card mt-2">
                <div className="flex justify-content-between align-items-center mb-4">
                    <h3 className="text-xl m-0">{lang === 'en' ? 'Invoice Details' : 'تفاصيل الفاتورة'}</h3>
                    <Button label={lang === 'en' ? 'Add Row' : 'إضافة صف'} icon="pi pi-plus" onClick={addNewRow} />
                </div>
                <div className="flex flex-column">
                    {invoice.invoiceDetails.map((detail, index) => (
                        <div key={index} className="grid formgrid align-items-center">
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label htmlFor={`service-${index}`} className="font-semibold">
                                        {lang === 'en' ? 'Service' : 'الخدمة'} <span className="text-red-500">*</span>
                                    </label>
                                    <InputText
                                        id={`service-${index}`}
                                        value={detail.service}
                                        onChange={(e) => updateInvoiceDetails(index, 'service', e.target.value)}
                                        placeholder={lang === 'en' ? 'Enter service description' : 'أدخل وصف الخدمة'}
                                        className="w-full"
                                        invalid={!!errors[`invoiceDetails.${index}.service`]}
                                    />
                                    {errors[`invoiceDetails.${index}.service`] && <small className="p-error block mt-1">{errors[`invoiceDetails.${index}.service`]}</small>}
                                </div>
                            </div>
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label htmlFor={`quantity-${index}`} className="font-semibold">
                                        {lang === 'en' ? 'Quantity' : 'الكمية'} <span className="text-red-500">*</span>
                                    </label>
                                    <InputNumber
                                        id={`quantity-${index}`}
                                        value={detail.quantity}
                                        onValueChange={(e) => updateInvoiceDetails(index, 'quantity', e.value)}
                                        placeholder="0"
                                        mode="decimal"
                                        minFractionDigits={0}
                                        className="w-full"
                                        invalid={!!errors[`invoiceDetails.${index}.quantity`]}
                                    />
                                    {errors[`invoiceDetails.${index}.quantity`] && <small className="p-error block mt-1">{errors[`invoiceDetails.${index}.quantity`]}</small>}
                                </div>
                            </div>
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label htmlFor={`price-${index}`} className="font-semi-bold">
                                        {lang === 'en' ? 'Price' : 'السعر'} <span className="text-red-500">*</span>
                                    </label>
                                    <InputNumber
                                        id={`price-${index}`}
                                        value={detail.price}
                                        onValueChange={(e) => updateInvoiceDetails(index, 'price', e.value)}
                                        placeholder="0.00"
                                        mode="decimal"
                                        minFractionDigits={2}
                                        className="w-full"
                                        invalid={!!errors[`invoiceDetails.${index}.price`]}
                                    />
                                    {errors[`invoiceDetails.${index}.price`] && <small className="p-error block mt-1">{errors[`invoiceDetails.${index}.price`]}</small>}
                                </div>
                            </div>
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label className="font-semibold">{lang === 'en' ? 'Amount' : 'المبلغ'}</label>
                                    <div className="p-inputgroup">
                                        <span className="p-inputgroup-addon">EGP</span>
                                        <InputNumber value={detail.amount} readOnly className="w-full" minFractionDigits={2} />
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 mt-2 mb-4 flex justify-content-center">
                                <Button icon="pi pi-trash" className="w-full" outlined severity="danger" onClick={() => removeRow(index)} disabled={invoice.invoiceDetails.length === 1} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mb-4 card">
                <h3 className="text-xl mb-4">{lang === 'en' ? 'Invoice Summary' : 'ملخص الفاتورة'}</h3>
                <div className="surface-ground p-4 border-round">
                    <div className="flex flex-column gap-3 w-full md:w-6 ml-auto">
                        <div className="flex justify-content-between p-3 bg-primary border-round">
                            <span className="font-bold text-xl text-white">{lang === 'en' ? 'Total:' : 'الإجمالي:'}</span>
                            <span className="font-bold text-xl text-white">{invoice.subTotal?.toFixed(2) - downPayment} EGP</span>
                        </div>
                        <div className="flex justify-content-between p-3 bg-primary border-round">
                            <span className="font-bold text-xl text-white">{lang === 'en' ? 'Total Before Down Payment:' : 'الإجمالي قبل الدفعة المقدمة:'}</span>
                            <span className="font-bold text-xl text-white">{invoice.subTotal?.toFixed(2)} EGP</span>
                        </div>
                        <div className="flex justify-content-between p-3 bg-primary border-round">
                            <span className="font-bold text-xl text-white">{lang === 'en' ? 'Down Payment:' : 'الدفعة المقدمة:'}</span>
                            <span className="font-bold text-xl text-white">{downPayment.toFixed(2)} EGP</span>
                        </div>
                    </div>
                </div>
                <div className="flex justify-content-end mt-6 ">
                    <Button label={lang === 'en' ? 'Create Invoice' : 'إنشاء الفاتورة'} icon="pi pi-check" size="large" severity="success" onClick={handleSubmit} className="w-full py-3 px-5 text-xl" raised />
                </div>
            </div>
        </div>
    );
}
