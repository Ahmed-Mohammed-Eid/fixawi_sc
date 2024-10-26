'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Badge } from 'primereact/badge';

export default function DashboardPageContent({lang}) {

    // STATE
    const [visits, setVisits] = useState([]);

    // GET THE VISITS HANDLER
    function getVisits() {
        // GET THE TOKEN
        const token = localStorage.getItem('token') || null;

        axios.get(`${process.env.API_URL}/service/center/visits`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(response => {
                // CREATE NEW ARRAY FOR TABLE USE
                const visitsTableArray = response.data?.visits.map(visit => {
                    const {carModel, carBrand, carNumber, modelYear} = visit?.userId?.userCars[0] || {};
                    const carInfo = `${carBrand} - ${carModel} - ${modelYear} - ${carNumber}`;

                    return {
                        fullName: visit?.userId?.fullName,
                        phoneNumber: visit?.userId?.phoneNumber,
                        createdAt: visit?.createdAt,
                        car: carInfo,
                        visitStatus: visit?.visitStatus,
                        _id: visit?._id
                    }
                })


                setVisits(visitsTableArray || []);
            })
            .catch(error => {
                toast.error(error.response?.data?.message || 'An error occurred');
                return null;
            });
    }


    useEffect(() => {
        getVisits();
    }, []);


    return <div className="card mb-0">
        <div className="card-body">
            <h3 className="card-title">
                {lang === "en" ? "Visits" : "الزيارات"}
            </h3>

            <DataTable
                value={visits || []}
                paginator
                rows={25}
                rowsPerPageOptions={[25, 50, 100]}
                className="p-datatable-sm"
                emptyMessage={lang === "en" ? "No records found" : "لم يتم العثور على سجلات"}
                header={lang === "en" ? "Visits" : "الزيارات"}
            >
                <Column
                    field={"fullName"}
                    header={lang === "en" ? "Full Name" : "الاسم الكامل"}
                    sortable
                    filter={true}
                />
                {/*  PHONE NUMBER  */}
                <Column
                    field={"phoneNumber"}
                    header={lang === "en" ? "Phone Number" : "رقم الهاتف"}
                    sortable
                    filter={true}
                />
                {/*  DATE  */}
                <Column
                    field={"createdAt"}
                    header={lang === "en" ? "Date" : "التاريخ"}
                    sortable
                    filter={true}
                    body={(rowData) => {
                        const date = new Date(rowData.createdAt);
                        return date.toLocaleDateString(lang === "en" ? "en-US" : "ar-EG", {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                    }}
                />
                {/*  CAR  */}
                <Column
                    field={"car"}
                    header={lang === "en" ? "Car" : "السيارة"}
                    sortable
                />
                {/*  status  */}
                <Column
                    field={"visitStatus"}
                    header={lang === "en" ? "Status" : "الحالة"}
                    sortable
                    filter={true}
                    body={(rowData) => {
                        return(
                            <Badge value={rowData.visitStatus} severity={rowData.visitStatus === "pending" ? "warning" : "success"} />
                        )
                    }}
                />

                {/*  ACTIONS  */}
                <Column
                    field={"_id"}
                    header={lang === "en" ? "Actions" : "الإجراءات"}
                    body={(rowData) => {
                        return(
                            <div>

                            </div>
                        )
                    }}
                />
            </DataTable>
        </div>
    </div>;
}