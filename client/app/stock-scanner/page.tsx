'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Constants
const RSI_PERIOD = 14;
const OVERSOLD_THRESHOLD = 30;
const OVERBOUGHT_THRESHOLD = 70;
const TIME_PERIODS = {
  Daily: { period: "1mo", interval: "1d" },
  Weekly: { period: "6mo", interval: "1wk" },
  Monthly: { period: "1y", interval: "1mo" }
};

const SECTORS = {
  "basic-materials": "基础材料",
  "agricultural-inputs": "农业投入",
  "aluminum": "铝",
  "building-materials": "建筑材料",
  "chemicals": "化学品",
  "coking-coal": "焦煤",
  "copper": "铜",
  "gold": "黄金",
  "lumber-wood-production": "木材生产",
  "other-industrial-metals-mining": "其他工业金属矿业",
  "other-precious-metals-mining": "其他贵金属矿业",
  "paper-paper-products": "纸和纸制品",
  "silver": "白银",
  "specialty-chemicals": "特种化学品",
  "steel": "钢铁",
  "communication-services": "通信服务",
  "advertising-agencies": "广告代理",
  "broadcasting": "广播",
  "electronic-gaming-multimedia": "电子游戏多媒体",
  "entertainment": "娱乐",
  "internet-content-information": "互联网内容信息",
  "publishing": "出版",
  "telecom-services": "电信服务",
  "consumer-cyclical": "大消费",
  "apparel-manufacturing": "服装制造",
  "apparel-retail": "服装零售",
  "auto-manufacturers": "汽车制造商",
  "auto-parts": "汽车零部件",
  "auto-truck-dealerships": "汽车卡车经销商",
  "department-stores": "百货商店",
  "footwear-accessories": "鞋类和配饰",
  "furnishings-fixtures-appliances": "家具固定装置和电器",
  "gambling": "赌博",
  "home-improvement-retail": "家居装修零售",
  "internet-retail": "互联网零售",
  "leisure": "休闲",
  "lodging": "住宿",
  "luxury-goods": "奢侈品",
  "packaging-containers": "包装容器",
  "personal-services": "个人服务",
  "recreational-vehicles": "休闲车",
  "residential-construction": "住宅建筑",
  "resorts-casinos": "度假村赌场",
  "restaurants": "餐厅",
  "specialty-retail": "专业零售",
  "textile-manufacturing": "纺织制造",
  "travel-services": "旅游服务",
  "consumer-defensive": "防御性消费",
  "beverages-brewers": "饮料酿造商",
  "beverages-non-alcoholic": "非酒精饮料",
  "beverages-wineries-distilleries": "酿酒厂和蒸馏厂",
  "confectioners": "糖果商",
  "discount-stores": "折扣店",
  "education-training-services": "教育和培训服务",
  "farm-products": "农产品",
  "food-distribution": "食品分销",
  "grocery-stores": "杂货店",
  "household-personal-products": "家居和个人产品",
  "packaged-foods": "包装食品",
  "tobacco": "烟草",
  "energy": "能源",
  "oil-gas-drilling": "石油天然气钻探",
  "oil-gas-e-p": "石油天然气勘探与生产",
  "oil-gas-equipment-services": "石油天然气设备服务",
  "oil-gas-integrated": "综合石油天然气",
  "oil-gas-midstream": "石油天然气中游",
  "oil-gas-refining-marketing": "石油天然气炼化和营销",
  "thermal-coal": "动力煤",
  "uranium": "铀",
  "financial-services": "金融",
  "asset-management": "资产管理",
  "banks-diversified": "多元化银行",
  "banks-regional": "区域性银行",
  "capital-markets": "资本市场",
  "credit-services": "信贷服务",
  "financial-conglomerates": "金融集团",
  "financial-data-stock-exchanges": "金融数据和证券交易所",
  "insurance-brokers": "保险经纪人",
  "insurance-diversified": "多元化保险",
  "insurance-life": "人寿保险",
  "insurance-property-casualty": "财产和意外保险",
  "insurance-reinsurance": "再保险",
  "insurance-specialty": "专业保险",
  "mortgage-finance": "抵押贷款金融",
  "shell-companies": "空壳公司",
  "healthcare": "创新药",
  "biotechnology": "生物技术",
  "diagnostics-research": "诊断研究",
  "drug-manufacturers-general": "通用药品制造商",
  "drug-manufacturers-specialty-generic": "专业和仿制药制造商",
  "health-information-services": "健康信息服务",
  "healthcare-plans": "医疗保健计划",
  "medical-care-facilities": "医疗保健设施",
  "medical-devices": "医疗设备",
  "medical-distribution": "医疗分销",
  "medical-instruments-supplies": "医疗仪器和用品",
  "pharmaceutical-retailers": "药品零售商",
  "industrials": "工业",
  "aerospace-defense": "航空航天和国防",
  "airlines": "航空公司",
  "airports-air-services": "机场和航空服务",
  "building-products-equipment": "建筑产品和设备",
  "business-equipment-supplies": "商业设备和用品",
  "conglomerates": "企业集团",
  "consulting-services": "咨询服务",
  "electrical-equipment-parts": "电气设备和零件",
  "engineering-construction": "工程和建筑",
  "farm-heavy-construction-machinery": "农业和重型建筑机械",
  "industrial-distribution": "工业分销",
  "infrastructure-operations": "基础设施运营",
  "integrated-freight-logistics": "综合货运和物流",
  "marine-shipping": "海运",
  "metal-fabrication": "金属制造",
  "pollution-treatment-controls": "污染处理和控制",
  "railroads": "铁路",
  "rental-leasing-services": "租赁服务",
  "security-protection-services": "安全和保护服务",
  "specialty-business-services": "专业商业服务",
  "specialty-industrial-machinery": "专业工业机械",
  "staffing-employment-services": "人员配备和就业服务",
  "tools-accessories": "工具和配件",
  "trucking": "卡车运输",
  "waste-management": "废物管理",
  "real-estate": "房地产",
  "real-estate-development": "房地产开发",
  "real-estate-diversified": "多元化房地产",
  "real-estate-services": "房地产服务",
  "reit-diversified": "多元化房地产投资信托",
  "reit-healthcare-facilities": "医疗保健设施房地产投资信托",
  "reit-hotel-motel": "酒店和汽车旅馆房地产投资信托",
  "reit-industrial": "工业房地产投资信托",
  "reit-mortgage": "抵押贷款房地产投资信托",
  "reit-office": "办公房地产投资信托",
  "reit-residential": "住宅房地产投资信托",
  "reit-retail": "零售房地产投资信托",
  "reit-specialty": "专业房地产投资信托",
  "technology": "科技",
  "communication-equipment": "通信设备",
  "computer-hardware": "计算机硬件",
  "consumer-electronics": "消费电子",
  "electronic-components": "电子元件",
  "electronics-computer-distribution": "电子和计算机分销",
  "information-technology-services": "信息技术服务",
  "scientific-technical-instruments": "科学和技术仪器",
  "semiconductor-equipment-materials": "半导体设备和材料",
  "semiconductors": "半导体",
  "software-application": "应用软件",
  "software-infrastructure": "基础设施软件",
  "solar": "太阳能",
  "utilities": "电力",
  "utilities-diversified": "多元化公用事业",
  "utilities-independent-power-producers": "独立电力生产商",
  "utilities-regulated-electric": "受监管的电力公用事业",
  "utilities-regulated-gas": "受监管的天然气公用事业",
  "utilities-regulated-water": "受监管的水务公用事业",
  "utilities-renewable": "可再生能源公用事业"
};

const RECOMMENDED_SECTORS = ["consumer-cyclical", "utilities", "healthcare"];

interface StockData {
  ticker: string;
  daily: boolean;
  weekly: boolean;
  monthly: boolean;
  marketCap: number;
  earningsGrowth: number;
  sector: string;
}

export default function StockScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processedTickers, setProcessedTickers] = useState<Set<string>>(new Set());
  const [selectedSectors, setSelectedSectors] = useState<Set<string>>(new Set());
  const [showAllSectors, setShowAllSectors] = useState(true);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [oversoldStocks, setOversoldStocks] = useState<StockData[]>([]);
  const [filteredOversoldStocks, setFilteredOversoldStocks] = useState<StockData[]>([]);
  const [overboughtStocks, setOverboughtStocks] = useState<StockData[]>([]);
  const [filteredOverboughtStocks, setFilteredOverboughtStocks] = useState<StockData[]>([]);
  const [scanAborted, setScanAborted] = useState(false);

  const generateTickers = (prefixes: number[], suffix: string, rangeLen: number) => {
    const tickers: string[] = [];
    for (const prefix of prefixes) {
      for (let i = 0; i < rangeLen; i++) {
        const ticker = `${prefix}${i.toString().padStart(3, '0')}${suffix}`;
        tickers.push(ticker);
      }
    }
    return tickers;
  };

  const calculateRSI = (prices: number[], period: number) => {
    if (prices.length < period + 1) return null;
    
    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    const gains = changes.map(change => Math.max(0, change));
    const losses = changes.map(change => Math.max(0, -change));
    
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < changes.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    }
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const filterStock = (stock: StockData) => {
    if (!(100 <= stock.marketCap && stock.marketCap <= 300)) return false;
    if (stock.earningsGrowth <= 0) return false;
    if (showAllSectors) return true;
    if (selectedSectors.size > 0 && !selectedSectors.has(stock.sector)) return false;
    return true;
  };

  const addLogMessage = (message: string) => {
    setLogMessages(prev => [...prev, message]);
  };

  const fetchStockData = async (ticker: string) => {
    try {
      const response = await fetch(`/api/stock-data?ticker=${ticker}`);
      console.log(response);
      if (!response.ok) throw new Error('Failed to fetch stock data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }
  };

  const startScan = async () => {
    if (isScanning && !isPaused) {
      addLogMessage("Scan is already in progress.");
      return;
    }

    if (scanAborted) {
      setScanAborted(false);
      setProcessedTickers(new Set());
      setOversoldStocks([]);
      setFilteredOversoldStocks([]);
      setOverboughtStocks([]);
      setFilteredOverboughtStocks([]);
      setLogMessages([]);
    }

    setIsScanning(true);
    setIsPaused(false);
    addLogMessage("Starting scan...");

    const shPrefixes = [600, 601, 603, 688];
    const szPrefixes = [0, 1, 2, 3, 300];
    const shTickers = generateTickers(shPrefixes, ".SS", 1000);
    const szTickers = generateTickers(szPrefixes, ".SZ", 1000);
    const allTickers = [...shTickers, ...szTickers].filter(t => !processedTickers.has(t));

    addLogMessage(`Generated ${shTickers.length} Shanghai tickers.`);
    addLogMessage(`Generated ${szTickers.length} Shenzhen tickers.`);
    addLogMessage(`Scanning ${allTickers.length} remaining tickers...`);
    addLogMessage(`Looking for Daily RSI <= ${OVERSOLD_THRESHOLD}...`);

    let processedCount = 0;
    let foundCount = 0;
    let fetchErrors = 0;

    for (const ticker of allTickers) {
      if (scanAborted) {
        addLogMessage("Scan aborted.");
        break;
      }

      while (isPaused && !scanAborted) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      processedCount++;
      setProcessedTickers(prev => new Set([...prev, ticker]));

      if (processedCount % 50 === 0) {
        addLogMessage(`Processed ${processedCount}/${allTickers.length}... Found ${foundCount} signals. Errors: ${fetchErrors}`);
      }

      try {
        addLogMessage(`Fetching data for ${ticker}...`);
        const data = await fetchStockData(ticker);
        addLogMessage(`Data fetched for ${ticker}`);
        addLogMessage(JSON.stringify(data));
        const prices = data.prices;
        
        if (!prices || prices.length < RSI_PERIOD) {
          fetchErrors++;
          continue;
        }

        const rsi = calculateRSI(prices, RSI_PERIOD);
        if (!rsi) continue;

        const stockData: StockData = {
          ticker,
          daily: rsi <= OVERSOLD_THRESHOLD,
          weekly: false,
          monthly: false,
          marketCap: data.marketCap / 100000000,
          earningsGrowth: data.earningsGrowth,
          sector: data.sector
        };

        if (stockData.daily) {
          foundCount++;
          addLogMessage(`Found signal: ${ticker}`);
          setOversoldStocks(prev => [...prev, stockData]);
          if (filterStock(stockData)) {
            setFilteredOversoldStocks(prev => [...prev, stockData]);
          }
        }

        if (rsi > OVERBOUGHT_THRESHOLD) {
          addLogMessage(`Found overbought signal: ${ticker}`);
          setOverboughtStocks(prev => [...prev, stockData]);
          if (filterStock(stockData)) {
            setFilteredOverboughtStocks(prev => [...prev, stockData]);
          }
        }
      } catch (error) {
        fetchErrors++;
        addLogMessage(`Error processing ${ticker}: ${error}`);
      }
    }

    setIsScanning(false);
    setIsPaused(false);
    addLogMessage("Scan complete!");
  };

  const togglePause = () => {
    if (!isScanning) {
      addLogMessage("No scan in progress to pause.");
      return;
    }
    setIsPaused(!isPaused);
    addLogMessage(isPaused ? "Scan resumed." : "Scan paused.");
  };

  const stopScan = () => {
    if (!isScanning) {
      addLogMessage("No scan in progress to stop.");
      return;
    }
    setScanAborted(true);
    setIsScanning(false);
    setIsPaused(false);
    addLogMessage("Scan stopped.");
  };

  const applyRecommendedSectors = () => {
    setSelectedSectors(new Set(RECOMMENDED_SECTORS));
    setShowAllSectors(false);
    addLogMessage("Applied recommended sectors: 大消费、电力、创新药");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">China Stock RSI Scanner</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button 
                onClick={startScan} 
                disabled={isScanning && !isPaused}
                className="w-full"
              >
                {isScanning ? (isPaused ? "Resume Scan" : "Scanning...") : "Start Scan"}
              </Button>
              <Button 
                onClick={togglePause} 
                disabled={!isScanning}
                className="w-full"
              >
                {isPaused ? "Resume Scan" : "Pause Scan"}
              </Button>
              <Button 
                onClick={stopScan} 
                disabled={!isScanning}
                className="w-full"
                variant="destructive"
              >
                Stop Scan
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-all-sectors"
                  checked={showAllSectors}
                  onCheckedChange={(checked) => setShowAllSectors(checked as boolean)}
                />
                <Label htmlFor="show-all-sectors">显示所有板块 (不筛选)</Label>
              </div>
              <Button 
                onClick={applyRecommendedSectors}
                className="w-full"
              >
                贸易战推荐板块
              </Button>
            </div>

            <ScrollArea className="h-[300px] border rounded-md p-2">
              <div className="space-y-2">
                {Object.entries(SECTORS).map(([key, name]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox 
                      id={key}
                      checked={selectedSectors.has(key)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedSectors);
                        if (checked) newSelected.add(key);
                        else newSelected.delete(key);
                        setSelectedSectors(newSelected);
                      }}
                      disabled={showAllSectors}
                    />
                    <Label htmlFor={key}>{name}</Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Log Area */}
          <Card>
            <CardHeader>
              <CardTitle>Log Output</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                <div className="space-y-1">
                  {logMessages.map((message, index) => (
                    <div key={index} className="text-sm">{message}</div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Results Tables */}
          <Tabs defaultValue="oversold">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="oversold">Oversold Signals</TabsTrigger>
              <TabsTrigger value="overbought">Overbought Signals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="oversold">
              <Card>
                <CardHeader>
                  <CardTitle>Oversold Signals</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticker</TableHead>
                        <TableHead>Daily</TableHead>
                        <TableHead>Weekly</TableHead>
                        <TableHead>Monthly</TableHead>
                        <TableHead>Market Cap (亿)</TableHead>
                        <TableHead>Earnings Growth</TableHead>
                        <TableHead>Sector</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {oversoldStocks.map((stock) => (
                        <TableRow key={stock.ticker}>
                          <TableCell>{stock.ticker}</TableCell>
                          <TableCell>{stock.daily ? "Yes" : "No"}</TableCell>
                          <TableCell>{stock.weekly ? "Yes" : "No"}</TableCell>
                          <TableCell>{stock.monthly ? "Yes" : "No"}</TableCell>
                          <TableCell>{stock.marketCap.toFixed(2)}</TableCell>
                          <TableCell>{(stock.earningsGrowth * 100).toFixed(2)}%</TableCell>
                          <TableCell>{stock.sector}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Filtered Oversold Signals</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticker</TableHead>
                        <TableHead>Daily</TableHead>
                        <TableHead>Weekly</TableHead>
                        <TableHead>Monthly</TableHead>
                        <TableHead>Market Cap (亿)</TableHead>
                        <TableHead>Earnings Growth</TableHead>
                        <TableHead>Sector</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOversoldStocks.map((stock) => (
                        <TableRow key={stock.ticker}>
                          <TableCell>{stock.ticker}</TableCell>
                          <TableCell>{stock.daily ? "Yes" : "No"}</TableCell>
                          <TableCell>{stock.weekly ? "Yes" : "No"}</TableCell>
                          <TableCell>{stock.monthly ? "Yes" : "No"}</TableCell>
                          <TableCell>{stock.marketCap.toFixed(2)}</TableCell>
                          <TableCell>{(stock.earningsGrowth * 100).toFixed(2)}%</TableCell>
                          <TableCell>{stock.sector}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overbought">
              <Card>
                <CardHeader>
                  <CardTitle>Overbought Signals</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticker</TableHead>
                        <TableHead>Daily</TableHead>
                        <TableHead>Weekly</TableHead>
                        <TableHead>Monthly</TableHead>
                        <TableHead>Market Cap (亿)</TableHead>
                        <TableHead>Earnings Growth</TableHead>
                        <TableHead>Sector</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overboughtStocks.map((stock) => (
                        <TableRow key={stock.ticker}>
                          <TableCell>{stock.ticker}</TableCell>
                          <TableCell>{stock.daily ? "Yes" : "No"}</TableCell>
                          <TableCell>{stock.weekly ? "Yes" : "No"}</TableCell>
                          <TableCell>{stock.monthly ? "Yes" : "No"}</TableCell>
                          <TableCell>{stock.marketCap.toFixed(2)}</TableCell>
                          <TableCell>{(stock.earningsGrowth * 100).toFixed(2)}%</TableCell>
                          <TableCell>{stock.sector}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Filtered Overbought Signals</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticker</TableHead>
                        <TableHead>Daily</TableHead>
                        <TableHead>Weekly</TableHead>
                        <TableHead>Monthly</TableHead>
                        <TableHead>Market Cap (亿)</TableHead>
                        <TableHead>Earnings Growth</TableHead>
                        <TableHead>Sector</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOverboughtStocks.map((stock) => (
                        <TableRow key={stock.ticker}>
                          <TableCell>{stock.ticker}</TableCell>
                          <TableCell>{stock.daily ? "Yes" : "No"}</TableCell>
                          <TableCell>{stock.weekly ? "Yes" : "No"}</TableCell>
                          <TableCell>{stock.monthly ? "Yes" : "No"}</TableCell>
                          <TableCell>{stock.marketCap.toFixed(2)}</TableCell>
                          <TableCell>{(stock.earningsGrowth * 100).toFixed(2)}%</TableCell>
                          <TableCell>{stock.sector}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 