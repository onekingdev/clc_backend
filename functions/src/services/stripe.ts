require("dotenv").config();

export const getStripeKey = {
  stripe_secret: (env: string) => {
    if (env === "production") return String(process.env.STRIPE_PRODUCTION_KEY);
    return String(process.env.STRIPE_DEVELOPMENT_KEY);
  },
  subscription_price: (env: string, type: string) => {
    if (env === "production") {
      if (type === "CL AI") {
        return String("price_1JK37pAT9ya87fpTjdhp4YMc");
      } else {
        return String("price_1JK37pAT9ya87fpT2bvLdmi8");
      }
    } else {
      if (type === "CL AI") {
        return String(process.env.DEV_PRICE_ONE_KEY);
      } else {
        return String(process.env.DEV_PRICE_TWO_KEY);
      }
    }
  },
  hook_secret: (env: string) => {
    if (env === "production") return "whsec_uhC7g1hinSwzmmyBCKbWTsBLBRemkzBI";
    return "whsec_PN7zX0x2NB093oANjDH9MgifE6ApxYqW";
  },
};
