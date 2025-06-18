import { startOfWeek, endOfWeek } from "date-fns";
import ordersCashier from "../../models/orders cashier/orders-cashier-model.js";
import itemsOrderCashier from "../../models/orders cashier/items-order-cashier-model.js";
import Product from "../../models/product/product-model.js";
import { getIO } from "../../service/socket.js";
export const createOrderCashier = async (req, res) => {
        try {
        const  umkm_id  = req.user.umkm_id; 
        const { items, customer, payment } = req.body;

        if ( !items || items.length === 0){
            return res.status(400).json({ message: "Data tidak lengkap" });
        }

        if (!umkm_id) {
            return res.status(400).json({ message: "UMKM ID tidak hahah ditemukan" });
        }

        
        let totalAmount = 0
        const productDetails = []

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

        const order = await ordersCashier.create({
              umkm_id: umkm_id,
               status: "completed",
               customer: customer,
               payment_type: payment,
               totalAmount: totalAmount
            });

         const orderItemsData = productDetails.map((detail) => ({
            orderCashier: order._id, // Menyimpan referensi ke Order
            product: detail.product_id,
            quantity: detail.quantity,
            price: detail.price,
            total: detail.total
            }));

            const orderItems = await itemsOrderCashier.insertMany(orderItemsData);
            
            // Tambahkan referensi orderItems ke dalam order setelah disimpan
            order.orderItems = orderItems.map(item => item._id);
            await order.save();

            const io = getIO();
            console.log('Emitting newOrderCashier event...');
            io.emit('newOrderCashier', {
              message: "New order created",
              orderId: order._id,
              orderItems: orderItems,
              umkm_id: umkm_id,
              customer: customer,
              payment_type: payment
            });

             res.status(201).json({
                message: "Order berhasil dibuat",
                orderId: order._id,
                orderItems: orderItems,
                umkm_id: umkm_id,
                customer: customer,
                payment_type: payment
                });


        } catch (error) {
            return res.status(500).json({ message: "Internal server error", error: error.message });
        }
}

export const updateOrderCashierStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status } = req.body;
    const umkm_id = req.user.umkm_id;

    if (!order_id || !status) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    if (!umkm_id) {
      return res.status(400).json({ message: "UMKM ID tidak ditemukan" });
    }

    const order = await ordersCashier.findById(order_id);


    if (!order) {
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }
    

    order.status = status;
    await order.save();
  

    res.status(200).json({
      message: "Status order berhasil diperbarui",
      updatedOrder: order
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui status order", error: error.message });
    console.error(error);
  }
};




export const getOrdersCashierByUmkm = async (req, res) => {
  try {
    const umkm_id = req.user.umkm_id;

    if (!umkm_id) {
      return res.status(400).json({ message: "UMKM ID tidak ditemukan" });
    }


   
    const orders = await ordersCashier.find({ umkm_id }).populate({
      path: "orderItems",
      model: itemsOrderCashier,
      populate: {
        path: "product",
        model: Product
      }
    })

      if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Tidak ada order ditemukan untuk UMKM ini" });
    }

    const response = orders.map((order) => ({
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
    }));

    res.status(200).json({
      message: "Data order berhasil diambil",
      orders: response
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data order", error: error.message });
  }
};


export const getTodayIncome = async (req, res) => {
  try {
    const umkm_id = req.user.umkm_id;
    if (!umkm_id) return res.status(400).json({ message: "UMKM ID tidak ditemukan" });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await ordersCashier.find({
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


export const getIncomeByDate = async (req, res) => {
  try {
    const umkm_id = req.user.umkm_id;
    const { date } = req.query;

    if (!umkm_id || !date) {
      return res.status(400).json({ message: "UMKM ID dan tanggal diperlukan." });
    }

    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    const orders = await ordersCashier.find({
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

export const getOrderCashierById = async (req, res) => {
  try {
    const { id } = req.params;
    const umkm_id = req.user.umkm_id;

    if (!umkm_id) {
      return res.status(400).json({ message: "UMKM ID tidak ditemukan" });
    }

    const order = await ordersCashier.findOne({ _id: id, umkm_id }).populate({
      path: "orderItems",
      model: itemsOrderCashier,
      populate: {
        path: "product",
        model: Product
      }
    });

    if (!order) {
      return res.status(404).json({ message: "Order tidak ditemukan untuk UMKM ini" });
    }

    const response = {
      order_id: order._id,
      status: order.status,
      totalAmount: order.totalAmount,
      customer: order.customer,
      createdAt: order.createdAt,
      payment_type: order.payment_type,
      items: order.orderItems.map((item) => ({
        product_id: item.product._id,
        product_name: item.product.name,
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

export const getOrderCashierByWeekly = async (req, res) => {
  try {
    const umkm_id = req.user.umkm_id;

    if (!umkm_id) {
      return res.status(400).json({ message: "UMKM ID tidak ditemukan" });
    }

    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endDate ? new Date(endDate) : endOfWeek(new Date(), { weekStartsOn: 1 });

    const orders = await ordersCashier.find({
      umkm_id: umkm_id,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }).populate({
      path: "orderItems",
      model: itemsOrderCashier,
      populate: {
        path: "product",
        model: Product
      }
    });

    const response = orders.map((order) => ({
      order_id: order._id,
      status: order.status,
      totalAmount: order.totalAmount,
      customer: order.customer,
      createdAt: order.createdAt,
      items: order.orderItems.map((item) => ({
        product_id: item.product._id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }))
    }));

    res.status(200).json({
      message: "Data order mingguan berhasil diambil",
      orders: response,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data order mingguan", error: error.message });
  }
};