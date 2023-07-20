import './App.css';
import { Line, Doughnut } from 'react-chartjs-2';
import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';

function App() {
  const [dataType, setDataType] = useState<'sales' | 'bids' | 'asks'>('sales');
  const [authorization, setAuthorization] = useState<string>('');
  const { data: blocksDataResponse, mutate: mutateBlocksData } = useSWR(
    `${process.env.REACT_APP_SERVER_DOMAIN}/sync/queue?type=${dataType}`,
    null,
    {
      refreshInterval: 10000,
    }
  );

  const { data: insertionsData, mutate: mutateInsertions } = useSWR(
    `${process.env.REACT_APP_SERVER_DOMAIN}/sync/insertions`,
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

  useEffect(() => {
    const storedAuth = localStorage.getItem('authorization');

    if (storedAuth) {
      setAuthorization(storedAuth);
    }
  }, []);

  return (
    <div className="App">
      <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
        <div style={{ width: 300 }}>
          <h3
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#565656',
              marginTop: 10,
            }}
          >
            Configuration:
          </h3>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'space-between',
              }}
            >
              <label>
                <b>Authorization:</b>
              </label>
              <input
                value={authorization}
                onChange={(e) => {
                  setAuthorization(e.target.value);
                  localStorage.setItem('authorization', e.target.value);
                }}
                onBlur={() => {
                  if (authorization) {
                    mutateBlocksData();
                    mutateInsertions();
                  }
                }}
              />
            </div>
            {!authorization && authorization.length === 0 ? (
              <div style={{ textAlign: 'right', fontSize: 14, color: 'red' }}>
                Missing Authorization!
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'space-between',
              }}
            >
              <label>
                <b>Data Type:</b>
              </label>
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
          </div>
        </div>
        <div style={{ width: '300px' }}>
          <Doughnut
            options={{
              plugins: {
                title: {
                  position: 'top',
                  display: true,
                  text: 'Block Allocation',
                  color: '#565656',
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
              color: '#565656',
              font: {
                size: 20,
                weight: 'bold',
              },
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Time',
                font: {
                  size: 16,
                  weight: 'bold',
                },
              },
            },
            y: {
              title: {
                display: true,
                text: 'Record Count',
                font: {
                  size: 16,
                  weight: 'bold',
                },
              },
            },
          },
        }}
      />
    </div>
  );
}

export default App;
