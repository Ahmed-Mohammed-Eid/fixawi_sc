'use client';
import { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function CreateInvoice() {
    const router = useRouter();

    const searchParams = useSearchParams();
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
        salesTaxRate: 0.00,
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
            setErrors(prevErrors => {
                const newErrors = {...prevErrors};
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
            setErrors(prevErrors => {
                const newErrors = {...prevErrors};
                Object.keys(newErrors).forEach(key => {
                    if (key.startsWith('invoiceDetails.')) {
                        delete newErrors[key];
                    }
                });
                return newErrors;
            });
        }
    };

    // GET CHECK REPORT ID
    const getCheckReportId = async (reportId) => {
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
                    if(detail.clientApproved) {
                        return {
                            service: detail.service,
                            quantity: detail.quantity,
                            price: detail.price,
                            amount: detail.amount
                        };
                    }else{
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
            toast.error(error.response?.data?.message || 'Failed to get check report. Please try again.');
        }
    };

    // FIXAWI FARE AMOUNT GET REQUEST
    const getFixawiFare = async () => {
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
            toast.error(error.response?.data?.message || 'Failed to get fixawi fare. Please try again.');
        }
    };

    useEffect(() => {
        // Calculate totals whenever invoice details change
        const subTotal = invoice.invoiceDetails.reduce((sum, item) => sum + (item.amount || 0), 0);
        const salesTaxAmount = subTotal * invoice.salesTaxRate;
        const invoiceTotal = subTotal + invoice.fixawiFare + salesTaxAmount;

        setInvoice((prev) => ({
            ...prev,
            subTotal,
            salesTaxAmount,
            invoiceTotal
        }));
    }, [invoice.invoiceDetails, invoice.fixawiFare]);

    useEffect(() => {
        getFixawiFare();
        const checkReportId = searchParams.get('check-report-id');
        if (checkReportId) {
            getCheckReportId(checkReportId);
        }
    }, []);

    const handleSubmit = async () => {
        setErrors({}); // Clear previous errors at the beginning of a new submission attempt

        const validateForm = () => {
            const newErrors = {};
            const { clientName, phoneNumber, carBrand, carModel, date, invoiceDetails } = invoice;

            if (!clientName.trim()) newErrors.clientName = 'Client Name is required';
            if (!phoneNumber.trim()) newErrors.phoneNumber = 'Phone Number is required';
            if (!carBrand.trim()) newErrors.carBrand = 'Car Brand is required';
            if (!carModel.trim()) newErrors.carModel = 'Car Model is required';
            if (!date) newErrors.date = 'Date is required';

            invoiceDetails.forEach((detail, index) => {
                if (!detail.service.trim()) newErrors[`invoiceDetails.${index}.service`] = 'Service is required';
                if (detail.quantity === null || detail.quantity === undefined || detail.quantity <= 0) {
                    newErrors[`invoiceDetails.${index}.quantity`] = 'Quantity must be greater than 0';
                }
                if (detail.price === null || detail.price === undefined || detail.price <= 0) {
                    newErrors[`invoiceDetails.${index}.price`] = 'Price must be greater than 0';
                }
            });
            return newErrors;
        };

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error('Please correct the errors in the form.');
            return;
        }

        // GET TOKEN
        const token = localStorage.getItem('token');
        const checkReportId = searchParams.get('check-report-id');
        const userId = searchParams.get('userId');
        if (!checkReportId) {
            toast.error('Please select a check report to create an invoice.');
            return;
        }

        if(!userId) {
            toast.error('User ID not found.');
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
                toast.success('Invoice created successfully');
                // Use Next.js router for navigation
                const timer = setTimeout(() => {
                    router.push('/invoices');
                    clearTimeout(timer);
                }, 1000);
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            toast.error(error.response?.data?.message || 'Failed to create invoice. Please try again.');
        }
    };

    return (
        <div className="">
            <div className="card">
                <h2 className="text-3xl font-bold mb-6 text-primary">Create New Invoice</h2>

                <div className="mb-6">
                    <div className="flex align-items-center mb-4">
                        <i className="pi pi-user mr-2 text-xl"></i>
                        <h3 className="text-xl m-0">Client & Vehicle Information</h3>
                    </div>
                    <div className="grid">
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="clientName" className="font-semibold">
                                    Client Name <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="clientName"
                                    value={invoice.clientName}
                                    onChange={(e) => {
                                        setInvoice((prev) => ({ ...prev, clientName: e.target.value }));
                                        if (errors.clientName) setErrors(prev => ({ ...prev, clientName: null }));
                                    }}
                                    placeholder="Enter client's full name"
                                    className="w-full"
                                    invalid={!!errors.clientName}
                                />
                                {errors.clientName && <small className="p-error block mt-1">{errors.clientName}</small>}
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="phoneNumber" className="font-semibold">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="phoneNumber"
                                    value={invoice.phoneNumber}
                                    onChange={(e) => {
                                        setInvoice((prev) => ({ ...prev, phoneNumber: e.target.value }));
                                        if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: null }));
                                    }}
                                    placeholder="Enter phone number"
                                    className="w-full"
                                    invalid={!!errors.phoneNumber}
                                />
                                {errors.phoneNumber && <small className="p-error block mt-1">{errors.phoneNumber}</small>}
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="carBrand" className="font-semibold">
                                    Car Brand <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="carBrand"
                                    value={invoice.carBrand}
                                    onChange={(e) => {
                                        setInvoice((prev) => ({ ...prev, carBrand: e.target.value }));
                                        if (errors.carBrand) setErrors(prev => ({ ...prev, carBrand: null }));
                                    }}
                                    placeholder="Enter car brand"
                                    className="w-full"
                                    invalid={!!errors.carBrand}
                                />
                                {errors.carBrand && <small className="p-error block mt-1">{errors.carBrand}</small>}
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="carModel" className="font-semibold">
                                    Car Model <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="carModel"
                                    value={invoice.carModel}
                                    onChange={(e) => {
                                        setInvoice((prev) => ({ ...prev, carModel: e.target.value }));
                                        if (errors.carModel) setErrors(prev => ({ ...prev, carModel: null }));
                                    }}
                                    placeholder="Enter car model"
                                    className="w-full"
                                    invalid={!!errors.carModel}
                                />
                                {errors.carModel && <small className="p-error block mt-1">{errors.carModel}</small>}
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="date" className="font-semibold">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <Calendar
                                    id="date"
                                    value={invoice.date}
                                    onChange={(e) => {
                                        setInvoice((prev) => ({ ...prev, date: e.value }));
                                        if (errors.date) setErrors(prev => ({ ...prev, date: null }));
                                    }}
                                    placeholder="Select date"
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

            <div className="mb-6 card">
                <div className="flex justify-content-between align-items-center mb-4">
                    <h3 className="text-xl m-0">Invoice Details</h3>
                    <Button label="Add Row" icon="pi pi-plus" onClick={addNewRow} />
                </div>
                <div className="flex flex-column">
                    {invoice.invoiceDetails.map((detail, index) => (
                        <div key={index} className="grid formgrid align-items-center">
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label htmlFor={`service-${index}`} className="font-semibold">
                                        Service <span className="text-red-500">*</span>
                                    </label>
                                    <InputText
                                        id={`service-${index}`}
                                        value={detail.service}
                                        onChange={(e) => updateInvoiceDetails(index, 'service', e.target.value)}
                                        placeholder="Enter service description"
                                        className="w-full"
                                        invalid={!!errors[`invoiceDetails.${index}.service`]}
                                    />
                                    {errors[`invoiceDetails.${index}.service`] && <small className="p-error block mt-1">{errors[`invoiceDetails.${index}.service`]}</small>}
                                </div>
                            </div>
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label htmlFor={`quantity-${index}`} className="font-semibold">
                                        Quantity <span className="text-red-500">*</span>
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
                                    <label htmlFor={`price-${index}`} className="font-semibold">
                                        Price <span className="text-red-500">*</span>
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
                                    <label className="font-semibold">Amount</label>
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
                <h3 className="text-xl mb-4">Invoice Summary</h3>
                <div className="surface-ground p-4 border-round">
                    <div className="flex flex-column gap-3 w-full md:w-6 ml-auto">
                        <div className="flex justify-content-between p-3 surface-100 border-round">
                            <span className="font-semibold">Subtotal:</span>
                            <span>{invoice.subTotal?.toFixed(2)} EGP</span>
                        </div>
                        <div className="flex justify-content-between p-3 surface-100 border-round">
                            <span className="font-semibold">Sayyn Fare:</span>
                            <span>{invoice.fixawiFare?.toFixed(2)} EGP</span>
                        </div>
                        <div className="flex justify-content-between p-3 surface-100 border-round</div>">
                            <span className="font-semibold">Sales Tax ({(invoice.salesTaxRate * 100).toFixed(0)}%):</span>
                            <span>{invoice.salesTaxAmount?.toFixed(2)} EGP</span>
                        </div>
                        <Divider />
                        <div className="flex justify-content-between p-3 bg-primary border-round">
                            <span className="font-bold text-xl text-white">Total:</span>
                            <span className="font-bold text-xl text-white">{invoice.invoiceTotal.toFixed(2)} EGP</span>
                        </div>
                    </div>
                </div>
                <div className="flex justify-content-end mt-6 ">
                    <Button label="Create Invoice" icon="pi pi-check" size="large" severity="success" onClick={handleSubmit} className="w-full py-3 px-5 text-xl" raised />
                </div>
            </div>
        </div>
    );
}
