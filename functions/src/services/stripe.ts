export const getStripeKey = {
    stripe_secret: (env: string) => {
        if (env === 'production') return 'sk_live_cqpMMr5SBLeiTTtmBE0yCC1l'
        return 'sk_test_V09bhnBnCKBDwLD6gMha7WgG'
    },
    subscription_price: (env: string) => {
        if (env === 'production') return 'price_1IVjJgAT9ya87fpTNhztVJTo'
        return 'price_1IHZKzAT9ya87fpT4uf93joS'
    },
    hook_secret: (env: string) => {
        if (env === 'production') return 'whsec_uhC7g1hinSwzmmyBCKbWTsBLBRemkzBI'
        return 'whsec_PN7zX0x2NB093oANjDH9MgifE6ApxYqW'
    },
}