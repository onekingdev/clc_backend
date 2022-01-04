const cors = require("cors")({ origin: true });
const jwt = require('jsonwebtoken');
const SUCCESS = 200;
const TOKEN_ERROR = 401;
const SERVER_ERROR = 500;
export const applyMiddleware = (req, res, handler, checkToken = true) => {
      cors(req, res, async () => {
        if (!checkToken) return handler(req, res)

        const token =  req.body.token || req.query.token || req.get('authorization');
        let status = SUCCESS;
        if(!token) status = TOKEN_ERROR;
        // let decodedUser = {};
        /*------------------------------ Verify token -S-------------------------------*/
        try {
          jwt.verify(token, process.env.SECRET_KEY, (error, decoded) => {
            if (error) status = TOKEN_ERROR;
            // else decodedUser = decoded
          });
        } catch (err) {
          status = SERVER_ERROR;
        }
        if(status != SUCCESS) {
          res.status(status).json({ msg: "Server Not Found!"});
        }  
      /*------------------------------ Verify token -E-------------------------------*/
        return handler(req, res)
      })
  }
