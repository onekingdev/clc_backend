require("dotenv").config();
import { PaymentHistory } from "../entities/PaymentHistory";
import { Users } from "../entities/Users";
import { connect } from "../config";
export const newPaymentOperateEvent = async(email, action, amount, amount_captured, payment_id, customer_id, subscriptionFinishAt, errMsg='') => {
    const connection = await connect();

    const paymentHistoyRepo = connection.getRepository(PaymentHistory);
    const userRepo = connection.getRepository(Users);

    let user = await userRepo.findOne({ email: email });
    
    const data = {
        user_id: user.id,
        email: email,
        createdAt: new Date(),
        action: action,
        amount: amount,
        amount_captured: amount_captured,
        payment_id: payment_id,
        customer_id: customer_id,
        subscriptionFinishAt: subscriptionFinishAt,
        error_message: errMsg
    }
    paymentHistoyRepo.save(data)
}