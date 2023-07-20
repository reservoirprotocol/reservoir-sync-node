import './App.css';
import { Line, Doughnut } from 'react-chartjs-2';
import useSWR from 'swr';
import { useMemo, useState } from 'react';

function App() {
  const [dataType, setDataType] = useState<'sales' | 'bids' | 'asks'>('sales');
  const { data: blocksDataResponse } = useSWR(
    `http://localhost:1111/sync/queue?type=${dataType}`,
    null,
    {
      refreshInterval: 10000,
    }
  );

  const { data: insertionsData } = useSWR(
    'http://localhost:1111/sync/insertions',
    null,
    {
      refreshInterval: 10000,
    }
  );

  const blockTypeData = useMemo(() => {
    const queueCount = blocksDataResponse?.data?.blocks?.length || 0;
    const backup = blocksDataResponse?.data?.backups?.[`${dataType}-backup`];
    const processingCount = backup ? backup.workers.length : 0;

    return {
      datasets: [
        {
          data: [queueCount, processingCount],
        },
      ],

      labels: ['Queued', 'Processing'],
    };
  }, [blocksDataResponse, dataType]);

  const insertionsChartData = useMemo(() => {
    const insertions = insertionsData?.data?.[`${dataType}`] ?? [];
    return {
      labels: insertions.map((insertion: any) =>
        new Date(insertion.timestamp).toLocaleString()
      ),
      datasets: [
        {
          label: dataType,
          data: insertions.map((insertion: any) => insertion.recordCount),
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    };
  }, [insertionsData, dataType]);

  return (
    <div className="App">
      <div style={{ display: 'flex', padding: 20 }}>
        <div style={{ marginTop: 20 }}>
          <label>Data Type:</label>

          <select
            name="data_type"
            id="data-type-selector"
            value={dataType}
            onChange={(e) => setDataType(e.target.value as any)}
          >
            <option value="bids">Bids</option>
            <option value="asks">Asks</option>
            <option value="sales">Sales</option>
          </select>
        </div>
        <div style={{ width: '300px' }}>
          <Doughnut
            options={{
              plugins: {
                title: {
                  position: 'top',
                  display: true,
                  text: 'Block Allocation',
                  font: {
                    size: 20,
                    weight: 'bold',
                  },
                },
              },
            }}
            data={blockTypeData}
          />
        </div>
      </div>
      <Line
        data={insertionsChartData}
        options={{
          plugins: {
            title: {
              position: 'top',
              display: true,
              text: 'Insertions over Time',
              font: {
                size: 20,
                weight: 'bold',
              },
            },
          },
        }}
      />
    </div>
  );
}

export default App;
