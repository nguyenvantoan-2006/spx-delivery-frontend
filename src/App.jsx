import React, { useMemo, useState, useEffect, useRef } from "react";
import { 
  Package, Truck, ClipboardList, Search, Printer, 
  Menu, X, CheckCircle, Eye, Plus, Edit, Trash2, XCircle, QrCode, Scan,
  User, Lock, LogOut
} from "lucide-react";

// --- Custom UI Components ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>{children}</div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-4 md:p-6 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, size = "md", className = "", variant = "primary", ...props }) => {
  const sizeClasses = size === "sm" ? "px-3 py-1.5 text-xs md:text-sm" : "px-4 py-2 text-sm";
  const variantClasses = variant === "primary" 
    ? "bg-orange-500 text-white hover:bg-orange-600 shadow-sm" 
    : variant === "secondary"
    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
    : variant === "danger"
    ? "bg-red-50 text-red-600 hover:bg-red-100"
    : variant === "dark"
    ? "bg-slate-800 text-white hover:bg-slate-900 shadow-sm"
    : variant === "purple"
    ? "bg-purple-600 text-white hover:bg-purple-700 shadow-purple-500/30 shadow-lg"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 active:scale-95 ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Main Application ---
export default function App() {
  // --- States Đăng nhập ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [tab, setTab] = useState("orders");
  const [search, setSearch] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  // States cho các Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [printingOrder, setPrintingOrder] = useState(null);
  
  // States cho tính năng Quét mã vạch (Scanner)
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const scannerInputRef = useRef(null);

  // 1. Dữ liệu Đơn hàng
  const [orders, setOrders] = useState([
    { 
      id: "SPX0019283", status: "Chờ xử lý", customer: "Nguyễn Văn A", phone: "0901234567", address: "123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM", items: 2, total: 300000,
      productList: [{ name: "Áo thun nam Basic", qty: 2, price: 150000 }], note: "Giao giờ hành chính"
    },
    { 
      id: "SPX0028475", status: "Đã giao", customer: "Trần Thị B", phone: "0987654321", address: "Số 5 ngõ 120 Cầu Giấy, Hà Nội", items: 1, total: 450000,
      productList: [{ name: "Giày Sneaker trắng size 42", qty: 1, price: 450000 }], note: "Cho xem hàng"
    },
    { 
      id: "SPX0037564", status: "Đang giao", customer: "Lê Văn C", phone: "0912223344", address: "45 Hải Phòng, Hải Châu, Đà Nẵng", items: 3, total: 120000,
      productList: [{ name: "Tất cổ ngắn nam/nữ", qty: 3, price: 40000 }], note: "Không cho xem hàng"
    },
    { 
      id: "SPX0041122", status: "Chờ xử lý", customer: "Phạm Thị D", phone: "0933445566", address: "12 Nguyễn Trãi, Ninh Kiều, Cần Thơ", items: 1, total: 299000,
      productList: [{ name: "Balo thời trang", qty: 1, price: 299000 }], note: ""
    },
  ]);

  // 2. Dữ liệu Kho hàng
  const [inventory, setInventory] = useState([
    { id: "SKU001", name: "Áo thun nam Basic", stock: 150, price: 150000 },
    { id: "SKU002", name: "Giày Sneaker trắng size 42", stock: 5, price: 450000 },
    { id: "SKU003", name: "Tất cổ ngắn nam/nữ", stock: 0, price: 40000 },
    { id: "SKU004", name: "Balo thời trang", stock: 45, price: 299000 },
  ]);

  const tabs = [
    { id: "orders", label: "Đơn hàng", icon: ClipboardList },
    { id: "inventory", label: "Kho hàng", icon: Package },
    { id: "logistics", label: "Vận chuyển", icon: Truck },
  ];

  // --- Logic Helpers ---
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    showToast(`Đã cập nhật đơn ${orderId} thành "${newStatus}"`);
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case "Chờ xử lý": return "text-yellow-700 bg-yellow-100 border-yellow-200";
      case "Đã xuất kho": return "text-purple-700 bg-purple-100 border-purple-200";
      case "Đang giao": return "text-blue-700 bg-blue-100 border-blue-200";
      case "Đã giao": return "text-green-700 bg-green-100 border-green-200";
      case "Đã hủy": return "text-red-700 bg-red-100 border-red-200";
      default: return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const getInventoryStatusColor = (stock) => {
    if (stock === 0) return "text-red-700 bg-red-100 border-red-200";
    if (stock <= 10) return "text-orange-700 bg-orange-100 border-orange-200";
    return "text-green-700 bg-green-100 border-green-200";
  };

  // --- Filters ---
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase()));
  }, [orders, search]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((i) => i.name.toLowerCase().includes(inventorySearch.toLowerCase()) || i.id.toLowerCase().includes(inventorySearch.toLowerCase()));
  }, [inventory, inventorySearch]);

  // --- IN PHIẾU GIAO HÀNG ---
  const handleTriggerPrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // --- MÁY QUÉT MÃ VẠCH (SCANNER LOGIC) ---
  const playBeep = (type = 'success') => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = type === 'success' ? 'sine' : 'square';
      osc.frequency.setValueAtTime(type === 'success' ? 1000 : 300, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.log("AudioContext không được hỗ trợ");
    }
  };

  const handleScanSubmit = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = scanValue.trim();
      if (!code) return;

      const orderIndex = orders.findIndex(o => o.id === code);
      
      if (orderIndex !== -1) {
        const updatedOrders = [...orders];
        
        if (updatedOrders[orderIndex].status === "Đã xuất kho") {
           playBeep('error');
           showToast(`⚠️ Đơn ${code} này đã được xuất kho trước đó!`);
        } else {
           updatedOrders[orderIndex].status = "Đã xuất kho";
           setOrders(updatedOrders);
           playBeep('success');
           showToast(`✅ Tít! Đơn ${code} đã chuyển thành "Đã xuất kho"`);
        }
      } else {
        playBeep('error');
        showToast(`❌ Lỗi: Không tìm thấy mã đơn ${code}!`);
      }
      
      setScanValue("");
    }
  };

  // Tự động focus vào input khi mở Modal Scanner
  useEffect(() => {
    if (isScannerOpen && scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, [isScannerOpen]);

  // --- Logic Đăng nhập / Đăng xuất ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Tài khoản hoặc mật khẩu không đúng! (Gợi ý: admin / admin)");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  // --- Render Màn hình Đăng nhập nếu chưa xác thực ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-800">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="bg-orange-100 p-3 rounded-full mb-4">
                <Package size={32} className="text-orange-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Đăng nhập hệ thống</h1>
              <p className="text-sm text-gray-500 mt-1">Quản lý Kho & Đơn hàng Shopee</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                  <XCircle size={16} /> {loginError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tài khoản</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-gray-300 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-shadow"
                    placeholder="Nhập tên đăng nhập..."
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-shadow"
                    placeholder="Nhập mật khẩu..."
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full py-2.5 mt-2" variant="primary">
                Đăng nhập
              </Button>
            </form>
            
            <div className="mt-6 text-center text-xs text-gray-400">
              <p>Tài khoản demo: admin / admin</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Render Màn hình Chính nếu đã đăng nhập ---
  return (
    <>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-800 relative print:hidden">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-[60] flex items-center gap-2 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-4">
            {toastMessage.startsWith('❌') ? <XCircle size={18} className="text-red-400" /> : <CheckCircle size={18} className="text-green-400" />}
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* MODAL: MÁY QUÉT MÃ VẠCH (SCANNER MODE) */}
        {isScannerOpen && (
          <div 
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => scannerInputRef.current?.focus()}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col items-center p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-purple-100 p-4 rounded-full mb-4 animate-pulse">
                <Scan size={48} className="text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Chế độ Quét Mã</h3>
              <p className="text-gray-500 mb-6 text-sm">
                Sử dụng súng quét mã vạch tít vào mã đơn. Hệ thống sẽ tự động tìm và đổi trạng thái thành "Đã xuất kho".
                <br/><span className="text-xs text-purple-600 font-medium mt-1 inline-block">(Demo: Gõ SPX0019283 và ấn Enter để thử)</span>
              </p>
              
              <input 
                ref={scannerInputRef}
                type="text"
                className="w-full border-2 border-purple-400 rounded-lg px-4 py-3 text-center text-xl font-mono focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-200 transition-all mb-6 uppercase"
                placeholder="Đang chờ quét..."
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value.toUpperCase())}
                onKeyDown={handleScanSubmit}
                autoFocus
              />

              <Button variant="secondary" onClick={() => setIsScannerOpen(false)} className="w-full border border-gray-300">
                Kết thúc phiên quét
              </Button>
            </div>
          </div>
        )}

        {/* MODAL: CHI TIẾT ĐƠN HÀNG */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-bold">Chi tiết đơn {selectedOrder.id}</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-red-500">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Khách hàng</p>
                    <p className="font-semibold">{selectedOrder.customer}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Số điện thoại</p>
                    <p className="font-semibold">{selectedOrder.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Địa chỉ giao hàng</p>
                    <p className="font-semibold">{selectedOrder.address}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2 text-sm text-gray-700">Sản phẩm đã đặt</h4>
                  <div className="space-y-2">
                    {selectedOrder.productList.map((prod, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="font-medium">{prod.name} <span className="text-gray-500 font-normal">x{prod.qty}</span></span>
                        <span className="text-orange-600 font-semibold">{formatCurrency(prod.price * prod.qty)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center font-bold text-lg pt-4 border-t">
                  <span>Tổng tiền (COD):</span>
                  <span className="text-orange-600">{formatCurrency(selectedOrder.total)}</span>
                </div>
                {selectedOrder.note && (
                   <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm border border-yellow-200">
                     <span className="font-semibold">Lưu ý:</span> {selectedOrder.note}
                   </div>
                )}
              </div>
              <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setSelectedOrder(null)}>Đóng</Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: XEM TRƯỚC PHIẾU IN (PRINT PREVIEW) */}
        {printingOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                <h3 className="text-lg font-bold flex items-center gap-2"><QrCode size={20}/> Xem trước phiếu in</h3>
                <button onClick={() => setPrintingOrder(null)} className="text-gray-500 hover:text-red-500"><XCircle size={24} /></button>
              </div>
              
              <div className="p-6 overflow-y-auto bg-gray-200 flex justify-center">
                <div className="bg-white p-4 w-[100mm] shadow-md border border-gray-300 text-xs text-black font-sans leading-tight">
                  <div className="border-b-2 border-black pb-2 mb-2 text-center">
                    <h2 className="text-lg font-black uppercase tracking-wider">Shopee Express</h2>
                    <img 
                      src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${printingOrder.id}&scale=3&height=12&includetext`} 
                      alt="Barcode" 
                      className="mx-auto mt-2 h-14"
                    />
                  </div>
                  <div className="flex justify-between border-b-2 border-black pb-2 mb-2">
                    <div className="w-1/2 pr-2 border-r-2 border-black">
                      <p className="font-bold">Từ: Shopee Admin Shop</p>
                      <p>123 Đường ABC, Quận 10, HCM</p>
                      <p>SĐT: 0988888888</p>
                    </div>
                    <div className="w-1/2 pl-2">
                      <p className="font-bold">Đến: {printingOrder.customer}</p>
                      <p className="line-clamp-3">{printingOrder.address}</p>
                      <p className="font-bold mt-1">SĐT: {printingOrder.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold border-b border-black pb-1 mb-1">Nội dung đơn hàng:</p>
                    <ul className="list-disc pl-4 mb-2">
                      {printingOrder.productList.map((p, i) => (
                        <li key={i}>{p.name} (SL: {p.qty})</li>
                      ))}
                    </ul>
                    <div className="flex justify-between font-bold text-sm border-t-2 border-black pt-2">
                      <span>Thu hộ (COD):</span>
                      <span>{formatCurrency(printingOrder.total)}</span>
                    </div>
                    {printingOrder.note && <p className="mt-2 text-[10px] text-center italic">* {printingOrder.note} *</p>}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t flex justify-end gap-3 bg-white">
                <Button variant="secondary" onClick={() => setPrintingOrder(null)}>Hủy</Button>
                <Button variant="dark" onClick={handleTriggerPrint}>
                  <Printer size={18} /> In Phiếu Này
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4 sticky top-0 z-20">
          <h1 className="text-xl font-bold text-orange-500 flex items-center gap-2">
            <Package className="text-orange-500" /> Shopee Admin
          </h1>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar */}
        <div className={`${isMobileMenuOpen ? "flex" : "hidden"} md:flex flex-col w-full md:w-64 bg-white border-r border-gray-200 shadow-sm shrink-0 z-10 md:sticky md:top-0 md:h-screen`}>
          <div className="hidden md:flex items-center gap-2 p-6 border-b border-gray-100">
            <Package className="text-orange-500" size={28} />
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">Admin</h1>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 ml-2 mt-2">Quản lý</div>
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id} onClick={() => { setTab(t.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${isActive ? "bg-orange-50 text-orange-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <Icon size={20} className={isActive ? "text-orange-500" : "text-gray-400"} /> {t.label}
                </button>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-100 mt-auto">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium text-sm"
            >
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-8 w-full max-w-6xl mx-auto overflow-hidden">
          
          {/* TAB ĐƠN HÀNG */}
          {tab === "orders" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Quản lý Đơn hàng</h2>
                  <p className="text-sm text-gray-500 mt-1">Quản lý, xử lý trạng thái và in vận đơn.</p>
                </div>
                
                <Button variant="purple" onClick={() => setIsScannerOpen(true)}>
                  <Scan size={20} /> Quét mã xuất kho
                </Button>
              </div>

              <Card>
                <CardContent className="space-y-6">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      className="w-full border border-gray-300 pl-10 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-shadow"
                      placeholder="Tìm mã đơn SPX, tên khách..."
                      value={search} onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="overflow-x-auto border rounded-lg shadow-sm">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-gray-50 text-gray-600 border-b">
                        <tr>
                          <th className="px-4 py-3 font-medium">Mã vận đơn</th>
                          <th className="px-4 py-3 font-medium">Khách hàng</th>
                          <th className="px-4 py-3 font-medium">Trạng thái</th>
                          <th className="px-4 py-3 font-medium text-right">Tổng tiền</th>
                          <th className="px-4 py-3 font-medium text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredOrders.length > 0 ? filteredOrders.map((o) => (
                          <tr key={o.id} className={`hover:bg-slate-50 transition-colors ${o.status === "Đã xuất kho" ? "bg-purple-50/30" : ""}`}>
                            <td className="px-4 py-3 font-mono font-bold text-slate-800">{o.id}</td>
                            <td className="px-4 py-3 text-gray-700">{o.customer}</td>
                            <td className="px-4 py-3">
                              <select 
                                value={o.status}
                                onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                className={`text-xs font-medium border rounded-md px-2 py-1 outline-none cursor-pointer ${getOrderStatusColor(o.status)}`}
                              >
                                <option value="Chờ xử lý">Chờ xử lý</option>
                                <option value="Đã xuất kho">Đã xuất kho</option>
                                <option value="Đang giao">Đang giao</option>
                                <option value="Đã giao">Đã giao</option>
                                <option value="Đã hủy">Đã hủy</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-orange-600">{formatCurrency(o.total)}</td>
                            <td className="px-4 py-3 text-center space-x-2">
                              <Button size="sm" variant="secondary" onClick={() => setSelectedOrder(o)}>
                                <Eye size={16} /> <span className="hidden sm:inline">Xem</span>
                              </Button>
                              <Button size="sm" variant="dark" onClick={() => setPrintingOrder(o)}>
                                <QrCode size={16} /> <span className="hidden sm:inline">In Phiếu</span>
                              </Button>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="5" className="px-4 py-12 text-center text-gray-500">Không tìm thấy đơn hàng.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB KHO HÀNG */}
          {tab === "inventory" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Kho hàng & Sản phẩm</h2>
                  <p className="text-sm text-gray-500 mt-1">Quản lý số lượng tồn kho và mã SKU.</p>
                </div>
                <Button><Plus size={18} /> Thêm Sản Phẩm</Button>
              </div>

              <Card>
                <CardContent className="space-y-6">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      className="w-full border border-gray-300 pl-10 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="Tìm tên sản phẩm hoặc SKU..."
                      value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)}
                    />
                  </div>

                  <div className="overflow-x-auto border rounded-lg shadow-sm">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-gray-50 text-gray-600 border-b">
                        <tr>
                          <th className="px-4 py-3 font-medium">Mã SKU</th>
                          <th className="px-4 py-3 font-medium">Tên sản phẩm</th>
                          <th className="px-4 py-3 font-medium text-center">Tồn kho</th>
                          <th className="px-4 py-3 font-medium text-right">Giá bán</th>
                          <th className="px-4 py-3 font-medium text-center">Trạng thái</th>
                          <th className="px-4 py-3 font-medium text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredInventory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-gray-500">{item.id}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                            <td className="px-4 py-3 text-center font-bold">{item.stock}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.price)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getInventoryStatusColor(item.stock)}`}>
                                {item.stock === 0 ? "Hết hàng" : item.stock <= 10 ? "Sắp hết" : "Còn hàng"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center space-x-2">
                              <Button size="sm" variant="secondary"><Edit size={16} /></Button>
                              <Button size="sm" variant="danger"><Trash2 size={16} /></Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB VẬN CHUYỂN */}
          {tab === "logistics" && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Truck size={48} className="text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-700">Vận chuyển</h2>
              <p className="mt-2 text-sm">Kết nối API đối tác vận chuyển đang được cập nhật.</p>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. GIAO DIỆN IN (PRINT MEDIA) - Chỉ hiện khi gọi window.print() */}
      {/* ========================================================= */}
      {printingOrder && (
        <div className="hidden print:block text-black bg-white w-full">
          <div className="w-[100mm] h-[150mm] p-2 mx-auto border-2 border-black font-sans box-border">
            <div className="border-b-4 border-black pb-2 mb-2 text-center">
              <h1 className="text-2xl font-black uppercase tracking-widest">SPX Express</h1>
              <div className="flex justify-center mt-2">
                <img 
                  src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${printingOrder.id}&scale=4&height=15&includetext`} 
                  alt="Barcode" 
                  className="w-4/5 h-20 object-contain"
                />
              </div>
            </div>

            <div className="flex justify-between border-b-4 border-black pb-2 mb-2 h-32">
              <div className="w-1/2 pr-2 border-r-2 border-black flex flex-col justify-between">
                <div>
                  <p className="font-bold text-sm uppercase">Từ:</p>
                  <p className="font-bold text-base">Shopee Admin Shop</p>
                  <p className="text-sm">123 Đường ABC, Quận 10, TP.HCM</p>
                </div>
                <p className="font-bold text-sm">SĐT: 0988888888</p>
              </div>
              <div className="w-1/2 pl-2 flex flex-col justify-between">
                <div>
                  <p className="font-bold text-sm uppercase">Đến:</p>
                  <p className="font-bold text-base">{printingOrder.customer}</p>
                  <p className="text-sm line-clamp-3">{printingOrder.address}</p>
                </div>
                <p className="font-bold text-base mt-1">SĐT: {printingOrder.phone}</p>
              </div>
            </div>

            <div className="h-24">
              <p className="font-bold border-b-2 border-black pb-1 mb-1 uppercase text-sm">Nội dung hàng ({printingOrder.items} SP):</p>
              <ul className="list-disc pl-5 text-sm mb-2 h-10 overflow-hidden">
                {printingOrder.productList.map((p, i) => (
                  <li key={i}>{p.name} (x{p.qty})</li>
                ))}
              </ul>
            </div>

            <div className="border-t-4 border-black pt-2 mt-auto">
               <div className="flex justify-between items-end">
                 <div className="w-24">
                   <img 
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${printingOrder.id}`} 
                     alt="QR" 
                     className="w-16 h-16"
                   />
                 </div>
                 <div className="text-right">
                   <p className="text-sm font-bold uppercase">Tiền thu hộ (COD)</p>
                   <p className="text-2xl font-black">{formatCurrency(printingOrder.total)}</p>
                 </div>
               </div>
               {printingOrder.note && (
                 <div className="mt-4 border-2 border-dashed border-black p-2 text-center">
                   <p className="font-bold text-sm uppercase">Lưu ý giao hàng:</p>
                   <p className="font-bold text-lg">{printingOrder.note}</p>
                 </div>
               )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}