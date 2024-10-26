'use client';
import React from 'react';
import axios from 'axios';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import { toast } from 'react-hot-toast';


export default function PricesListFormPart({ lang }) {

    // SERVICE CENTERS
    const [serviceCenters, setServiceCenters] = React.useState([]);

    const [priceList, setPriceList] = React.useState([]);

    function addNewOne() {
        setPriceList([...priceList, {
            serviceTitle: '',
            servicePrice: '',
            isAvailable: true,
        }]);
    }

    async function createPriceList(event) {
        // PREVENT THE DEFAULT BEHAVIOR
        event.preventDefault();

        // GET THE TOKEN
        const token = localStorage.getItem('token') || null;

        // VALIDATE THE PRICE LIST TO CHECK THAT ALL FIELDS (serviceTitle && servicePrice) ARE FILLED
        const isValid = priceList.every(item => item.serviceTitle && item.servicePrice);
        if (!isValid) {
            return toast.error(lang === 'en' ? 'Please fill all fields' : 'يرجى ملء جميع الحقول');
        }

        // CREATE THE PRICE LIST
        axios.post(`${process.env.API_URL}/service/center/price/list`, {
            priceList
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(() => {
                toast.success(lang === 'en' ? 'Price List Created Successfully' : 'تم إنشاء قائمة الأسعار بنجاح');
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || lang === 'en' ? 'Something went wrong' : 'حدث خطأ ما');
            });
    }

    function getServiceCenterPriceList() {
        // GET THE TOKEN
        const token = localStorage.getItem('token') || null;
        console.log(token);

        axios.get(`${process.env.API_URL}/service/center/price/list`, {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })
            .then(response => {
                setPriceList(response.data?.priceList?.priceList || []);
            })
            .catch(error => {
                console.log(error);
                return null;
            });
    }

    React.useEffect(() => {
        getServiceCenterPriceList();
    }, []);

    return (
        <form onSubmit={createPriceList}>
            <div className={'card'}>
                <h3 className={'text-2xl mb-5 uppercase'}>
                    {lang === 'en' ? 'Price List' : 'قائمة الأسعار'}
                </h3>
                <hr />

                {priceList.length > 0 && priceList.map((item, index) => {
                    return (
                        <div className={'p-fluid formgrid grid mb-2 align-items-center'} key={index}>
                            <div className={'field col-4'}>
                                <label className={'font-bold'}
                                       htmlFor={`ServiceTitle${index}`}>{lang === 'en' ? 'Service Title' : 'عنوان الخدمة'}</label>
                                <InputText
                                    id={`ServiceTitle${index}`}
                                    value={item.serviceTitle}
                                    onChange={(e) => {
                                        const list = [...priceList];
                                        list[index].serviceTitle = e.target.value;
                                        setPriceList(list);
                                    }}
                                />
                            </div>
                            <div className={'field col-4'}>
                                <label className={'font-bold'}
                                       htmlFor={`ServicePrice${index}`}>{lang === 'en' ? 'Service Price' : 'سعر الخدمة'}</label>
                                <InputNumber
                                    id={`ServicePrice${index}`}
                                    value={item.servicePrice}
                                    onValueChange={(e) => {
                                        const list = [...priceList];
                                        list[index].servicePrice = e.value;
                                        setPriceList(list);
                                    }}
                                />
                            </div>
                            <div className={'field col-2 flex flex-column align-items-center'}>
                                <label className={'font-bold'}
                                       htmlFor={`IsAvailable${index}`}>{lang === 'en' ? 'Is Available' : 'متاح'}</label>
                                <InputSwitch
                                    id={`IsAvailable${index}`}
                                    checked={item.isAvailable}
                                    onChange={(e) => {
                                        const list = [...priceList];
                                        list[index].isAvailable = e.value;
                                        setPriceList(list);
                                    }}
                                />
                            </div>
                            <div className={'field col-2 flex flex-column align-items-center'}>
                                <label className={'font-bold'}>{lang === 'en' ? 'Delete' : 'حذف'}</label>
                                <Button
                                    icon="pi pi-trash"
                                    className={'p-button-danger'}
                                    onClick={() => {
                                        const list = [...priceList];
                                        list.splice(index, 1);
                                        setPriceList(list);
                                    }}
                                />
                            </div>
                        </div>
                    );
                })
                }

                <button type={'button'} onSubmit={(e) => e.preventDefault()} className={'btn btn-primary'}
                        onClick={addNewOne}>
                    {lang === 'en' ? 'Add New One' : 'أضف جديد'}
                </button>
            </div>

            <div className={'flex justify-center mt-5'}>
                <Button
                    label={lang === 'en' ? 'Create Price List' : 'إنشاء قائمة الأسعار'}
                    icon="pi pi-plus"
                    style={{
                        width: '100%',
                        padding: '1rem'
                    }}
                />
            </div>
        </form>

    );
}