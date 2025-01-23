import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { TransactionModal } from "./addTransaction";
import { getSession } from "~/utils/session.server";
import { useSpring, animated } from '@react-spring/web';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

type Transaction = {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: number;
    name: string;
    description: string;
    createdAt: string;
  };
};

type LoaderData = {
  dayTransactions: Transaction[];
  weekTransactions: Transaction[];
  monthTransactions: Transaction[];
  token: string;
};

// Tambahkan interface untuk CategoryStyle
interface CategoryStyle {
  icon: string;
  bgColor: string;
  textColor: string;
}

// Definisikan mapping kategori ke icon dan warna
const categoryStyles: { [key: number]: CategoryStyle } = {
  1: { icon: "🍔", bgColor: "bg-red-100", textColor: "text-red-600" },
  2: { icon: "🚗", bgColor: "bg-blue-100", textColor: "text-blue-600" },
  3: { icon: "🎮", bgColor: "bg-purple-100", textColor: "text-purple-600" },
  4: { icon: "🏠", bgColor: "bg-green-100", textColor: "text-green-600" },
  5: { icon: "💊", bgColor: "bg-pink-100", textColor: "text-pink-600" },
  6: { icon: "📚", bgColor: "bg-yellow-100", textColor: "text-yellow-600" },
  7: { icon: "💅", bgColor: "bg-indigo-100", textColor: "text-indigo-600" },
  8: { icon: "🛍️", bgColor: "bg-orange-100", textColor: "text-orange-600" },
  9: { icon: "💰", bgColor: "bg-emerald-100", textColor: "text-emerald-600" },
  10: { icon: "💳", bgColor: "bg-red-100", textColor: "text-red-600" },
  11: { icon: "🏦", bgColor: "bg-cyan-100", textColor: "text-cyan-600" },
  12: { icon: "🛡️", bgColor: "bg-teal-100", textColor: "text-teal-600" },
  13: { icon: "🎁", bgColor: "bg-rose-100", textColor: "text-rose-600" },
  14: { icon: "✈️", bgColor: "bg-sky-100", textColor: "text-sky-600" },
  15: { icon: "📦", bgColor: "bg-gray-100", textColor: "text-gray-600" }
};

const API_BASE_URL = 'http://8.215.199.5:3001/api'; // Kembali ke HTTP untuk sementara

export async function loader({ request }: { request: Request }) {
  const session = await getSession(request);
  const token = session.get("token");

  if (!token) {
    return redirect("/");
  }

  try {
    const fetchOptions = {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      mode: 'cors' as RequestMode
    };

    const [dayResponse, weekResponse, monthResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/transactions/get/day`, fetchOptions),
      fetch(`${API_BASE_URL}/transactions/get/week`, fetchOptions),
      fetch(`${API_BASE_URL}/transactions/get/month`, fetchOptions)
    ]);

    const [dayData, weekData, monthData] = await Promise.all([
      dayResponse.json(),
      weekResponse.json(),
      monthResponse.json(),
    ]);

    return json(
      {
        dayTransactions: dayData.data || [],
        weekTransactions: weekData.data || [],
        monthTransactions: monthData.data || [],
        token: token,
      }
    );
  } catch (error) {
    console.error("Loader Error:", error);
    return redirect("/");
  }
}

// Tambahkan interface untuk AnimatedContent
interface AnimatedContentProps {
  children: React.ReactNode;
  className?: string;
}

// Definisikan komponen AnimatedContent
const AnimatedContent = ({ children, className = '' }: AnimatedContentProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`${className} animate-[fadeIn_0.5s_ease-out]`}>
      {children}
    </div>
  );
};

export default function Dashboard() {
  const { dayTransactions = [], weekTransactions = [], monthTransactions = [], token } = useLoaderData<LoaderData>();
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [swipeStart, setSwipeStart] = useState<number | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [swipedTransactionId, setSwipedTransactionId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const SWIPE_THRESHOLD = -100; // Jarak minimum untuk trigger delete

  useEffect(() => {
    setIsClient(true);
  }, []);

  const calculateTotal = (transactions: Transaction[] = []) => {
    if (!transactions) return 0;
    return transactions.reduce((acc, curr) => acc + curr.amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fungsi untuk mendapatkan style kategori
  const getCategoryStyle = (categoryId: number): CategoryStyle => {
    return categoryStyles[categoryId] || { 
      icon: "📋", 
      bgColor: "bg-gray-100", 
      textColor: "text-gray-600" 
    };
  };

  const categories = [
    { id: 1, name: "Food & Beverages" },
    { id: 2, name: "Transportation" },
    { id: 3, name: "Entertainment" },
    { id: 4, name: "Housing" },
    { id: 5, name: "Health & Wellness" },
    { id: 6, name: "Education" },
    { id: 7, name: "Personal Care" },
    { id: 8, name: "Shopping" },
    { id: 9, name: "Savings & Investments" },
    { id: 10, name: "Debt Payments" },
    { id: 11, name: "Loan Payments" },
    { id: 12, name: "Insurance" },
    { id: 13, name: "Gifts & Donations" },
    { id: 14, name: "Travel" },
    { id: 15, name: "Miscellaneous" }
  ];

  const createFetchOptions = (method: string, token: string, body?: any) => {
    return {
      method: method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      mode: 'cors',
      credentials: 'same-origin',
      ...(body && { body: JSON.stringify(body) })
    };
  };

  const handleAddTransaction = async (data: any) => {
    try {
      console.log('Request Data:', data);
      const response = await fetch(
        `${API_BASE_URL}/transactions/create`,
        createFetchOptions("POST", token, data)
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Debug - Response Data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create transaction');
      }

      window.location.reload();
    } catch (error) {
      console.error('Detailed error:', error);
      alert('Gagal menambahkan transaksi. Silakan coba lagi.');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true);
      console.log('Deleting transaction:', id);
      
      const response = await fetch(`${API_BASE_URL}/transactions/delete/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        mode: 'cors'
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.message || 'Failed to delete transaction');
      }

      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Gagal menghapus transaksi. Silakan coba lagi.');
      setSwipeDistance(0);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, id: number) => {
    setSwipeStart(e.touches[0].clientX);
    setSwipedTransactionId(id);
    setSwipeDistance(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeStart === null || !swipedTransactionId) return;
    
    const currentX = e.touches[0].clientX;
    const distance = currentX - swipeStart;
    
    // Hanya izinkan swipe ke kiri dan batasi jarak maksimum
    const newDistance = Math.min(0, Math.max(distance, -200));
    setSwipeDistance(newDistance);
  };

  const handleTouchEnd = async () => {
    if (swipeDistance < SWIPE_THRESHOLD && swipedTransactionId) {
      // Trigger delete jika melewati threshold
      await handleDelete(swipedTransactionId);
    } else {
      // Reset posisi jika tidak jadi delete
      setSwipeDistance(0);
    }
    setSwipeStart(null);
    setSwipedTransactionId(null);
  };

  // Fungsi untuk mengelompokkan transaksi berdasarkan kategori
  const getCategoryTotals = (transactions: Transaction[]) => {
    const categoryTotals: { [key: string]: number } = {};
    
    transactions.forEach(transaction => {
      const categoryName = transaction.category.name;
      if (categoryTotals[categoryName]) {
        categoryTotals[categoryName] += transaction.amount;
      } else {
        categoryTotals[categoryName] = transaction.amount;
      }
    });

    return categoryTotals;
  };

  // Konfigurasi Chart.js
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  // Data untuk grafik
  const monthlyData = getCategoryTotals(monthTransactions);
  
  const chartData = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        label: 'Pengeluaran per Kategori',
        data: Object.values(monthlyData),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',   // Merah
          'rgba(54, 162, 235, 0.5)',   // Biru
          'rgba(255, 206, 86, 0.5)',   // Kuning
          'rgba(75, 192, 192, 0.5)',   // Tosca
          'rgba(153, 102, 255, 0.5)',  // Ungu
          'rgba(255, 159, 64, 0.5)',   // Orange
          'rgba(199, 199, 199, 0.5)',  // Abu-abu
          'rgba(83, 102, 255, 0.5)',   // Biru Tua
          'rgba(255, 99, 255, 0.5)',   // Pink
          'rgba(99, 255, 132, 0.5)',   // Hijau Muda
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(255, 99, 255, 1)',
          'rgba(99, 255, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Pengeluaran per Kategori Bulan Ini',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-4">
        {/* Header dengan animasi fade in dari atas */}
        <AnimatedContent className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
          >
            <span>+</span> Tambah Transaksi
          </button>
        </AnimatedContent>

        {/* Summary Cards dengan animasi slide in dari kiri */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow animate-[slideInLeft_0.5s_ease-out] hover:shadow-lg transition-shadow duration-300">
            <p className="text-gray-600 text-sm mb-2">Total Pengeluaran Bulan Ini</p>
            <p className="text-2xl font-bold">{formatCurrency(calculateTotal(monthTransactions))}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow animate-[slideInLeft_0.5s_ease-out_0.2s] hover:shadow-lg transition-shadow duration-300">
            <p className="text-gray-600 text-sm mb-2">Total Pengeluaran Minggu Ini</p>
            <p className="text-2xl font-bold">{formatCurrency(calculateTotal(weekTransactions))}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow animate-[slideInLeft_0.5s_ease-out_0.4s] hover:shadow-lg transition-shadow duration-300">
            <p className="text-gray-600 text-sm mb-2">Total Pengeluaran Hari Ini</p>
            <p className="text-2xl font-bold">{formatCurrency(calculateTotal(dayTransactions))}</p>
          </div>
        </div>

        {/* Recent Transactions dengan animasi fade in dari bawah */}
        <AnimatedContent className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Transaksi Terkini</h2>
          <p className="text-sm text-gray-600 mb-4">
            {new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>

          <div className="space-y-4">
            <h3 className="font-medium">Transaksi Terakhir Hari Ini</h3>
            {dayTransactions && dayTransactions.length > 0 ? (
              dayTransactions.map((transaction, index) => {
                const categoryStyle = getCategoryStyle(transaction.category_id);
                const isBeingDeleted = isDeleting && swipedTransactionId === transaction.id;
                const isBeingSwiped = swipedTransactionId === transaction.id;

                return (
                  <div 
                    key={transaction.id}
                    className="relative overflow-hidden"
                  >
                    {/* Delete background */}
                    <div className="absolute inset-y-0 right-0 bg-red-500 w-20 flex items-center justify-center text-white">
                      <span>Hapus</span>
                    </div>

                    {/* Transaction item */}
                    <div 
                      className={`bg-white flex items-center justify-between py-3 border-b relative touch-pan-x ${
                        isBeingDeleted ? 'opacity-50' : ''
                      }`}
                      style={{ 
                        transform: `translateX(${isBeingSwiped ? swipeDistance : 0}px)`,
                        transition: isBeingSwiped ? 'none' : 'transform 0.3s ease-out'
                      }}
                      onTouchStart={(e) => handleTouchStart(e, transaction.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${categoryStyle.bgColor} flex items-center justify-center`}>
                          <span className={`${categoryStyle.textColor} text-xl`}>
                            {categoryStyle.icon}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-600">{formatTime(transaction.createdAt)}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${categoryStyle.bgColor} ${categoryStyle.textColor}`}>
                              {transaction.category.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4 animate-pulse">Tidak ada transaksi hari ini</p>
            )}
          </div>

          {/* Total dengan animasi fade in */}
          <div className="mt-4 pt-4 border-t flex justify-between items-center animate-[fadeIn_0.5s_ease-out_0.5s]">
            <p className="font-medium">Total Pengeluaran Hari Ini</p>
            <p className="font-bold">{formatCurrency(calculateTotal(dayTransactions))}</p>
          </div>
        </AnimatedContent>

        {/* Statistik dengan grafik */}
        <AnimatedContent className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Statistik Pengeluaran</h2>
          <div className="h-[400px]"> {/* Tinggi grafik */}
            {isClient && monthTransactions.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                {monthTransactions.length === 0 
                  ? "Belum ada data transaksi bulan ini"
                  : "Memuat grafik..."}
              </div>
            )}
          </div>
          
          {/* Ringkasan Total */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Kategori Terbesar</h3>
              {Object.entries(monthlyData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([category, amount], index) => (
                  <div key={category} className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">{index + 1}. {category}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))
              }
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Ringkasan</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Total Kategori</span>
                <span className="font-medium">{Object.keys(monthlyData).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Pengeluaran</span>
                <span className="font-medium">{formatCurrency(calculateTotal(monthTransactions))}</span>
              </div>
            </div>
          </div>
        </AnimatedContent>
      </div>

      {/* Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTransaction}
        categories={categories}
      />
    </>
  );
}

const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
