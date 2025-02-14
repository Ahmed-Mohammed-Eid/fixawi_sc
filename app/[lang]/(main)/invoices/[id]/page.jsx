'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import axios from 'axios';

export default function EditInvoice({ params: { id } }) {
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
                quantity: 0,
                price: 0,
                amount: 0
            }
        ],
        subTotal: 0,
        fixawiFare: 50, // Fixed fare
        salesTaxAmount: 0,
        invoiceTotal: 0
    });

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
                        salesTaxAmount: data.invoice.salesTaxAmount,
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
        }
    };

    useEffect(() => {
        // Calculate totals whenever invoice details change
        const subTotal = invoice.invoiceDetails.reduce((sum, item) => sum + (item.amount || 0), 0);
        const salesTaxAmount = subTotal * 0.14; // 14% tax
        const invoiceTotal = subTotal + invoice.fixawiFare + salesTaxAmount;

        setInvoice((prev) => ({
            ...prev,
            subTotal,
            salesTaxAmount,
            invoiceTotal
        }));
    }, [invoice.invoiceDetails, invoice.fixawiFare]);

    const handleSubmit = async () => {
        // GET TOKEN FROM LOCAL STORAGE
        const token = localStorage.getItem('token');

        try {
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
                toast.success('Invoice updated successfully');

                // Use Next.js router for navigation
                const timer = setTimeout(() => {
                    router.push('/invoices');
                    clearTimeout(timer);
                }, 1000);
            }
        } catch (error) {
            toast.error('Failed to update invoice');
            toast.dismiss(toastId);
        }
    };

    return (
        <div className="">
            <div className="card">
                <h2 className="text-3xl font-bold mb-6 text-primary">Edit Invoice</h2>

                <div className="mb-6">
                    <div className="flex align-items-center mb-4">
                        <i className="pi pi-user mr-2 text-xl"></i>
                        <h3 className="text-xl m-0">Client & Vehicle Information</h3>
                    </div>
                    <div className="grid">
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="clientName" className="font-semibold">
                                    Client Name
                                </label>
                                <InputText id="clientName" value={invoice.clientName} onChange={(e) => setInvoice((prev) => ({ ...prev, clientName: e.target.value }))} placeholder="Enter client's full name" className="w-full" />
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="phoneNumber" className="font-semibold">
                                    Phone Number
                                </label>
                                <InputText id="phoneNumber" value={invoice.phoneNumber} onChange={(e) => setInvoice((prev) => ({ ...prev, phoneNumber: e.target.value }))} placeholder="Enter phone number" className="w-full" />
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="carBrand" className="font-semibold">
                                    Car Brand
                                </label>
                                <InputText id="carBrand" value={invoice.carBrand} onChange={(e) => setInvoice((prev) => ({ ...prev, carBrand: e.target.value }))} placeholder="Enter car brand" className="w-full" />
                            </div>
                        </div>
                        <div className="col-12 md:col-6 mb-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="carModel" className="font-semibold">
                                    Car Model
                                </label>
                                <InputText id="carModel" value={invoice.carModel} onChange={(e) => setInvoice((prev) => ({ ...prev, carModel: e.target.value }))} placeholder="Enter car model" className="w-full" />
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="date" className="font-semibold">
                                    Date
                                </label>
                                <Calendar id="date" value={invoice.date} onChange={(e) => setInvoice((prev) => ({ ...prev, date: e.value }))} placeholder="Select date" showIcon className="w-full" />
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
                <div className="flex flex-column gap-3">
                    {invoice.invoiceDetails.map((detail, index) => (
                        <div key={index} className="grid align-items-center">
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label htmlFor={`service-${index}`} className="font-semibold">
                                        Service
                                    </label>
                                    <InputText id={`service-${index}`} value={detail.service} onChange={(e) => updateInvoiceDetails(index, 'service', e.target.value)} placeholder="Enter service description" className="w-full" />
                                </div>
                            </div>
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label htmlFor={`quantity-${index}`} className="font-semibold">
                                        Quantity
                                    </label>
                                    <InputNumber id={`quantity-${index}`} value={detail.quantity} onValueChange={(e) => updateInvoiceDetails(index, 'quantity', e.value)} placeholder="0" mode="decimal" minFractionDigits={0} className="w-full" />
                                </div>
                            </div>
                            <div className="col-12 md:col-3 mb-2 md:mb-0">
                                <div className="flex flex-column gap-2">
                                    <label htmlFor={`price-${index}`} className="font-semibold">
                                        Price
                                    </label>
                                    <InputNumber id={`price-${index}`} value={detail.price} onValueChange={(e) => updateInvoiceDetails(index, 'price', e.value)} placeholder="0.00" mode="decimal" minFractionDigits={2} className="w-full" />
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
                            <span>{invoice.subTotal.toFixed(2)} EGP</span>
                        </div>
                        <div className="flex justify-content-between p-3 surface-100 border-round">
                            <span className="font-semibold">Fixawi Fare:</span>
                            <span>{invoice.fixawiFare.toFixed(2)} EGP</span>
                        </div>
                        <div className="flex justify-content-between p-3 surface-100 border-round">
                            <span className="font-semibold">Sales Tax (14%):</span>
                            <span>{invoice.salesTaxAmount.toFixed(2)} EGP</span>
                        </div>
                        <Divider />
                        <div className="flex justify-content-between p-3 bg-primary border-round">
                            <span className="font-bold text-xl text-white">Total:</span>
                            <span className="font-bold text-xl text-white">{invoice.invoiceTotal.toFixed(2)} EGP</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 justify-content-end mt-6">
                    <Button label="Cancel" icon="pi pi-times" size="large" severity="secondary" className="py-3 px-5 text-xl" />
                    <Button label="Update Invoice" icon="pi pi-save" size="large" severity="success" onClick={handleSubmit} className="py-3 px-5 text-xl" raised style={{ flex: 1 }} />
                </div>
            </div>
        </div>
    );
}
