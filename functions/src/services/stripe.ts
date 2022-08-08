require("dotenv").config();

export const getStripeKey = {
  stripe_secret: (env: string) => {
    if (env === "production") return String(process.env.STRIPE_PRODUCTION_KEY);
    return String(process.env.STRIPE_DEVELOPMENT_KEY);
  },
  subscription_price: (env: string, type: string, interval: string) => {
    if (env === "production") {
      if (type == "CL TEST") {
        return String("price_1JPdYgAT9ya87fpTBogwLuNz");
      } else if (type === "CL AI") {
        return String("price_1JK37pAT9ya87fpTjdhp4YMc");
      } else {
        return String("price_1JK37pAT9ya87fpT2bvLdmi8");
      }
    } else {
      if (type === "CL TEST") {
        if (interval === "month") {
          return String(process.env.DEV_PRICE_TEST);
        } else {
          return String(process.env.DEV_PRICE_TEST_YEAR);
        }
      } else if (type === "CL AI") {
        if (interval === "month") {
          return String(process.env.DEV_PRICE_ONE_KEY);
        } else {
          return String(process.env.DEV_PRICE_ONE_KEY_YEAR);
        }
      } else {
        if (interval === "month") {
          return String(process.env.DEV_PRICE_TWO_KEY);
        } else {
          return String(process.env.DEV_PRICE_TWO_KEY_YEAR);
        }
      }
    }
  },
  hook_secret: (env: string) => {
    if (env === "production") return "whsec_uhC7g1hinSwzmmyBCKbWTsBLBRemkzBI";
    // return "whsec_PN7zX0x2NB093oANjDH9MgifE6ApxYqW";
    return "whsec_21cc404f4857fb0f86cfac231c5c2d7e5f9d74392ca5e96fabb193a58d111e16";
  },
};
