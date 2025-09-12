import React, { useEffect } from "react";

export default function Charts({ data = null }) {
  useEffect(() => {
    if (!document.getElementById("recharts-script")) {
      const s = document.createElement("script");
      s.id = "recharts-script";
      s.src = "https://unpkg.com/recharts/umd/Recharts.min.js";
      s.onload = () => renderChart();
      document.body.appendChild(s);
    } else {
      renderChart();
    }

    function renderChart() {
      if (!window.Recharts || !document.getElementById("chart-root")) return;
      const {
        ResponsiveContainer,
        LineChart,
        Line,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        Legend
      } = window.Recharts;
      const sample = data || [
        { name: "T1", value: 30 },
        { name: "T2", value: 55 },
        { name: "T3", value: 40 }
      ];
      const root = document.getElementById("chart-root");
      // clear
      root.innerHTML = "";
      const App = () =>
        window.React.createElement(
          ResponsiveContainer,
          { width: "100%", height: 240 },
          window.React.createElement(
            LineChart,
            { data: sample, margin: { top: 10, right: 15, left: 0, bottom: 5 } },
            window.React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
            window.React.createElement(XAxis, { dataKey: "name" }),
            window.React.createElement(YAxis, null),
            window.React.createElement(Tooltip, null),
            window.React.createElement(Legend, null),
            window.React.createElement(Line, { type: "monotone", dataKey: "value", stroke: "#2563eb", strokeWidth: 3 })
          )
        );
      window.ReactDOM.render(window.React.createElement(App), root);
    }
  }, [data]);

  return <div id="chart-root" className="bg-white rounded shadow p-4" />;
}
