// imports
import Order from "../../models/table orders/orders-model.js"
import OrderItem from "../../models/table orders/items-model.js"

import Product from "../../models/product/product-model.js";

export const createOrder = async (req, res) => {
  try {
    const { table_id, umkm_id } = req.params;
    const { items, customer, payment } = req.body;

    if (!customer || !table_id || !umkm_id || !items || items.length === 0) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    // 1. Hitung total amount
    let totalAmount = 0;
    const productDetails = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(404).json({ message: `Produk ID ${item.product_id} tidak ditemukan` });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      productDetails.push({
        product_id: product._id,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }

    // 2. Buat order baru
    const order = await Order.create({
      table: table_id,
      umkm_id: umkm_id,
      status: "pending",
      customer: customer,
      payment_type: payment,
      totalAmount: totalAmount
    });

    // 3. Buat order_items baru
    const orderItemsData = productDetails.map((detail) => ({
      order: order._id, // Menyimpan referensi ke Order
      product: detail.product_id,
      quantity: detail.quantity,
      price: detail.price,
      total: detail.total
    }));

    // Simpan orderItems yang baru
    const orderItems = await OrderItem.insertMany(orderItemsData);

    // Tambahkan referensi orderItems ke dalam order setelah disimpan
    order.orderItems = orderItems.map(item => item._id);
    await order.save();

    res.status(201).json({
      message: "Order berhasil dibuat",
      orderId: order._id,
      orderItems: orderItems,
      umkm_id: umkm_id,
      table_id: table_id,
      customer: customer
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};



export const getOrdersByUmkmId = async (req, res) => {
    try {
        const umkm_id = req.user.umkm_id;
        const orders = await Order.find({ umkm_id: umkm_id })
        .populate({
            path: 'orderItems',
            model: OrderItem,
            populate: {
                path: 'product',
                model: Product
            }
        })
        .populate({
          path: 'table',
          model: 'Table', // Pastikan nama modelnya benar sesuai definisi mongoose-mu
          select: 'number' // Ambil hanya field `number`
        });

         if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Tidak ada order ditemukan untuk UMKM ini" });
    }


    
    // Format response dengan menambahkan detail item ke dalam order
    const response = orders.map((order) => ({
      table_number: order.table?.number || null,
      tabel: order.table,
      order_id: order._id,
      status: order.status,
      customer: order.customer,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      payment_type: order.payment_type,
      items: order.orderItems.map((item) => ({
        product_id: item?.product?._id,
        product_name: item?.product?.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }))
    }));

        res.status(200).json({ message: "Orders berhasil diambil", orders: response });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}


export const updateOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const umkm_id = req.user.umkm_id; // dari token verify
    const { status, payment_type } = req.body;

    // Validasi status
    const validStatuses = ["pending", "processing", "completed", "cancelled"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Status yang diberikan tidak valid" });
    }

    // Validasi payment_type (jika dikirim)
    const validPayments = ["cash", "qris"];
    if (payment_type && !validPayments.includes(payment_type)) {
      return res.status(400).json({ message: "Tipe pembayaran tidak valid" });
    }

    // Cari order
    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }

    // Cek kepemilikan order
    if (order.umkm_id.toString() !== umkm_id.toString()) {
      return res.status(403).json({ message: "Tidak memiliki izin untuk mengubah order ini" });
    }

    // Update jika ada
    if (status) order.status = status;
    if (payment_type) order.payment_type = payment_type;

    await order.save();

    res.status(200).json({ message: "Order berhasil diperbarui", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const getTodayIncomeTable = async (req, res) => {
  try {
    const umkm_id = req.user.umkm_id;
    if (!umkm_id) return res.status(400).json({ message: "UMKM ID tidak ditemukan" });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      umkm_id,
      status: "completed",
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const total = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({ totalIncomeToday: total });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const getIncomeByDateTable = async (req, res) => {
  try {
    const umkm_id = req.user.umkm_id;
    const { date } = req.query;

    if (!umkm_id || !date) {
      return res.status(400).json({ message: "UMKM ID dan tanggal diperlukan." });
    }

    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    const orders = await Order.find({
      umkm_id,
      status: "completed",
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const total = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({ totalIncome: total, date });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

export const getOrderTableById = async (req, res) => {
  try {
    const { id } = req.params;
    const umkm_id = req.user.umkm_id;

    if (!umkm_id) {
      return res.status(400).json({ message: "UMKM ID tidak ditemukan" });
    }

    const order = await Order.findOne({ _id: id, umkm_id })
      .populate({
        path: 'orderItems',
        model: OrderItem,
        populate: {
          path: 'product',
          model: Product
        }
      })
      .populate({
        path: 'table',
        model: 'Table', // Pastikan nama modelnya benar sesuai definisi mongoose-mu
        select: 'number' // Ambil hanya field `number`
      });

    if (!order) {
      return res.status(404).json({ message: "Order tidak ditemukan untuk UMKM ini" });
    }

    const response = {
      table_number: order.table?.number || null, // Gunakan optional chaining untuk menghindari error jika null
      order_id: order._id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      customer: order.customer,
      payment_type: order.payment_type,
      items: order.orderItems.map((item) => ({
        product_id: item?.product?._id,
        product_name: item?.product?.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }))
    };

    res.status(200).json({
      message: "Detail order berhasil diambil",
      order: response
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil detail order", error: error.message });
  }
};
