import Layout from "../components/Layout";
import { useContext, useEffect, useState } from "react";
import { ProductsContext } from "../components/ProductsContext";
import React from "react";

export default function CheckoutPage() {
  const { selectedProducts, setSelectedProducts } = useContext(ProductsContext);
  const [productsInfos, setProductsInfos] = useState([]);

  useEffect(() => {
    const uniqIds = [...new Set(selectedProducts)];
    fetch("/api/products?ids=" + uniqIds.join(","))
      .then((response) => response.json())
      .then((json) => setProductsInfos(json));
  }, [selectedProducts]);

  function moreOfThisProduct(id) {
    setSelectedProducts((prev) => [...prev, id]);
  }
  function lessOfThisProduct(id) {
    const pos = selectedProducts.indexOf(id);
    if (pos !== -1) {
      setSelectedProducts((prev) => {
        return prev.filter((value, index) => index !== pos);
      });
    }
  }

  const deliveryPrice = 5;
  let subtotal = 0;
  if (selectedProducts?.length) {
    for (let id of selectedProducts) {
      const price = productsInfos.find((p) => p._id === id)?.price || 0;
      subtotal += price;
    }
  }
  const total = subtotal + deliveryPrice;

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    address: "",
    city: "",
  });

  const [isValid, setIsValid] = useState(false); // State to track form validity

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Validation function to check if all required fields are filled out
  const isFormValid = () => {
    const { email, name, address, city } = formData;
    return (
      email.trim() !== "" &&
      name.trim() !== "" &&
      address.trim() !== "" &&
      city.trim() !== ""
    );
  };

  // Update isValid state whenever the form data changes
  React.useEffect(() => {
    setIsValid(isFormValid());
  }, [formData]);


  const isEmailValid = (email) => {
    // Regular expression pattern for a valid email address
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailPattern.test(email);
  };


  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (isValid && isEmailValid(formData.email)) {
      // Form is valid, proceed with form submission
      e.target.submit(); // Submit the form
    } else {
      // Form is not valid, display an error message or prevent submission
      alert("Please fill out all required fields properly.");
    }
  };

  return (
    <Layout>
      {!productsInfos.length && <div>no products in your shopping cart</div>}
      {productsInfos.length &&
        productsInfos.map((productInfo) => {
          const amount = selectedProducts.filter(
            (id) => id === productInfo._id
          ).length;
          if (amount === 0) return;
          return (
            <div className="flex mb-5 items-center" key={productInfo._id}>
              <div
                className="bg-gray-100 p-3 rounded-xl shrink-0"
                style={{ boxShadow: "inset 1px 0px 10px 10px rgba(0,0,0,0.1)" }}
              >
                <img className="w-24" src={productInfo.picture} alt="" />
              </div>
              <div className="pl-4 items-center">
                <h3 className="font-bold text-lg">{productInfo.name}</h3>
                {/* <p className="text-sm leading-4 text-gray-500">
                  {productInfo.description}
                </p> */}
                <div className="flex mt-1">
                  <div className="grow font-bold px-2">${productInfo.price}</div>
                  <div>
                    <button
                      onClick={() => lessOfThisProduct(productInfo._id)}
                      className="border border-emerald-500 px-2 rounded-lg text-emerald-500"
                    >
                      -
                    </button>
                    <span className="px-2">
                      {
                        selectedProducts.filter((id) => id === productInfo._id)
                          .length
                      }
                    </span>
                    <button
                      onClick={() => moreOfThisProduct(productInfo._id)}
                      className="bg-emerald-500 px-2 rounded-lg text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      <form action="/api/checkout" method="POST" onSubmit={handleFormSubmit}>
        <div className="mt-8">
          <input
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="bg-gray-100 w-full rounded-lg px-4 py-2 mb-2"
            type="text"
            placeholder="Street address, number"
          />
          <input
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="bg-gray-100 w-full rounded-lg px-4 py-2 mb-2"
            type="text"
            placeholder="City and postal code"
          />
          <input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="bg-gray-100 w-full rounded-lg px-4 py-2 mb-2"
            type="text"
            placeholder="Your name"
          />
          <input
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="bg-gray-100 w-full rounded-lg px-4 py-2 mb-2"
            type="email"
            placeholder="Email address"
          />
        </div>
        <div className="mt-8">
          <div className="flex my-3">
            <h3 className="grow font-bold text-gray-400">Subtotal:</h3>
            <h3 className="font-bold">${subtotal}</h3>
          </div>
          <div className="flex my-3">
            <h3 className="grow font-bold text-gray-400">Delivery:</h3>
            <h3 className="font-bold">${deliveryPrice}</h3>
          </div>
          <div className="flex my-3 border-t pt-3 border-dashed border-emerald-500">
            <h3 className="grow font-bold text-gray-400">Total:</h3>
            <h3 className="font-bold">${total}</h3>
          </div>
        </div>
        <input
          type="hidden"
          name="products"
          value={selectedProducts.join(",")}
        />
        <button
          type="submit"
          className="bg-emerald-500 px-5 py-2 rounded-xl font-bold text-white w-full my-4 shadow-emerald-300 shadow-lg"
        >
          Pay ${total}
        </button>
      </form>
    </Layout>
  );
}
