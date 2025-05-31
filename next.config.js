/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        API_URL: 'https://api.sayyn.net/api/v1'
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'via.placeholder.com'
            },
            {
                protocol: 'https',
                hostname: 'test.fixawi.com'
            },
            {
                protocol: 'https',
                hostname: 'fixawi.com'
            },
            {
                protocol: 'https',
                hostname: 'api.fixawi.com'
            },
            // LOCALHOST
            {
                protocol: 'http',
                hostname: 'localhost'
            },
            {
                protocol: 'https',
                hostname: 'localhost'
            },
            {
                protocol: 'http',
                hostname: 'api.sayyn.net'
            },
            {
                protocol: 'https',
                hostname: 'api.sayyn.net'
            },
            {
                protocol: 'https',
                hostname: 'sayyn.net'
            },
            {
                protocol: 'https',
                hostname: 'sayyn.com'
            },
            {
                protocol: 'https',
                hostname: 'sayyn.org'
            },
            {
                protocol: 'https',
                hostname: 'sayyn.app'
            },
            {
                protocol: 'https',
                hostname: 'sayyn.io'
            }
        ]
    }
};

module.exports = nextConfig;
