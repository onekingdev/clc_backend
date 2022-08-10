require("dotenv").config();

export const getStripeKey = {
  stripe_secret: (env: string) => {
    switch (env) {
      case "production":
        return String(process.env.STRIPE_PRODUCTION_KEY);
      case "local":
      case "development":
      default:
        return String(process.env.STRIPE_DEVELOPMENT_KEY);
    }
  },
  subscription_price: (env: string, type: string, interval: string) => {
    switch (env) {
      case "production":
        if (type == "CL TEST") {
          if (interval === "year") {
            return String(process.env.PROD_PRICE_TEST_YEAR);
          } else if (interval === "month") {
            return String(process.env.PROD_PRICE_TEST);
          } else {
            return String(process.env.PROD_PRICE_TEST);
          }
        } else if (type === "CL AI") {
          if (interval === "year") {
            return String(process.env.PROD_PRICE_ONE_KEY_YEAR);
          } else if (interval === "month") {
            return String(process.env.PROD_PRICE_ONE_KEY);
          } else {
            return String(process.env.PROD_PRICE_ONE_KEY);
          }
        } else if (type === "CL AI+") {
          if (interval === "year") {
            return String(process.env.PROD_PRICE_TWO_KEY_YEAR);
          } else if (interval === "month") {
            return String(process.env.PROD_PRICE_TWO_KEY);
          } else {
            return String(process.env.PROD_PRICE_TWO_KEY);
          }
        } else {
          if (interval === "year") {
            return String(process.env.PROD_PRICE_ONE_KEY_YEAR);
          } else if (interval === "month") {
            return String(process.env.PROD_PRICE_ONE_KEY);
          } else {
            return String(process.env.PROD_PRICE_ONE_KEY);
          }
        }
      case "local":
      case "development":
      default:
        if (type === "CL TEST") {
          if (interval === "year") {
            return String(process.env.DEV_PRICE_TEST_YEAR);
          } else if (interval === "month") {
            return String(process.env.DEV_PRICE_TEST);
          } else {
            return String(process.env.DEV_PRICE_TEST);
          }
        } else if (type === "CL AI") {
          if (interval === "year") {
            return String(process.env.DEV_PRICE_ONE_KEY_YEAR);
          } else if (interval === "month") {
            return String(process.env.DEV_PRICE_ONE_KEY);
          } else {
            return String(process.env.DEV_PRICE_ONE_KEY);
          }
        } else if (type === "CL AI+") {
          if (interval === "year") {
            return String(process.env.DEV_PRICE_TWO_KEY_YEAR);
          } else if (interval === "month") {
            return String(process.env.DEV_PRICE_TWO_KEY);
          } else {
            return String(process.env.DEV_PRICE_TWO_KEY);
          }
        } else {
          if (interval === "year") {
            return String(process.env.DEV_PRICE_ONE_KEY_YEAR);
          } else if (interval === "month") {
            return String(process.env.DEV_PRICE_ONE_KEY);
          } else {
            return String(process.env.DEV_PRICE_ONE_KEY);
          }
        }
    }
  },
  hook_secret: (env: string) => {
    switch (env) {
      case "production":
        return "whsec_uhC7g1hinSwzmmyBCKbWTsBLBRemkzBI";
      case "development":
        return "whsec_PN7zX0x2NB093oANjDH9MgifE6ApxYqW";
      case "local":
        return "whsec_21cc404f4857fb0f86cfac231c5c2d7e5f9d74392ca5e96fabb193a58d111e16";
      default:
        return "";
    }
  },
};
