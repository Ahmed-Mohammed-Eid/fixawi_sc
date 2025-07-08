import Link from 'next/link';
import classes from './ContactSupport.module.scss';

function ContactSupport() {
    return (
        <Link className={classes.ContactSupport} href="tel:+201211117606">
            <div className={classes.ContactSupportText}>
                <h6>Support</h6>
                <p>+201211117606</p>
            </div>
        </Link>
    );
}

export default ContactSupport;
