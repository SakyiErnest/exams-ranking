/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        typedRoutes: false
    },
    reactStrictMode: true,
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
    },
    // Setting a standard output configuration
    distDir: '.next',
    images: {
        domains: ['firebasestorage.googleapis.com']
    }
}

module.exports = nextConfig