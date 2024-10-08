import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;

// JSON data at the bottom of the file
import jsonData from '@/data/kaupvisitala.json';


const generateYearOptions = () => {
  const years: number[] = [];
  for (let year = 2020; year <= currentYear; year++) {
    years.push(year);
  }
  return years;
};

const generateMonthOptions = (selectedYear) => {
  const months = [
    {value: 'January', label: 'Janúar'},
    {value: 'February', label: 'Febrúar'},
    {value: 'March', label: 'Mars'},
    {value: 'April', label: 'Apríl'},
    {value: 'May', label: 'Maí'},
    {value: 'June', label: 'Júní'},
    {value: 'July', label: 'Júlí'},
    {value: 'August', label: 'Ágúst'},
    {value: 'September', label: 'September'},
    {value: 'October', label: 'Október'},
    {value: 'November', label: 'Nóvember'},
    {value: 'December', label: 'Desember'}
  ];
  
  if (parseInt(selectedYear) === currentYear) {
    return months.slice(0, currentMonth - 1);
  }
  return months;
};

const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const formatLargeNumber = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'b';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'm';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const StatsDisplay = ({ indexStartValue, indexTodayValue, differencePercent, amountToday, amountDifference }) => {
  const formatValue = (value, suffix = '') => value === 0 ? '-' : `${formatNumber(Math.round(value))}${suffix}`;

  return (
    <div className="space-y-4 p-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Vísitala byrjun", value: indexStartValue === 0 ? '-' : indexStartValue.toFixed(1) },
          { label: "Vísitala í dag", value: indexTodayValue === 0 ? '-' : indexTodayValue.toFixed(1) },
          { label: "Hækkun í %", value: differencePercent === 0 ? '-' : `${differencePercent.toFixed(1)}%` },
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Hækkun", value: formatValue(amountDifference, ' kr.') },
          { label: "Verð í dag", value: formatValue(amountToday, ' kr.') }
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
    </div>
  );
};

const PriceIndexChart = ({ data }) => {
  if (data.length === 0) {
    return <div className="w-full h-64 mt-8 flex items-center justify-center text-gray-400">No data available</div>;
  }

  return (
    <div className="w-full h-64 mt-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis 
            tickFormatter={(value) => formatLargeNumber(value)}
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip 
            formatter={(value) => [`${formatNumber(Math.round(Number(value)))} ISK`, "Price"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const HousingDataForm = () => {
  const [amount, setAmount] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [location, setLocation] = useState('Höfuðborgasvæðið');
  const [type, setType] = useState('Fjölbýli');
  const [stats, setStats] = useState({
    indexStartValue: 0,
    indexTodayValue: 0,
    differencePercent: 0,
    amountToday: 0,
    amountDifference: 0 // Add this line
  });
  const [chartData, setChartData] = useState<Array<{ date: string; price: number }>>([]);

  const [isDataComplete, setIsDataComplete] = useState(false);

  useEffect(() => {
    setIsDataComplete(!!amount && !!year && !!month);
  }, [amount, year, month]);

  const calculateStats = () => {
    if (!isDataComplete) {
      setStats({
        indexStartValue: 0,
        indexTodayValue: 0,
        differencePercent: 0,
        amountToday: 0,
        amountDifference: 0
      });
      setChartData([]);
      return;
    }

    const monthNumber = new Date(Date.parse(month + " 1, 2000")).getMonth() + 1;
    const startEntry = jsonData.find(entry => entry.AR === parseInt(year) && entry.MANUDUR === monthNumber);
    const endEntry = jsonData[jsonData.length - 1];

    console.log("startEntry", startEntry);

    let indexKey;
    if (location === 'Höfuðborgasvæðið') {
      indexKey = type === 'Fjölbýli' ? 'VISITALA_FJOLBYLI_HOFUDBORGARSVAEDI' : 'VISITALA_SERBYLI_HOFUDBORGARSVAEDI';
    } else {
      indexKey = type === 'Fjölbýli' ? 'VISITALA_FJOLBYLI_LANDSBYGGD' : 'VISITALA_SERBYLI_LANDSBYGGD';
    }

    const indexStartValue = startEntry ? startEntry[indexKey] : 0;
    const indexTodayValue = endEntry ? endEntry[indexKey] : 0;
    const differencePercent = ((indexTodayValue - indexStartValue) / indexStartValue) * 100;
    
    const amountToday = amount ? parseFloat(amount.replace(/\./g, '')) * (1 + differencePercent / 100) : 0;
    const amountDifference = amountToday - parseFloat(amount.replace(/\./g, ''));

    setStats({ 
      indexStartValue, 
      indexTodayValue, 
      differencePercent, 
      amountToday,
      amountDifference
    });

    const startIndex = jsonData.findIndex(entry => entry.AR === parseInt(year) && entry.MANUDUR === monthNumber);

    // Calculate price progression for chart
    let currentAmount = parseFloat(amount.replace(/\./g, ''));
    const chartData = jsonData.slice(startIndex).map((entry, index, array) => {
      console.log("indexes", index, indexStartValue, indexTodayValue)  
      if (index === 0) {
        console.log("index === 0",  `${entry.AR}-${String(entry.MANUDUR).padStart(2, '0')}`)
        return {
          date: `${year}-${String(monthNumber).padStart(2, '0')}`,
          price: currentAmount
        };
      } else {
        const prevEntry = array[index - 1];
        const indexChange = (entry[indexKey] - prevEntry[indexKey]) / prevEntry[indexKey];
        currentAmount *= (1 + indexChange);
        return {
          date: `${entry.AR}-${String(entry.MANUDUR).padStart(2, '0')}`,
          price: currentAmount
        };
      }
    });
    
    setChartData(chartData);
  };

  useEffect(() => {
    calculateStats();
  }, [isDataComplete, amount, year, month, location, type]);

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\./g, '');
    if (/^\d*$/.test(value)) {
      setAmount(formatNumber(value));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    calculateStats();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg border border-gray-100 my-10">
        <div className="p-5 mt-5 mb-10">
            <h2 className="text-2xl font-bold mb-2 text-center">Fasteignaverðmat</h2>
            <p className="text-sm text-muted-foreground text-center">Samkvæmt vísitölu íbúðarverðs frá HMS sem er gefin út mánaðarlega.</p>
        </div>
     
      
      <form onSubmit={handleSubmit} className="mb-2 p-5 bg-gray-100">
   
        <div className="mb-4">
          <Label htmlFor="amount">Kaupverð:</Label>
          <Input
            id="amount"
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="50.000.000"
            required
            className=''
          />
        </div>

        <div className="mb-4 flex flex-row gap-x-3">
            <div className="basis-1/2">
              <Label htmlFor="year">Kaupár:</Label>
              <div className='outline-none'>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                  <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent>
                  {generateYearOptions().map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                  </SelectContent>
              </Select>
              </div>
            </div>

            <div className="basis-1/2">
              <Label htmlFor="month" className="inline-block">Kaupmánuður:</Label>
              <div className='outline-none'>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateMonthOptions(year).map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </div>
        </div>

        

        <div className="mb-4 flex flex-row gap-x-6">
            <div>
            <Label className='pb-2 inline-block'>Staðsetning:</Label>
            <RadioGroup value={location} onValueChange={setLocation} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                <RadioGroupItem value="Höfuðborgasvæðið" id="hofudborgasvaedid" />
                <Label htmlFor="hofudborgasvaedid">Höfuðborgasvæðið</Label>
                </div>
                <div className="flex items-center space-x-2">
                <RadioGroupItem value="Landsbyggðin" id="landsbyggdin" />
                <Label htmlFor="landsbyggdin">Landsbyggðin</Label>
                </div>
            </RadioGroup>
            </div>

            <div>
            <Label className='pb-2 inline-block'>Tegund:</Label>
            <RadioGroup value={type} onValueChange={setType} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                <RadioGroupItem value="Fjölbýli" id="fjolbyli" />
                <Label htmlFor="fjolbyli">Fjölbýli</Label>
                </div>
                <div className="flex items-center space-x-2">
                <RadioGroupItem value="Sérbýli" id="serbyli" />
                <Label htmlFor="serbyli">Sérbýli</Label>
                </div>
            </RadioGroup>
            </div>
        </div>
        
        <Button type="submit" className="w-full hidden">Calculate</Button>
      </form>

      <StatsDisplay {...stats} />
      
      <PriceIndexChart data={chartData} />
    </div>
  );
};

export default HousingDataForm;