import { getDictionary } from '../../../../dictionaries/dictionaries';
import LoginContent from '../../../../components/Authentication/LoginContent/LoginContent';

const LoginPage = async ({params: {lang}}) => {

    // CONST DICTIONARY
    const dictionary = await getDictionary(lang);

    return (
        <LoginContent dictionary={dictionary} lang={lang} />
    );
};

export default LoginPage;
