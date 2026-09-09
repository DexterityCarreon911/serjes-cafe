export const seed = {
  products: [
    { id: 1, name: "Americano", category: "Hot Coffee", price: 110, cost: 45, stock: 40, visibleInMenu: true },
    { id: 2, name: "Cafe Latte", category: "Hot Coffee", price: 140, cost: 60, stock: 32, visibleInMenu: true },
    { id: 3, name: "Cappuccino", category: "Hot Coffee", price: 145, cost: 62, stock: 28, visibleInMenu: true },
    { id: 4, name: "Mocha", category: "Hot Coffee", price: 155, cost: 70, stock: 25, visibleInMenu: true },
    { id: 5, name: "Espresso", category: "Hot Coffee", price: 100, cost: 40, stock: 35, visibleInMenu: true },
    { id: 6, name: "Iced Coffee", category: "Iced Coffee", price: 130, cost: 55, stock: 30, visibleInMenu: true },
    { id: 7, name: "Milk Tea", category: "Iced Coffee", price: 120, cost: 50, stock: 25, visibleInMenu: true },
    { id: 8, name: "Iced Latte", category: "Iced Coffee", price: 150, cost: 65, stock: 22, visibleInMenu: true },
    { id: 9, name: "Iced Mocha", category: "Iced Coffee", price: 160, cost: 72, stock: 20, visibleInMenu: true },
    { id: 10, name: "Coffee Frappe", category: "Frappe", price: 180, cost: 85, stock: 18, visibleInMenu: true },
    { id: 11, name: "Chocolate Frappe", category: "Frappe", price: 170, cost: 80, stock: 18, visibleInMenu: true },
    { id: 12, name: "Oreo Frappe", category: "Frappe", price: 190, cost: 90, stock: 16, visibleInMenu: true },
    { id: 13, name: "Solo", category: "Solo", price: 60, cost: 25, stock: 50, visibleInMenu: true },
    { id: 14, name: "Beef Solo", category: "Solo", price: 85, cost: 35, stock: 35, visibleInMenu: true },
    { id: 15, name: "Chicken Solo", category: "Solo", price: 80, cost: 32, stock: 38, visibleInMenu: true },
    { id: 16, name: "Rice Meal", category: "Rice Meal", price: 120, cost: 45, stock: 25, visibleInMenu: false },
    { id: 17, name: "Chicken Rice Meal", category: "Rice Meal", price: 150, cost: 60, stock: 20, visibleInMenu: false },
    { id: 18, name: "Pork Rice Meal", category: "Rice Meal", price: 160, cost: 65, stock: 18, visibleInMenu: false },
    { id: 19, name: "Croissant", category: "Extras", price: 95, cost: 38, stock: 20, visibleInMenu: false }
  ],
  calendarNotes: {},
  sales: [
    { id: 1001, date: "2026-08-18", time: "08:20", staff: "staff1", product: "Americano", qty: 2, total: 220, cost: 90 },
    { id: 1002, date: "2026-08-18", time: "09:10", staff: "staff2", product: "Cafe Latte", qty: 1, total: 140, cost: 60 },
    { id: 1003, date: "2026-08-18", time: "10:45", staff: "staff3", product: "Croissant", qty: 2, total: 190, cost: 76 },
    { id: 1004, date: "2026-08-18", time: "12:15", staff: "staff4", product: "Mocha", qty: 1, total: 155, cost: 70 },
    { id: 1005, date: "2026-08-18", time: "13:40", staff: "staff1", product: "Cappuccino", qty: 2, total: 290, cost: 124 },
    { id: 1006, date: "2026-08-18", time: "15:05", staff: "staff2", product: "Americano", qty: 1, total: 110, cost: 45 }
  ],
  purchaseOrders: [
    { id: 5001, productId: 1, product: "Americano", quantity: 20, unitCost: 45, totalCost: 900, staff: "staff1", date: "2026-08-18", status: "Approved" },
    { id: 5002, productId: 5, product: "Croissant", quantity: 10, unitCost: 38, totalCost: 380, staff: "staff2", date: "2026-08-18", status: "Pending" },
    { id: 5003, productId: 3, product: "Cappuccino", quantity: 15, unitCost: 62, totalCost: 930, staff: "staff3", date: "2026-08-19", status: "Received" }
  ],
  staff: [
    { id: 1, username: "admin", password: "admin123", role: "admin" },
    { id: 2, username: "staff1", password: "staff123", role: "staff" },
    { id: 3, username: "staff2", password: "staff123", role: "staff" },
    { id: 4, username: "staff3", password: "staff123", role: "staff" },
    { id: 5, username: "staff4", password: "staff123", role: "staff" }
  ]
};

export const menuCategories = ["Hot Coffee", "Iced Coffee", "Frappe", "Solo", "Rice Meal", "Extras"];
export const purchaseOrderStatusOptions = ["Draft", "Pending", "Approved", "Received", "Cancelled"];

export const defaultMenuProducts = seed.products.map((p) => ({ ...p }));