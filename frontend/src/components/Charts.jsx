// frontend/src/components/Charts.jsx
import { useEffect } from "react";

export default function Charts() {
  useEffect(() => {
    // Load Recharts UMD build via CDN
    const script = document.createElement("script");
    script.src =
      "https://unpkg.com/recharts/umd/Recharts.min.js";
    script.async = true;
    script.onload = () => {
      const {
        ResponsiveContainer,
        LineChart,
        Line,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        Legend,
      } = window.Recharts;

      const data = [
        { name: "Jan", value: 40 },
        { name: "Feb", value: 55 },
        { name: "Mar", value: 30 },
        { name: "Apr", value: 75 },
        { name: "May", value: 60 },
        { name: "Jun", value: 90 },
      ];

      const chartRoot = document.getElementById("chart-root");

      // Render chart dynamically
      if (chartRoot) {
        window.ReactDOM.render(
          window.React.createElement(
            ResponsiveContainer,
            { width: "100%", height: 300 },
            window.React.createElement(
              LineChart,
              { data, margin: { top: 20, right: 30, left: 20, bottom: 5 } },
              window.React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
              window.React.createElement(XAxis, { dataKey: "name" }),
              window.React.createElement(YAxis, null),
              window.React.createElement(Tooltip, null),
              window.React.createElement(Legend, null),
              window.React.createElement(Line, {
                type: "monotone",
                dataKey: "value",
                stroke: "#2563eb",
                strokeWidth: 3,
                dot: { r: 5, strokeWidth: 2, fill: "#2563eb" },
              })
            )
          ),
          chartRoot
        );
      }
    };

    document.body.appendChild(script);
  }, []);

  return (
    <div
      id="chart-root"
      className="w-full h-[400px] rounded-2xl shadow-lg border border-gray-300 p-4 bg-white"
    >
      <p className="text-center text-gray-500">Loading chart...</p>
    </div>
  );
                                         }
