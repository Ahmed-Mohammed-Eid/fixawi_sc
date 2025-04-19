'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputText } from 'primereact/inputtext'; // Import InputText
import { Calendar } from 'primereact/calendar'; // Import Calendar
import { Button } from 'primereact/button'; // Import Button

// --- IMPORTANT ---
// Replace these placeholder functions with your actual implementation
// for getting the API base URL and authentication token.
const getBaseUrl = () => process.env.API_URL || 'http://localhost:3001'; // Example: Use environment variable or hardcode
const getAuthToken = () => {
    // Example: Retrieve token from localStorage (ensure this runs client-side)
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};
// --- END IMPORTANT ---

function FinancialsPage() {
    const [walletData, setWalletData] = useState(null);
    const [movements, setMovements] = useState([]);
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [loadingMovements, setLoadingMovements] = useState(false);
    const [walletId, setWalletId] = useState(null);
    const [globalFilter, setGlobalFilter] = useState(null); // State for global filter

    // --- NEW: State for date range ---
    const today = new Date();
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(today.getDate() - 10);
    const [dateFrom, setDateFrom] = useState(tenDaysAgo);
    const [dateTo, setDateTo] = useState(today);
    // --- END NEW ---

    // Fetch balance on mount
    useEffect(() => {
        fetchBalance();
    }, []);

    // Fetch movements when walletId is available
    useEffect(() => {
        if (walletId) {
            // Fetch initial movements once walletId is known using default dates
            fetchMovements(true); // Pass flag to indicate initial fetch
        }
        // Removed dateFrom, dateTo dependency - fetch triggered by button now
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walletId]); // Intentionally only depend on walletId for initial fetch

    const fetchBalance = async () => {
        setLoadingBalance(true);
        const token = getAuthToken();
        if (!token) {
            toast.error('Authentication token not found. Please log in again.');
            setLoadingBalance(false);
            return;
        }
        try {
            const response = await axios.get(`${getBaseUrl()}/show/balance`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setWalletData(response.data.wallet);
                setWalletId(response.data.wallet._id); // Set walletId here
            } else {
                toast.error(response.data.message || 'Failed to fetch balance.');
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
            toast.error(error.response?.data?.message || 'An error occurred while fetching balance.');
        } finally {
            setLoadingBalance(false);
        }
    };

    const fetchMovements = async (isInitialFetch = false) => {
        if (!walletId) {
            if (!isInitialFetch) {
                // Only show toast if it's not the automatic initial fetch
                toast.error('Wallet information not available yet.');
            }
            return;
        }
        setLoadingMovements(true);
        const token = getAuthToken();
        if (!token) {
            toast.error('Authentication token not found. Please log in again.');
            setLoadingMovements(false);
            return;
        }

        // --- MODIFIED: Format dates for API (MM-DD-YYYY) ---
        const formatDateForAPI = (date) => {
            if (!date) return null;
            const month = date.getMonth() + 1; // getMonth() is zero-based
            const day = date.getDate();
            const year = date.getFullYear();
            return `${month}-${day}-${year}`;
        };

        const formattedDateFrom = formatDateForAPI(dateFrom);
        const formattedDateTo = formatDateForAPI(dateTo);

        if (!formattedDateFrom || !formattedDateTo) {
            toast.error('Please select both start and end dates.');
            setLoadingMovements(false);
            return;
        }
        // --- END MODIFIED ---

        const params = {
            walletId: walletId,
            // --- MODIFIED: Add date parameters ---
            dateFrom: formattedDateFrom,
            dateTo: formattedDateTo
            // --- END MODIFIED ---
        };

        try {
            const response = await axios.get(`${getBaseUrl()}/balance/movement`, {
                headers: { Authorization: `Bearer ${token}` },
                params: params
            });
            if (response.data.success) {
                setMovements(response.data.movements);
            } else {
                toast.error(response.data.message || 'Failed to fetch movements.');
                setMovements([]); // Clear movements on failure
            }
        } catch (error) {
            console.error('Error fetching movements:', error);
            toast.error(error.response?.data?.message || 'An error occurred while fetching movements.');
            setMovements([]); // Clear movements on error
        } finally {
            setLoadingMovements(false);
        }
    };

    // --- NEW: Handler for the submit button ---
    const handleFetchMovementsClick = () => {
        fetchMovements(); // Call fetchMovements without the initial fetch flag
    };
    // --- END NEW ---

    // Formatting functions for DataTable
    const formatCurrency = (value) => {
        // Handle potential null/undefined values
        const numValue = Number(value);
        if (isNaN(numValue)) {
            return 'N/A'; // Or return 0.00 EGP or some placeholder
        }
        return numValue.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' }); // Use 'en-SA' for Saudi Arabia locale
    };

    const formatDate = (value) => {
        if (!value) return 'N/A';
        try {
            return new Date(value).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    const movementTypeBodyTemplate = (rowData) => {
        const isAddition = rowData.movementType === 'addition';
        const className = isAddition ? 'text-green-500' : 'text-red-500';
        const icon = isAddition ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
        return (
            <span className={`${className} font-medium`}>
                <i className={`${icon} mr-1`}></i>
                {rowData.movementType}
            </span>
        );
    };

    const paymentMethodBodyTemplate = (rowData) => {
        let icon = '';
        let color = '';
        const method = rowData.paymentMethod?.toLowerCase() || 'unknown';

        switch (method) {
            case 'cash':
                icon = 'pi pi-money-bill';
                color = 'text-green-600';
                break;
            case 'card':
                icon = 'pi pi-credit-card';
                color = 'text-blue-600';
                break;
            case 'wallet':
                icon = 'pi pi-wallet';
                color = 'text-purple-600';
                break;
            default:
                icon = 'pi pi-question-circle';
                color = 'text-gray-500';
        }
        return (
            <div className="flex align-items-center">
                <i className={`${icon} ${color} mr-2 text-lg`}></i>
                <span className={`${color} font-medium`}>{rowData.paymentMethod || 'N/A'}</span>
            </div>
        );
    };

    const amountBodyTemplate = (rowData) => {
        const isAddition = rowData.movementType === 'addition';
        const className = isAddition ? 'text-green-500' : 'text-red-500';
        const prefix = isAddition ? '+' : '-';
        return (
            <span className={`${className} font-semibold`}>
                {prefix}
                {formatCurrency(rowData.movementAmount)}
            </span>
        );
    };

    // Header for the DataTable including the global search input and date filters
    const renderHeader = () => {
        return (
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                {/* Date Range Filter UI */}
                <div className="flex flex-column sm:flex-row align-items-center mb-3 md:mb-0">
                    {' '}
                    {/* Responsive layout for filters */}
                    <div className="p-field mb-2 sm:mb-0 sm:mr-2 w-full sm:w-auto">
                        {' '}
                        {/* Responsive width */}
                        <label htmlFor="dateFrom" className="p-sr-only">
                            From
                        </label>
                        <Calendar
                            id="dateFrom"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.value)}
                            dateFormat="mm-dd-yy"
                            placeholder="From Date"
                            showIcon
                            className="p-inputtext-sm w-full" // Full width on small screens
                            maxDate={dateTo || today} // Prevent selecting 'from' date after 'to' date
                        />
                    </div>
                    <div className="p-field mb-2 sm:mb-0 sm:mr-2 w-full sm:w-auto">
                        {' '}
                        {/* Responsive width */}
                        <label htmlFor="dateTo" className="p-sr-only">
                            To
                        </label>
                        <Calendar
                            id="dateTo"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.value)}
                            dateFormat="mm-dd-yy"
                            placeholder="To Date"
                            showIcon
                            className="p-inputtext-sm w-full" // Full width on small screens
                            minDate={dateFrom} // Prevent selecting 'to' date before 'from' date
                            maxDate={today} // Prevent selecting future dates
                        />
                    </div>
                    <Button
                        label="Fetch Movements"
                        icon="pi pi-search"
                        className="p-button-sm w-full sm:w-auto" // Full width on small screens
                        onClick={handleFetchMovementsClick}
                        disabled={loadingMovements || !dateFrom || !dateTo} // Disable button while loading or if dates are missing
                    />
                </div>

                {/* Global Search Input */}
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    {/* --- MODIFIED: Set filter to null when input is empty --- */}
                    <InputText
                        type="search"
                        value={globalFilter || ''} // Keep displaying empty string in input if null
                        onChange={(e) => setGlobalFilter(e.target.value || null)} // Set to null if empty
                        placeholder="Global Search"
                        className="p-inputtext-sm w-full"
                    />
                    {/* --- END MODIFIED --- */}
                </span>
            </div>
        );
    };

    const header = renderHeader();

    return (
        <div className="grid">
            {/* Balance Summary Section */}
            <div className="col-12">
                <div className="card shadow-1 border-round">
                    <h5 className="mb-4">Wallet Summary</h5>
                    {loadingBalance ? (
                        <div className="flex justify-content-center align-items-center p-4" style={{ height: '150px' }}>
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="6" animationDuration=".8s" />
                        </div>
                    ) : walletData ? (
                        <div className="grid text-center md:text-left">
                            {/* Total Balance Card */}
                            <div className="col-12 md:col-6 lg:col-3">
                                <div className="surface-card shadow-2 p-3 border-round h-full flex flex-column justify-content-between">
                                    <div className="flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <span className="block text-500 font-medium mb-3">Total Balance</span>
                                            <div className="text-900 font-bold text-xl md:text-2xl">{formatCurrency(walletData.totalBalance)}</div>
                                        </div>
                                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '3rem', height: '3rem' }}>
                                            <i className="pi pi-wallet text-blue-500 text-2xl"></i>
                                        </div>
                                    </div>
                                    {/* Optional: Add comparison/trend text here */}
                                    {/* <span className="text-500">Current available funds</span> */}
                                </div>
                            </div>
                            {/* Cash Orders Card */}
                            <div className="col-12 md:col-6 lg:col-3">
                                <div className="surface-card shadow-2 p-3 border-round h-full flex flex-column justify-content-between">
                                    <div className="flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <span className="block text-500 font-medium mb-3">Cash Orders</span>
                                            <div className="text-900 font-medium text-xl">{formatCurrency(walletData.cashOrders)}</div>
                                        </div>
                                        <div className="flex align-items-center justify-content-center bg-green-100 border-round" style={{ width: '3rem', height: '3rem' }}>
                                            <i className="pi pi-money-bill text-green-500 text-2xl"></i>
                                        </div>
                                    </div>
                                    {/* <span className="text-500">Total cash received</span> */}
                                </div>
                            </div>
                            {/* Card Orders Card */}
                            <div className="col-12 md:col-6 lg:col-3">
                                <div className="surface-card shadow-2 p-3 border-round h-full flex flex-column justify-content-between">
                                    <div className="flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <span className="block text-500 font-medium mb-3">Card Orders</span>
                                            <div className="text-900 font-medium text-xl">{formatCurrency(walletData.cardOrders)}</div>
                                        </div>
                                        <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '3rem', height: '3rem' }}>
                                            <i className="pi pi-credit-card text-cyan-500 text-2xl"></i>
                                        </div>
                                    </div>
                                    {/* <span className="text-500">Total card payments</span> */}
                                </div>
                            </div>
                            {/* Deductions Card */}
                            <div className="col-12 md:col-6 lg:col-3">
                                <div className="surface-card shadow-2 p-3 border-round h-full flex flex-column justify-content-between">
                                    <div className="flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <span className="block text-500 font-medium mb-3">Deductions</span>
                                            <div className="text-900 font-medium text-xl">{formatCurrency(walletData.deductions)}</div>
                                        </div>
                                        <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '3rem', height: '3rem' }}>
                                            {/* Changed icon and color for deductions */}
                                            <i className="pi pi-minus-circle text-orange-500 text-2xl"></i>
                                        </div>
                                    </div>
                                    {/* <span className="text-500">Total deductions made</span> */}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-500">No balance data available or failed to load.</p>
                    )}
                </div>
            </div>

            {/* Movements Section */}
            <div className="col-12">
                <div className="card shadow-1 border-round">
                    <DataTable
                        value={movements}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        loading={loadingMovements}
                        emptyMessage={loadingMovements ? 'Loading movements...' : 'No movements found for the selected date range.'} // Updated empty message
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} movements"
                        className="p-datatable-gridlines p-datatable-sm"
                        dataKey="_id"
                        responsiveLayout="scroll"
                        sortMode="multiple"
                        removableSort
                        globalFilter={globalFilter} // Apply global filter state (null means no filter)
                        header={header}
                        // --- REMOVED: globalFilterFields prop to search all columns ---
                        // globalFilterFields={['reason', 'movementType', 'paymentMethod']}
                        // --- END REMOVED ---
                    >
                        <Column field="reason" header="Reason" sortable style={{ minWidth: '18rem' }} />
                        <Column field="movementDate" header="Date" body={(rowData) => formatDate(rowData.movementDate)} sortable style={{ minWidth: '14rem' }} />
                        <Column field="movementType" header="Type" body={movementTypeBodyTemplate} sortable style={{ minWidth: '10rem' }} />
                        <Column field="movementAmount" header="Amount" body={amountBodyTemplate} sortable style={{ minWidth: '10rem' }} />
                        <Column field="paymentMethod" header="Payment Method" body={paymentMethodBodyTemplate} sortable style={{ minWidth: '12rem' }} />
                    </DataTable>
                </div>
            </div>
            {/* Ensure Toaster is rendered in your main layout */}
        </div>
    );
}

export default FinancialsPage;
