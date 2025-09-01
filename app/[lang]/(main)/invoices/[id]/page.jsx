'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function EditInvoice({ params: { lang, id } }) {
    const isRTL = lang === 'ar';
    const router = useRouter();
    const [invoice, setInvoice] = useState({
        invoiceId: '',
        userId: '',
        clientName: '',
        phoneNumber: '',
        carBrand: '',
        carModel: '',
        date: null,
        invoiceDetails: [
            {
                service: '',
                quantity: 1, // Default quantity to 1
                price: 0,
                amount: 0
            }
        ],
        subTotal: 0,
        fixawiFare: 50, // Fixed fare
        salesTaxRate: 0.0,
        salesTaxAmount: 0,
        invoiceTotal: 0
    });
    const [errors, setErrors] = useState({});

    // GET SALES TAX RATE FROM API
    const getSalesTaxRate = useCallback(async () => {
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
                    salesTaxRate: response.data.salesTaxRate
                }));
            }
        } catch (error) {
            console.error('Error getting sales tax rate:', error);
            toast.error(error.response?.data?.message || 
                (lang === 'en' 
                    ? 'Failed to get sales tax rate. Please try again.' 
                    : 'فشل الحصول على معدل ضريبة المبيعات. يرجى المحاولة مرة أخرى.')
            );
        }
    }, [lang]);

    useEffect(() => {
        const fetchInvoice = async () => {
            // GET TOKEN FROM LOCAL STORAGE
            const token = localStorage.getItem('token');

            try {
                const response = await axios.get(`${process.env.API_URL}/invoice/details`, {
                    params: { invoiceId: id },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const data = response.data;

                if (data.success && data.invoice) {
                    // Transform API response to match our state structure
                    const invoiceData = {
                        invoiceId: data.invoice._id,
                        userId: data.invoice.userId,
                        clientName: data.invoice.clientName,
                        phoneNumber: data.invoice.phoneNumber,
                        carBrand: data.invoice.carBrand,
                        carModel: data.invoice.carModel,
                        date: new Date(data.invoice.date),
                        invoiceDetails: data.invoice.invoiceDetails.map(({ service, quantity, price, amount }) => ({
                            service,
                            quantity,
                            price,
                            amount
                        })),
                        subTotal: data.invoice.subTotal,
                        fixawiFare: data.invoice.fixawiFare,
                        salesTaxAmount: data.invoice.salesTaxAmount || 0,
                        invoiceTotal: data.invoice.invoiceTotal
                    };

                    setInvoice(invoiceData);
                }
            } catch (error) {
                toast.error(lang === 'en' 
                    ? 'Failed to fetch invoice details' 
                    : 'فشل جلب تفاصيل الفاتورة'
                );
            }
        };
        if (id) {
            fetchInvoice();
            getSalesTaxRate();
        }
    }, [id, lang, getSalesTaxRate]);

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
    };

    const addNewRow = () => {
        setInvoice((prev) => ({
            ...prev,
            invoiceDetails: [...prev.invoiceDetails, { service: '', quantity: 1, price: 0, amount: 0 }]
        }));
    };

    const removeRow = (index) => {
        if (invoice.invoiceDetails.length > 1) {
            const updatedDetails = invoice.invoiceDetails.filter((_, i) => i !== index);
            setInvoice((prev) => ({
                ...prev,
                invoiceDetails: updatedDetails
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!invoice.clientName) newErrors.clientName = lang === 'en' 
            ? 'Client Name is a required field.' 
            : 'اسم العميل حقل مطلوب.';
        if (!invoice.date) newErrors.date = lang === 'en' 
            ? 'Date is a required field.' 
            : 'التاريخ حقل مطلوب.';

        invoice.invoiceDetails.forEach((detail, index) => {
            if (!detail.service) {
                if (!newErrors.invoiceDetails) newErrors.invoiceDetails = [];
                newErrors.invoiceDetails[index] = { 
                    ...newErrors.invoiceDetails[index], 
                    service: lang === 'en' 
                        ? 'Service is a required field.' 
                        : 'الخدمة حقل مطلوب.' 
                };
            }
            // Quantity and Price are numbers, 0 is a valid value if not strictly positive.
            // If quantity or price must be greater than 0, add validation here.
            // e.g. if (detail.quantity <= 0) newErrors.invoiceDetails[index] = { ...newErrors.invoiceDetails[index], quantity: 'Quantity must be greater than 0' };
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error(lang === 'en' 
                ? 'Please fill in all required fields.' 
                : 'يرجى ملء جميع الحقول المطلوبة.'
            );
            return;
        }

        // GET TOKEN FROM LOCAL STORAGE
        const token = localStorage.getItem('token');
        let toastId;

        try {
            toastId = toast.loading(lang === 'en' ? 'Updating invoice...' : 'جاري تحديث الفاتورة...');
            const invoiceData = {
                invoiceId: invoice.invoiceId,
                userId: invoice.userId,
                clientName: invoice.clientName,
                phoneNumber: invoice.phoneNumber,
                carBrand: invoice.carBrand,
                carModel: invoice.carModel,
                date: invoice.date ? invoice.date.toISOString().split('T')[0] : null,
                invoiceDetails: invoice.invoiceDetails.map(({ service, quantity, price, amount }) => ({
                    service,
                    quantity,
                    price,
                    amount
                })),
                subTotal: invoice.subTotal,
                fixawiFare: invoice.fixawiFare,
                salesTaxAmount: invoice.salesTaxAmount,
                invoiceTotal: invoice.invoiceTotal
            };

            const response = await axios.put(`${process.env.API_URL}/edit/invoice`, invoiceData, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                toast.success(lang === 'en' 
                    ? 'Invoice updated successfully' 
                    : 'تم تحديث الفاتورة بنجاح', 
                    { id: toastId }
                );

                // Use Next.js router for navigation
                const timer = setTimeout(() => {
                    router.push('/invoices');
                    clearTimeout(timer);
                }, 1000);
            } else {
                toast.error(response.data.message || 
                    (lang === 'en' 
                        ? 'Failed to update invoice' 
                        : 'فشل تحديث الفاتورة'
                    ), 
                    { id: toastId }
                );
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 
                (lang === 'en' 
                    ? 'Failed to update invoice' 
                    : 'فشل تحديث الفاتورة'
                ), 
                { id: toastId }
            );
        }
    };

    return (
        <div className="" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="card">
                <h2 className="text-3xl font-bold mb-6 text-primary">
                    {lang === 'en' ? 'Invoice' : 'فاتورة'}
                </h2>

                <div className="mb-6">
                    <div className="flex align-items-center mb-4 gap-2">
                        <i className="pi pi-user mr-2 text-xl"></i>
                        <h3 className="text-xl m-0">
                            {lang === 'en' ? 'Client & Vehicle Information' : 'معلومات العميل والمركبة'}
                        </h3>
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
                                    onChange={(e) => setInvoice((prev) => ({ ...prev, clientName: e.target.value }))}
                                    placeholder={lang === 'en' ? "Enter client's full name" : "أدخل اسم العميل بالكامل"}
                                    className={`w-full ${errors.clientName ? 'p-invalid' : ''}`}
                                    disabled
                                />
                                {errors.clientName && <small className="p-error">{errors.clientName}</small>}
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="phoneNumber" className="font-semibold">
                                    {lang === 'en' ? 'Phone Number' : 'رقم الهاتف'}
                                </label>
                                <InputText 
                                    id="phoneNumber" 
                                    value={invoice.phoneNumber} 
                                    onChange={(e) => setInvoice((prev) => ({ ...prev, phoneNumber: e.target.value }))} 
                                    placeholder={lang === 'en' ? "Enter phone number" : "أدخل رقم الهاتف"} 
                                    className="w-full" 
                                    disabled 
                                />
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="carBrand" className="font-semibold">
                                    {lang === 'en' ? 'Car Brand' : 'ماركة السيارة'}
                                </label>
                                <InputText 
                                    id="carBrand" 
                                    value={invoice.carBrand} 
                                    onChange={(e) => setInvoice((prev) => ({ ...prev, carBrand: e.target.value }))} 
                                    placeholder={lang === 'en' ? "Enter car brand" : "أدخل ماركة السيارة"} 
                                    className="w-full" 
                                    disabled 
                                />
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="carModel" className="font-semibold">
                                    {lang === 'en' ? 'Car Model' : 'موديل السيارة'}
                                </label>
                                <InputText 
                                    id="carModel" 
                                    value={invoice.carModel} 
                                    onChange={(e) => setInvoice((prev) => ({ ...prev, carModel: e.target.value }))} 
                                    placeholder={lang === 'en' ? "Enter car model" : "أدخل موديل السيارة"} 
                                    className="w-full" 
                                    disabled 
                                />
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
                                    onChange={(e) => setInvoice((prev) => ({ ...prev, date: e.value }))} 
                                    placeholder={lang === 'en' ? "Select date" : "اختر التاريخ"} 
                                    showIcon 
                                    className={`w-full ${errors.date ? 'p-invalid' : ''}`} 
                                    disabled 
                                />
                                {errors.date && <small className="p-error">{errors.date}</small>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 card">
                <div className="flex flex-column gap-3">
                    {invoice.invoiceDetails.map((detail, index) => (
                        <div key={index} className="grid align-items-center">
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label htmlFor={`service-${index}`} className="font-semibold">
                                        {lang === 'en' ? 'Service' : 'الخدمة'} <span className="text-red-500">*</span>
                                    </label>{' '}
                                    <InputText
                                        id={`service-${index}`}
                                        value={detail.service}
                                        onChange={(e) => updateInvoiceDetails(index, 'service', e.target.value)}
                                        placeholder={lang === 'en' ? "Enter service description" : "أدخل وصف الخدمة"}
                                        className={`w-full ${errors.invoiceDetails?.[index]?.service ? 'p-invalid' : ''}`}
                                        disabled
                                    />
                                    {errors.invoiceDetails?.[index]?.service && <small className="p-error">{errors.invoiceDetails[index].service}</small>}
                                </div>
                            </div>
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label htmlFor={`quantity-${index}`} className="font-semibold">
                                        {lang === 'en' ? 'Quantity' : 'الكمية'}
                                    </label>
                                    <InputNumber
                                        id={`quantity-${index}`}
                                        value={detail.quantity}
                                        onValueChange={(e) => updateInvoiceDetails(index, 'quantity', e.value)}
                                        placeholder="1"
                                        mode="decimal"
                                        minFractionDigits={0}
                                        className="w-full"
                                        disabled
                                    />
                                    {/* Add error display for quantity if needed */}
                                </div>
                            </div>
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label htmlFor={`price-${index}`} className="font-semibold">
                                        {lang === 'en' ? 'Price' : 'السعر'}
                                    </label>
                                    <InputNumber id={`price-${index}`} value={detail.price} onValueChange={(e) => updateInvoiceDetails(index, 'price', e.value)} placeholder="0.00" mode="decimal" minFractionDigits={2} className="w-full" disabled />
                                    {/* Add error display for price if needed */}
                                </div>
                            </div>
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label className="font-semibold">{lang === 'en' ? 'Amount' : 'المبلغ'}</label>
                                    <div className="p-inputgroup">
                                        <span className="p-inputgroup-addon">EGP</span>
                                        <InputNumber value={detail.amount} disabled readOnly className="w-full" minFractionDigits={2} />
                                    </div>
                                </div>
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
                            <span className="font-bold text-xl text-white">{invoice.subTotal.toFixed(2)} EGP</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
