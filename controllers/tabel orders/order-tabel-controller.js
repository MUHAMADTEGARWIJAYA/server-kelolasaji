import moment from 'moment-timezone';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import Order from "../../models/table orders/orders-model.js"
import OrderItem from "../../models/table orders/items-model.js"
import { getIO } from "../../service/socket.js";
import Product from "../../models/product/product-model.js";

export const createOrder = async (req, res) => {
  try {
    const { table_id } = req.params;
    const { items, customer, payment, order_type } = req.body;
    const umkm_id = req.params.umkm_id || req.user?.umkm_id;
    const status = req.body.status;
    if (!customer || !umkm_id || !items || items.length === 0 || !order_type) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    if (!["dine-in", "takeaway"].includes(order_type)) {
      return res.status(400).json({ message: "Tipe order tidak valid" });
    }

    // 1. Hitung total amount & total with tax
    let totalAmount = 0;
    let totalPPN = 0;
    let totalWithTax = 0;
    const productDetails = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(404).json({ message: `Produk ID ${item.product_id} tidak ditemukan` });
      }

      const itemTotal = product.price * item.quantity;
      const itemPPN = itemTotal * 0.11; // 11% PPN Indonesia 2025
      const itemTotalWithTax = itemTotal + itemPPN;

      totalAmount += itemTotal;
      totalPPN += itemPPN;
      totalWithTax += itemTotalWithTax;
   

      productDetails.push({
        product_id: product._id,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
        ppn: itemPPN,
        total_with_ppn: itemTotalWithTax
      });
    }

    // 2. Buat order baru
    const order = await Order.create({
      order_type: order_type,
      table: order_type === "dine-in" ? table_id : null,
      umkm_id: umkm_id,
      status: status,
      customer: customer,
      payment_type: payment,
      totalAmount: totalAmount,   
      totalPPN: totalPPN,        // Sebelum PPN
      totalWithTax: totalWithTax        // Setelah PPN
    });

    // 3. Buat order_items baru
    const orderItemsData = productDetails.map((detail) => ({
      order: order._id,
      product: detail.product_id,
      quantity: detail.quantity,
      price: detail.price,
      total: detail.total,
      ppn: detail.ppn,
      total_with_ppn: detail.total_with_ppn
    }));

    // Simpan orderItems
    const orderItems = await OrderItem.insertMany(orderItemsData);

    // Tambahkan referensi orderItems ke order
    order.orderItems = orderItems.map(item => item._id);
    await order.save();

    // Emit via Socket.IO
    const io = getIO();
    io.emit('newOrder', {
      message: "New order created",
      orderId: order._id,
      orderItems: orderItems,
      umkm_id: umkm_id,
      table_id: order.table,
      customer: customer
    });

    res.status(201).json({
      message: "Order berhasil dibuat",
      orderId: order._id,
      orderItems: orderItems,
      totalAmount: totalAmount,
      totalPPN: totalPPN,  
      totalWithTax: totalWithTax,
      umkm_id: umkm_id,
      table_id: order.table,
      customer: customer,
      order_type: order_type
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
      totalWithTax: order.totalWithTax,
      totalPPN: order.totalPPN,
      order_type: order.order_type,
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


export const getOrdersByDate = async (req, res) => {
  try {
    const umkm_id = req.user.umkm_id;
    const { startDate, endDate } = req.query;

    // Siapkan filter dasar
    let filter = { umkm_id };


    const offsetInMs = 7 * 60 * 60 * 1000; // 7 jam dalam milidetik

    const adjustedStart = new Date(new Date(startDate).getTime() - offsetInMs);
    const adjustedEnd = new Date(new Date(endDate).getTime() - offsetInMs);

    filter.createdAt = {
      $gte: adjustedStart,
      $lte: adjustedEnd,
    };
    // Tambahkan filter berdasarkan tanggal jika ada
   

    const orders = await Order.find(filter)
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
        model: 'Table',
        select: 'number'
      });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Tidak ada order ditemukan untuk UMKM ini" });
    }

    const response = orders.map((order) => ({
      table_number: order.table?.number || null,
      tabel: order.table,
      order_id: order._id,
      status: order.status,
      customer: order.customer,
      totalAmount: order.totalAmount,
      totalWithTax: order.totalWithTax,
      totalPPN: order.totalPPN,
      order_type: order.order_type,
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
};



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

    const io = getIO();
    console.log("masuk update")
    io.emit('orderUpdated', {
      message: "Order updated",
      orderId: order._id,
      status: order.status,
      payment_type: order.payment_type,
      order: order // optional: bisa kirim semua data order langsung
    });

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

    const totalAmount = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalWithTax = orders.reduce((sum, order) => sum + (order.totalWithTax || 0), 0);
    const totalPPN = orders.reduce((sum, order) => {
      return sum + ((order.totalWithTax || 0) - (order.totalAmount || 0));
    }, 0);

    res.json({
      totalIncomeTodayBeforeTax: totalAmount,
      totalIncomeTodayAfterTax: totalWithTax,
      totalPPNToday: totalPPN
    });

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
export const getOrderByDailyForWeek = async (req, res) => {
  try {
    const umkm_id = req.user.umkm_id;
    if (!umkm_id) {
      return res.status(400).json({ message: "UMKM ID tidak ditemukan" });
    }

    const days = [];

    // Loop 7 hari ke belakang
    for (let i = 6; i >= 0; i--) {
      const current = moment().tz('Asia/Jakarta').subtract(i, 'days');
      const start = current.clone().startOf('day').toDate();
      const end = current.clone().endOf('day').toDate();

      const orders = await Order.find({
        umkm_id,
        status: 'completed',
        createdAt: { $gte: start, $lte: end },
      }).select('_id totalAmount createdAt customer');

      const totalIncome = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      const orderDetails = orders.map(order => ({
        order_id: order._id,
        totalAmount: order.totalAmount,
        customer: order.customer,
        createdAt: order.createdAt,
      }));

      days.push({
        date: current.format('YYYY-MM-DD'), // atau tampilkan lokal misalnya: current.format('dddd, D MMM'),
        totalIncome,
        orders: orderDetails,
      });
    }

    res.status(200).json({
      message: "Penghasilan harian selama 7 hari berhasil diambil",
      data: days,
    });

  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil penghasilan harian",
      error: error.message,
    });
  }
};


export const getOrderByDailyForBiweekly = async (req, res) => {
  try {
    const umkm_id = req.user.umkm_id;
    if (!umkm_id) {
      return res.status(400).json({ message: "UMKM ID tidak ditemukan" });
    }

    const days = [];

    // Loop 14 hari ke belakang
    for (let i = 13; i >= 0; i--) {
      const current = moment().tz('Asia/Jakarta').subtract(i, 'days');
      const start = current.clone().startOf('day').toDate();
      const end = current.clone().endOf('day').toDate();

      const orders = await Order.find({
        umkm_id,
        status: 'completed',
        createdAt: { $gte: start, $lte: end },
      }).select('_id totalAmount createdAt customer');

      const totalIncome = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      const orderDetails = orders.map(order => ({
        order_id: order._id,
        totalAmount: order.totalAmount,
        customer: order.customer,
        createdAt: order.createdAt,
      }));

      days.push({
        date: current.format('YYYY-MM-DD'),
        totalIncome,
        orders: orderDetails,
      });
    }

    res.status(200).json({
      message: "Penghasilan harian selama 14 hari berhasil diambil",
      data: days,
    });

  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil penghasilan harian 14 hari",
      error: error.message,
    });
  }
};

export const getOrderByDailyForMonthly = async (req, res) => {
  try {
    const umkm_id = req.user.umkm_id;
    if (!umkm_id) {
      return res.status(400).json({ message: "UMKM ID tidak ditemukan" });
    }

    const days = [];

    // Loop 30 hari ke belakang
    for (let i = 29; i >= 0; i--) {
      const current = moment().tz('Asia/Jakarta').subtract(i, 'days');
      const start = current.clone().startOf('day').toDate();
      const end = current.clone().endOf('day').toDate();

      const orders = await Order.find({
        umkm_id,
        status: 'completed',
        createdAt: { $gte: start, $lte: end },
      }).select('_id totalAmount createdAt customer');

      const totalIncome = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      const orderDetails = orders.map(order => ({
        order_id: order._id,
        totalAmount: order.totalAmount,
        customer: order.customer,
        createdAt: order.createdAt,
      }));

      days.push({
        date: current.format('YYYY-MM-DD'),
        totalIncome,
        orders: orderDetails,
      });
    }

    res.status(200).json({
      message: "Penghasilan harian selama 30 hari berhasil diambil",
      data: days,
    });

  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil penghasilan harian 30 hari",
      error: error.message,
    });
  }
};

export const getOrderByDailyForCurrentMonth = async (req, res) => {
  try {
    const umkm_id = req.user.umkm_id;
    if (!umkm_id) {
      return res.status(400).json({ message: "UMKM ID tidak ditemukan" });
    }

    const days = [];
    const now = moment().tz('Asia/Jakarta');
    const startOfMonth = now.clone().startOf('month');
    const daysInMonth = now.daysInMonth();

    // Loop dari awal bulan hingga hari ini
    for (let i = 0; i < daysInMonth; i++) {
      const current = startOfMonth.clone().add(i, 'days');
      
      // Skip hari yang belum terjadi di bulan ini
      if (current.isAfter(now, 'day')) continue;

      const start = current.clone().startOf('day').toDate();
      const end = current.clone().endOf('day').toDate();

      const orders = await Order.find({
        umkm_id,
        status: 'completed',
        createdAt: { $gte: start, $lte: end },
      }).select('_id totalAmount createdAt customer');

      const totalIncome = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      const orderDetails = orders.map(order => ({
        order_id: order._id,
        totalAmount: order.totalAmount,
        customer: order.customer,
        createdAt: order.createdAt,
      }));

      days.push({
        date: current.format('YYYY-MM-DD'),
        totalIncome,
        orders: orderDetails,
      });
    }

    res.status(200).json({
      message: "Penghasilan harian bulan ini berhasil diambil",
      data: days,
    });

  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil penghasilan harian bulan ini",
      error: error.message,
    });
  }
};