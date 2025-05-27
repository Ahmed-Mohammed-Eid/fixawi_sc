'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function EditInvoice({ params: { id } }) {
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
    const getSalesTaxRate = async () => {
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
            toast.error(error.response?.data?.message || 'Failed to get sales tax rate. Please try again.');
        }
    };

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
                toast.error('Failed to fetch invoice details');
            }
        };
        if (id) {
            fetchInvoice();
            getSalesTaxRate();
        }
    }, [id]);

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
        if (!invoice.clientName) newErrors.clientName = 'Client Name is a required field.';
        if (!invoice.date) newErrors.date = 'Date is a required field.';

        invoice.invoiceDetails.forEach((detail, index) => {
            if (!detail.service) {
                if (!newErrors.invoiceDetails) newErrors.invoiceDetails = [];
                newErrors.invoiceDetails[index] = { ...newErrors.invoiceDetails[index], service: 'Service is a required field.' };
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
            toast.error('Please fill in all required fields.');
            return;
        }

        // GET TOKEN FROM LOCAL STORAGE
        const token = localStorage.getItem('token');
        let toastId;

        try {
            toastId = toast.loading('Updating invoice...');
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
                toast.success('Invoice updated successfully', { id: toastId });

                // Use Next.js router for navigation
                const timer = setTimeout(() => {
                    router.push('/invoices');
                    clearTimeout(timer);
                }, 1000);
            } else {
                toast.error(response.data.message || 'Failed to update invoice', { id: toastId });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Failed to update invoice', { id: toastId });
        }
    };

    return (
        <div className="">
            <div className="card">
                <h2 className="text-3xl font-bold mb-6 text-primary">Invoice</h2>

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
                                    onChange={(e) => setInvoice((prev) => ({ ...prev, clientName: e.target.value }))}
                                    placeholder="Enter client's full name"
                                    className={`w-full ${errors.clientName ? 'p-invalid' : ''}`}
                                    disabled
                                />
                                {errors.clientName && <small className="p-error">{errors.clientName}</small>}
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="phoneNumber" className="font-semibold">
                                    Phone Number
                                </label>
                                <InputText id="phoneNumber" value={invoice.phoneNumber} onChange={(e) => setInvoice((prev) => ({ ...prev, phoneNumber: e.target.value }))} placeholder="Enter phone number" className="w-full" disabled />
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="carBrand" className="font-semibold">
                                    Car Brand
                                </label>
                                <InputText id="carBrand" value={invoice.carBrand} onChange={(e) => setInvoice((prev) => ({ ...prev, carBrand: e.target.value }))} placeholder="Enter car brand" className="w-full" disabled />
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="carModel" className="font-semibold">
                                    Car Model
                                </label>
                                <InputText id="carModel" value={invoice.carModel} onChange={(e) => setInvoice((prev) => ({ ...prev, carModel: e.target.value }))} placeholder="Enter car model" className="w-full" disabled />
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="date" className="font-semibold">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <Calendar id="date" value={invoice.date} onChange={(e) => setInvoice((prev) => ({ ...prev, date: e.value }))} placeholder="Select date" showIcon className={`w-full ${errors.date ? 'p-invalid' : ''}`} disabled />
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
                                        Service <span className="text-red-500">*</span>
                                    </label>{' '}
                                    <InputText
                                        id={`service-${index}`}
                                        value={detail.service}
                                        onChange={(e) => updateInvoiceDetails(index, 'service', e.target.value)}
                                        placeholder="Enter service description"
                                        className={`w-full ${errors.invoiceDetails?.[index]?.service ? 'p-invalid' : ''}`}
                                        disabled
                                    />
                                    {errors.invoiceDetails?.[index]?.service && <small className="p-error">{errors.invoiceDetails[index].service}</small>}
                                </div>
                            </div>
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label htmlFor={`quantity-${index}`} className="font-semibold">
                                        Quantity {/* Assuming quantity can be 0 or 1, not marking as required with asterisk unless specified */}
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
                                        Price {/* Assuming price can be 0, not marking as required with asterisk unless specified */}
                                    </label>
                                    <InputNumber id={`price-${index}`} value={detail.price} onValueChange={(e) => updateInvoiceDetails(index, 'price', e.value)} placeholder="0.00" mode="decimal" minFractionDigits={2} className="w-full" disabled />
                                    {/* Add error display for price if needed */}
                                </div>
                            </div>
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label className="font-semibold">Amount</label>
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
                <h3 className="text-xl mb-4">Invoice Summary</h3>
                <div className="surface-ground p-4 border-round">
                    <div className="flex flex-column gap-3 w-full md:w-6 ml-auto">
                        <div className="flex justify-content-between p-3 surface-100 border-round">
                            <span className="font-semibold">Subtotal:</span>
                            <span>{invoice.subTotal.toFixed(2)} EGP</span>
                        </div>
                        <div className="flex justify-content-between p-3 surface-100 border-round">
                            <span className="font-semibold">Sayyn Fare:</span>
                            <span>
                                {invoice.fixawiFare?.toFixed(2)}
                                {invoice.fixawiFareType === 'ratio' ? '(%)' : '(EGP)'}
                            </span>
                        </div>
                        <div className="flex justify-content-between p-3 surface-100 border-round</div>">
                            <span className="font-semibold">Sales Tax ({(invoice.salesTaxRate * 100).toFixed(0)}%):</span>
                            <span>{invoice.salesTaxAmount?.toFixed(2)} EGP</span>
                        </div>
                        <Divider />
                        <div className="flex justify-content-between p-3 bg-primary border-round">
                            <span className="font-bold text-xl text-white">Total:</span>
                            <span className="font-bold text-xl text-white">{invoice?.invoiceTotal?.toFixed(2)} EGP</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
