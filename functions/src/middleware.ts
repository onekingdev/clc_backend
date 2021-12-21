const cors = require("cors")({ origin: true });
const jwt = require('jsonwebtoken');

export const applyMiddleware = (req, res, handler, checkToken = true) => {
  
    if (!checkToken) {
      return cors(req, res, () => {
        return handler(req, res)
      })
    }
    const token =  req.body.token || req.query.token || req.header('x-auth-token');
    /*------------------------------ Verify token -S-------------------------------*/
    try {
      jwt.verify(token, process.env.SECRET_KEY, (error, decoded) => {
        if (error) {
          return res.status(401).json({ msg: 'Token is not valid' });
        } else {
          req.user = decoded.user;
        }
      });
    } catch (err) {
      console.error('something wrong with auth middleware');
      res.status(500).json({ msg: 'Server Error' });
    }
    /*------------------------------ Verify token -E-------------------------------*/

    return cors(req, res, async() => {
      return handler(req, res)
    })
  }
// exports.handler = functions.runWith(runtimeOpts).https.onRequest(
//    applyMiddleware(handler, { authenticatedRoute: true })
// )