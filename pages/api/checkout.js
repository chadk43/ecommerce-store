import {initMongoose} from "../../lib/mongoose";
import Product from "../../models/Product";
import Order from "../../models/Order";
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req,res) {
  await initMongoose();

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const {email,name,address,city} = req.body;

  if (!email || !name || !address || !city) {
    res.status(400).json({ error: 'Please fill out all required fields.' });
    return;
  }

  const productsIds = req.body.products.split(",");
  const uniqIds = [...new Set(productsIds)];
  const products = await Product.find({_id:{$in:uniqIds}}).exec();

  let line_items = [];
  for (let productId of uniqIds) {
    const quantity = productsIds.filter(id => id === productId).length;
    const product = products.find(p => p._id.toString() === productId);
    line_items.push({
      quantity,
      price_data: {
        currency: 'USD',
        product_data: {name:product.name},
        unit_amount: (product.price) * 100,
      },
    });
  }


  const deliveryFeeAmount = 500; // $5 in cents
  line_items.push({
    quantity: 1, // You can adjust the quantity if needed
    price_data: {
      currency: 'USD',
      product_data: { name: 'Delivery Fee' }, // Customize the name if needed
      unit_amount: deliveryFeeAmount,
    },
  });


  const order = await Order.create({
    products:line_items,
    name,
    email,
    address,
    city,
    paid:0,
  });

  const session = await stripe.checkout.sessions.create({
    line_items: line_items,
    mode: 'payment',
    customer_email: email,
    success_url: `${req.headers.origin}/?success=true`,
    cancel_url: `${req.headers.origin}/?canceled=true`,
    
    metadata: {orderId:order._id.toString()},
  });

  res.redirect(303, session.url);
}

// import { initMongoose } from "../../lib/mongoose";
// import Product from "../../models/Product";
// import Order from "../../models/Order";
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// export default async function handler(req, res) {
//   await initMongoose();

//   if (req.method !== 'POST') {
//     res.status(405).json({ error: 'Method Not Allowed' });
//     return;
//   }

//   const { email, name, address, city} = req.body;

//   // Validate email format using a regular expression
//   const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
//   if (!emailRegex.test(email)) {
//     res.status(400).json({ error: 'Please enter a valid email address.' });
//     return;
//   }

//   // Check if all required fields are filled out
//   if (!email || !name || !address || !city) {
//     res.status(400).json({ error: 'Please fill out all required fields.' });
//     return;
//   }

//   // Now, you can proceed with creating the Stripe Checkout session and handling the payment
//   const productsIds = products.split(",");
//   const uniqIds = [...new Set(productsIds)];
//   const products = await Product.find({ _id: { $in: uniqIds } }).exec();

//   let line_items = [];
//   let totalAmount = 0;

//   for (let productId of uniqIds) {
//     const quantity = productsIds.filter(id => id === productId).length;
//     const product = products.find(p => p._id.toString() === productId);
//     const unitAmount = (product.price) * 100; // Remove the +5 to the unit amount
//     totalAmount += unitAmount * quantity;
//     line_items.push({
//       quantity,
//       price_data: {
//         currency: 'USD',
//         product_data: { name: product.name },
//         unit_amount,
//       },
//     });
//   }

//   // Add an additional $5 (500 cents) to the total amount
//   totalAmount += 500;

//   const order = await Order.create({
//     products: line_items,
//     name,
//     email,
//     address,
//     city,
//     paid: 0,
//   });

//   try {
//     const session = await stripe.checkout.sessions.create({
//       line_items: line_items,
//       mode: 'payment',
//       customer_email: email,
//       success_url: `${req.headers.origin}/?success=true`,
//       cancel_url: `${req.headers.origin}/?canceled=true`,
//       payment_intent_data: {
//         amount: totalAmount,
//         currency: 'usd',
//         locale: 'en',
//       },
//       metadata: { orderId: order._id.toString() },
//     });

//     res.status(200).json({ sessionId: session.id });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'An error occurred while creating the Stripe Checkout session.' });
//   }
// }
