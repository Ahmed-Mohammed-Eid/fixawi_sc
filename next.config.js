/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        API_URL: 'https://test.fixawi.com/api/v1'
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
            }
        ]
    }
};

module.exports = nextConfig;
