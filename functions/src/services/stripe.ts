require('dotenv').config();

export const getStripeKey = {
    stripe_secret: (env: string) => {
        if (env === 'production') return String(process.env.STRIPE_PRODUCTION_KEY);
        return String(process.env.STRIPE_DEVELOPMENT_KEY);

    },
    subscription_price: (env: string, type: string) => {
       if (env === 'production') 
       {
            if(type === "CL AI")
            {
                return String(process.env.PROD_PRICE_ONE);
            }
            else
            {
                return String(process.env.PROD_PRICE_TWO);
            }
       }
       else
       {
            if(type === "CL AI")
            {
                return String(process.env.DEV_PRICE_ONE);
            }
            else
            {
                return String(process.env.DEV_PRICE_TWO);
            }
       }
        

    },
    hook_secret: (env: string) => {
        if (env === 'production') return 'whsec_uhC7g1hinSwzmmyBCKbWTsBLBRemkzBI'
        return 'whsec_PN7zX0x2NB093oANjDH9MgifE6ApxYqW'
    },
}