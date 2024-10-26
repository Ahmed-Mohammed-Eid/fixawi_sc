import AppMenu from './AppMenu';
import { ReactNode } from 'react';

type ChildContainerProps = {
    children: ReactNode;
    dictionary: any;
    lang: string;
};

const AppSidebar = ({ children, dictionary, lang }: ChildContainerProps) => {
    return <AppMenu dictionary={dictionary} lang={lang}>
        {children}
    </AppMenu>;
};

export default AppSidebar;
