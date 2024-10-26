import { Divider } from 'primereact/divider';

export function Header({ lang }) {
    // en & ar
    return (
        <div className="font-bold mb-3" dir={lang === 'en' ? 'ltr' : 'rtl'}>
            {lang === 'en' ? 'Pick a password' : 'اختر كلمة مرور'}
        </div>
    );
}

export function Footer({ lang }) {
    return (
        <div dir={lang === 'en' ? 'ltr' : 'rtl'}>
            <Divider />
            <h5 className="mt-2">{lang === 'en' ? 'Suggestions' : 'الاقتراحات'}</h5>
            <ul className="pl-2 ml-2 mt-0 line-height-3">
                <li>{lang === 'en' ? 'At least one lowercase' : 'على الأقل حرف صغير'}</li>
                <li>{lang === 'en' ? 'At least one uppercase' : 'على الأقل حرف كبير'}</li>
                <li>{lang === 'en' ? 'At least one numeric' : 'على الأقل رقم واحد'}</li>
                <li>{lang === 'en' ? 'Minimum 8 characters' : 'الحد الأدنى 8 أحرف'}</li>
            </ul>
        </div>
    );
}