'use client';
import React from 'react';
import axios from 'axios';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import { toast } from 'react-hot-toast';

export default function PricesListFormPart({ lang }) {
    const isRTL = lang === 'ar';

    // SERVICE CENTERS
    // const [serviceCenters, setServiceCenters] = React.useState([]); // Commented out as it's not used

    const [priceList, setPriceList] = React.useState([]);
    const [errors, setErrors] = React.useState({});

    function addNewOne() {
        setPriceList([
            ...priceList,
            {
                serviceTitle: '',
                servicePrice: null, // Initialize with null for InputNumber
                isAvailable: true
            }
        ]);
        // Clear general error when adding a new item if it was the only error
        if (errors.priceListGeneral && priceList.length === 0) {
            setErrors(prevErrors => {
                const newErrors = {...prevErrors};
                delete newErrors.priceListGeneral;
                return newErrors;
            });
        }
    }

    function validateForm() {
        const newErrors = { priceList: [] };
        let isValid = true;

        if (priceList.length === 0) {
            newErrors.priceListGeneral = lang === 'en' ? "Please add at least one service to the price list." : "يرجى إضافة خدمة واحدة على الأقل إلى قائمة الأسعار.";
            isValid = false;
        } else {
             priceList.forEach((item, index) => {
                const itemErrors = {};
                if (!item.serviceTitle || item.serviceTitle.trim() === '') {
                    itemErrors.serviceTitle = lang === 'en' ? "Service Title is required." : "عنوان الخدمة مطلوب.";
                    isValid = false;
                }
                if (item.servicePrice === null || item.servicePrice === '') { // Consistent with current validation logic
                    itemErrors.servicePrice = lang === 'en' ? "Service Price is required." : "سعر الخدمة مطلوب.";
                    isValid = false;
                }
                newErrors.priceList[index] = itemErrors;
            });
        }

        setErrors(newErrors);
        return isValid;
    }

    async function createPriceList(event) {
        // PREVENT THE DEFAULT BEHAVIOR
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        // GET THE TOKEN
        const token = localStorage.getItem('token') || null;

        // CREATE THE PRICE LIST
        axios
            .post(
                `${process.env.API_URL}/service/center/price/list`,
                {
                    priceList
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
            .then(() => {
                toast.success(lang === 'en' ? 'Price List Created Successfully' : 'تم إنشاء قائمة الأسعار بنجاح');
                setErrors({}); // Clear errors on success
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || (lang === 'en' ? 'Something went wrong' : 'حدث خطأ ما'));
            });
    }

    function getServiceCenterPriceList() {
        // GET THE TOKEN
        const token = localStorage.getItem('token') || null;
        // console.log(token); // Commented out console.log

        axios
            .get(`${process.env.API_URL}/service/center/price/list`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then((response) => {
                setPriceList(response.data?.priceList?.priceList || []);
            })
            .catch((error) => {
                console.log(error); // Keep for debugging, or handle more gracefully
                // return null; // Not necessary to return null here
            });
    }

    React.useEffect(() => {
        getServiceCenterPriceList();
    }, []);

    return (
        <form onSubmit={createPriceList} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className={'card'}>
                <h3 className={'text-2xl mb-2 uppercase'}>
                    {lang === 'en' ? 'Price List' : 'قائمة الأسعار'}
                    <span className="text-red-500">*</span>
                </h3>
                {errors.priceListGeneral && <small className="p-error mb-2 block">{errors.priceListGeneral}</small>}
                <hr className="mb-5"/>

                {priceList.length > 0 &&
                    priceList.map((item, index) => {
                        return (
                            <div className={'p-fluid formgrid grid mb-2 align-items-start'} key={index}>
                                <div className={'field col-12 md:col-4'}>
                                    <label className={'font-bold'} htmlFor={`ServiceTitle${index}`}>
                                        {lang === 'en' ? 'Service Title' : 'عنوان الخدمة'} <span className="text-red-500">*</span>
                                    </label>
                                    <InputText
                                        id={`ServiceTitle${index}`}
                                        value={item.serviceTitle}
                                        onChange={(e) => {
                                            const list = [...priceList];
                                            list[index].serviceTitle = e.target.value;
                                            setPriceList(list);
                                            if (errors.priceList?.[index]?.serviceTitle) {
                                                setErrors(prev => ({
                                                    ...prev,
                                                    priceList: prev.priceList.map((pl, i) => i === index ? {...pl, serviceTitle: undefined} : pl)
                                                }));
                                            }
                                        }}
                                        className={errors.priceList?.[index]?.serviceTitle ? 'p-invalid' : ''}
                                    />
                                    {errors.priceList?.[index]?.serviceTitle && <small className="p-error">{errors.priceList[index].serviceTitle}</small>}
                                </div>
                                <div className={'field col-12 md:col-4'}>
                                    <label className={'font-bold'} htmlFor={`ServicePrice${index}`}>
                                        {lang === 'en' ? 'Service Price' : 'سعر الخدمة'} <span className="text-red-500">*</span>
                                    </label>
                                    <InputNumber
                                        id={`ServicePrice${index}`}
                                        value={item.servicePrice}
                                        onValueChange={(e) => {
                                            const list = [...priceList];
                                            list[index].servicePrice = e.value;
                                            setPriceList(list);
                                            if (errors.priceList?.[index]?.servicePrice) {
                                                 setErrors(prev => ({
                                                    ...prev,
                                                    priceList: prev.priceList.map((pl, i) => i === index ? {...pl, servicePrice: undefined} : pl)
                                                }));
                                            }
                                        }}
                                        mode="decimal" // Added for better UX with prices
                                        minFractionDigits={0} // Optional: configure as needed
                                        maxFractionDigits={2} // Optional: configure as needed
                                        className={errors.priceList?.[index]?.servicePrice ? 'p-invalid' : ''}
                                    />
                                    {errors.priceList?.[index]?.servicePrice && <small className="p-error">{errors.priceList[index].servicePrice}</small>}
                                </div>
                                <div className={'field col-6 md:col-2 flex flex-column align-items-center'}>
                                    <label className={'font-bold'} htmlFor={`IsAvailable${index}`}>
                                        {lang === 'en' ? 'Is Available' : 'متاح'}
                                    </label>
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
                                <div className={'field col-6 md:col-2 flex flex-column align-items-center mt-4 md:mt-0'}>
                                    <label className={'font-bold mb-2 md:mb-0'}>{lang === 'en' ? 'Delete' : 'حذف'}</label>
                                    <Button
                                        type="button"
                                        icon="pi pi-trash"
                                        className={'p-button-danger'}
                                        onClick={() => {
                                            const list = [...priceList];
                                            list.splice(index, 1);
                                            setPriceList(list);
                                            // Also remove errors for the deleted item
                                            if (errors.priceList?.length > index) {
                                                setErrors(prev => {
                                                    const newPriceListErrors = [...prev.priceList];
                                                    newPriceListErrors.splice(index, 1);
                                                    return {...prev, priceList: newPriceListErrors};
                                                });
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}

                <button type={'button'} className={'btn btn-primary mt-3'} onClick={addNewOne}>
                    {lang === 'en' ? 'Add New One' : 'أضف جديد'}
                </button>
            </div>

            <div className={'flex justify-center mt-5'}>
                <Button
                    type="submit" // Changed to submit
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
