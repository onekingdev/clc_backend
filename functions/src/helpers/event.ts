// require("dotenv").config();
import { PaymentHistory } from "../entities/PaymentHistory";
import { Users } from "../entities/Users";
import { connect } from "../config";
export const newPaymentOperateEvent = async(email, action, amount = 0, amount_captured = 0, payment_id = '', customer_id = '', subscription_id = '', subscriptionFinishAt = new Date(0), errMsg='') => {
    const connection = await connect();

    const paymentHistoyRepo = connection.getRepository(PaymentHistory);
    const userRepo = connection.getRepository(Users);

    let user = await userRepo.findOne({ email: email });
    
    const data = {
        user_id: user.id == undefined ? 0 : user.id,
        email: email == undefined ? '' : email,
        createdAt: new Date(),
        action: action,
        amount: amount == undefined ? 0 : amount,
        amount_captured: amount_captured == undefined ? 0 : amount_captured,
        payment_id: payment_id == undefined ? '' : payment_id,
        customer_id: customer_id == undefined ? '' : customer_id,
        subscription_id: subscription_id == undefined ? '' : subscription_id,
        subscriptionFinishAt: subscriptionFinishAt == undefined ? new Date(0) : subscriptionFinishAt,
        error_message: errMsg == undefined ? '' : errMsg
    }
    paymentHistoyRepo.save(data)
}