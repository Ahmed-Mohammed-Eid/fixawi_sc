"use server";

import {match} from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

export let defaultLocale = 'en'
let locales = ['en', 'ar']

// Get the preferred locale, similar to the above or using a library
function getLocale() {

    let headers = {'accept-language': 'en-US,en;q=0.5'}
    let languages = new Negotiator({headers}).languages()

    return match(languages, locales, defaultLocale);
}


export async function middleware(request) {
    // IF THE PATHNAME INCLUDES assets, DO NOT RUN THIS MIDDLEWARE
    if (request.nextUrl.pathname.includes('assets')) return;
    // IF THE PATHNAME INCLUDES api, DO NOT RUN THIS MIDDLEWARE
    if (request.nextUrl.pathname.includes('api')) return;
    // IF THE PATHNAME INCLUDES layout, DO NOT RUN THIS MIDDLEWARE
    if (request.nextUrl.pathname.includes('layout')) return;
    // IF THE PATHNAME INCLUDES themes, DO NOT RUN THIS MIDDLEWARE
    if (request.nextUrl.pathname.includes('themes')) return;

    // GET THE COOKIES
    const cookies = request.cookies

    // get the all cookies from the request
    const lang = cookies.get('language');
    // Check if there is any supported locale in the pathname
    const {pathname} = request.nextUrl
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    if (pathnameHasLocale) return

    // Redirect if there is no locale
    let locale = locales.includes(lang?.value) ? lang.value : getLocale(request);

    // Set the language cookie
    request.nextUrl.pathname = `/${locale}${pathname}`
    // e.g. incoming request is /products
    // The new URL is now /en-US/products
    return Response.redirect(request.nextUrl)
}

export const config = {
    matcher: [
        // Skip all internal paths (_next)
        '/((?!_next).*)',
        // Optional: only run on root (/) URL
        // '/'
    ],
}