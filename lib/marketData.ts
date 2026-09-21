export type StockProfile = {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
  sector: string;
  industry: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: string;
  marketCap: string;
  pe: string;
  week52High: number;
  week52Low: number;
  description: string;
  history: number[];
};

export const stockProfiles: StockProfile[] = [
  {
    symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE", sector: "Energy", industry: "Diversified",
    price: 1422.80, change: 16.40, changePct: 1.17, open: 1409.40, high: 1431.80, low: 1402.15, prevClose: 1406.40,
    volume: "9.4M", marketCap: "₹19.3T", pe: "24.8", week52High: 1608.95, week52Low: 1115.55,
    description: "A diversified Indian enterprise with businesses spanning energy, petrochemicals, retail and digital services.",
    history: [1406,1404,1408,1412,1410,1416,1419,1417,1422,1420,1426,1424,1429,1425,1430,1427,1423,1425,1421,1422.8]
  },
  {
    symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE", sector: "Technology", industry: "IT Services",
    price: 3158.70, change: -24.60, changePct: -0.77, open: 3182.00, high: 3194.40, low: 3148.25, prevClose: 3183.30,
    volume: "2.1M", marketCap: "₹11.4T", pe: "24.3", week52High: 4592.25, week52Low: 3056.05,
    description: "One of India's largest information technology services and consulting companies, serving enterprises globally.",
    history: [3183,3185,3180,3176,3179,3172,3168,3171,3164,3160,3165,3161,3156,3152,3155,3150,3154,3157,3156,3158.7]
  },
  {
    symbol: "INFY", name: "Infosys", exchange: "NSE", sector: "Technology", industry: "IT Services",
    price: 1489.25, change: 13.75, changePct: 0.93, open: 1477.10, high: 1494.60, low: 1471.20, prevClose: 1475.50,
    volume: "5.6M", marketCap: "₹6.2T", pe: "23.1", week52High: 2006.80, week52Low: 1307.00,
    description: "A global technology services company focused on consulting, digital transformation and business process solutions.",
    history: [1475,1477,1474,1479,1481,1478,1484,1482,1486,1488,1485,1490,1487,1492,1489,1491,1488,1490,1487,1489.25]
  },
  {
    symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE", sector: "Banking", industry: "Private Bank",
    price: 972.10, change: 5.90, changePct: 0.61, open: 967.30, high: 976.85, low: 964.40, prevClose: 966.20,
    volume: "12.8M", marketCap: "₹14.9T", pe: "19.6", week52High: 1027.90, week52Low: 812.40,
    description: "A leading Indian private-sector bank offering retail, wholesale and digital financial services.",
    history: [966,965,968,967,969,971,970,973,971,974,972,975,973,976,974,973,975,972,973,972.1]
  },
  {
    symbol: "ICICIBANK", name: "ICICI Bank", exchange: "NSE", sector: "Banking", industry: "Private Bank",
    price: 1396.40, change: -7.30, changePct: -0.52, open: 1404.20, high: 1408.70, low: 1390.60, prevClose: 1403.70,
    volume: "8.2M", marketCap: "₹9.9T", pe: "18.9", week52High: 1502.35, week52Low: 1124.00,
    description: "A major Indian private-sector bank with broad retail, corporate and digital banking operations.",
    history: [1404,1406,1402,1405,1400,1398,1401,1397,1395,1399,1396,1394,1398,1393,1391,1395,1392,1394,1395,1396.4]
  },
  {
    symbol: "SBIN", name: "State Bank of India", exchange: "NSE", sector: "Banking", industry: "Public Bank",
    price: 853.65, change: 11.20, changePct: 1.33, open: 844.10, high: 858.20, low: 840.85, prevClose: 842.45,
    volume: "18.4M", marketCap: "₹7.6T", pe: "10.1", week52High: 912.00, week52Low: 680.00,
    description: "India's largest public-sector bank, serving retail, corporate and institutional customers.",
    history: [842,843,841,845,847,846,849,851,850,854,852,855,853,856,854,857,855,854,852,853.65]
  },
  {
    symbol: "BHARTIARTL", name: "Bharti Airtel", exchange: "NSE", sector: "Telecom", industry: "Telecommunications",
    price: 1916.80, change: 9.45, changePct: 0.50, open: 1908.10, high: 1924.75, low: 1901.60, prevClose: 1907.35,
    volume: "4.8M", marketCap: "₹11.6T", pe: "31.5", week52High: 2045.00, week52Low: 1476.00,
    description: "A leading telecommunications provider with mobile, broadband, enterprise and digital services.",
    history: [1907,1909,1905,1910,1912,1911,1915,1913,1918,1916,1920,1917,1922,1919,1921,1918,1915,1917,1914,1916.8]
  },
  {
    symbol: "ITC", name: "ITC", exchange: "NSE", sector: "Consumer", industry: "Consumer Staples",
    price: 418.35, change: -2.15, changePct: -0.51, open: 420.20, high: 421.75, low: 416.90, prevClose: 420.50,
    volume: "14.6M", marketCap: "₹5.2T", pe: "25.7", week52High: 528.50, week52Low: 389.25,
    description: "A diversified consumer business with packaged goods, cigarettes, hotels, paperboards and agriculture operations.",
    history: [420.5,420.8,420.1,419.8,420.2,419.5,419.9,419.1,418.8,419.2,418.4,418.7,418.2,417.9,418.3,417.7,418.1,418.5,418.0,418.35]
  },
  {
    symbol: "LT", name: "Larsen & Toubro", exchange: "NSE", sector: "Industrials", industry: "Engineering & Construction",
    price: 3671.20, change: 42.30, changePct: 1.17, open: 3634.80, high: 3686.50, low: 3625.40, prevClose: 3628.90,
    volume: "1.7M", marketCap: "₹5.0T", pe: "31.2", week52High: 3963.50, week52Low: 2965.30,
    description: "A major engineering and construction group active across infrastructure, energy, manufacturing and technology services.",
    history: [3629,3633,3630,3638,3641,3637,3648,3645,3652,3657,3654,3662,3659,3668,3665,3674,3670,3676,3673,3671.2]
  },
  {
    symbol: "TATAMOTORS", name: "Tata Motors", exchange: "NSE", sector: "Automotive", industry: "Automobiles",
    price: 709.90, change: -9.80, changePct: -1.36, open: 718.30, high: 721.10, low: 705.80, prevClose: 719.70,
    volume: "10.1M", marketCap: "₹2.6T", pe: "9.7", week52High: 1003.00, week52Low: 535.75,
    description: "An automotive manufacturer with passenger vehicles, commercial vehicles and global luxury vehicle operations.",
    history: [720,718,719,716,717,714,713,715,712,710,713,711,708,709,706,708,707,710,709,709.9]
  },
  {
    symbol: "SUNPHARMA", name: "Sun Pharmaceutical", exchange: "NSE", sector: "Healthcare", industry: "Pharmaceuticals",
    price: 1664.55, change: 18.30, changePct: 1.11, open: 1648.30, high: 1672.40, low: 1642.65, prevClose: 1646.25,
    volume: "2.4M", marketCap: "₹4.0T", pe: "34.0", week52High: 1960.35, week52Low: 1501.00,
    description: "A large Indian pharmaceutical company with specialty, generic and consumer healthcare products.",
    history: [1646,1648,1645,1650,1654,1652,1657,1655,1660,1658,1663,1661,1666,1664,1668,1665,1667,1663,1665,1664.55]
  },
  {
    symbol: "MARUTI", name: "Maruti Suzuki India", exchange: "NSE", sector: "Automotive", industry: "Passenger Vehicles",
    price: 14532.00, change: 121.00, changePct: 0.84, open: 14428.00, high: 14588.00, low: 14396.00, prevClose: 14411.00,
    volume: "0.5M", marketCap: "₹4.6T", pe: "30.6", week52High: 15190.00, week52Low: 10350.00,
    description: "India's largest passenger vehicle manufacturer by volume, producing cars and utility vehicles across multiple segments.",
    history: [14411,14426,14418,14442,14455,14437,14470,14488,14475,14504,14492,14518,14506,14539,14522,14548,14536,14560,14542,14532]
  }
];

export const stockMap = Object.fromEntries(
  stockProfiles.map((stock) => [stock.symbol.toLowerCase(), stock])
) as Record<string, StockProfile>;
