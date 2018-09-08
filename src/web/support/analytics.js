import router from '@/web/router';

// Track SPA page views
if (process.env.VUE_APP_GOOGLE_ANALYTICS_ID && window.gtag)
    router.afterEach(to => window.gtag('config', process.env.VUE_APP_GOOGLE_ANALYTICS_ID, { page_path: to.path }));
