// Example inside Dashboard.jsx

import { useEffect, useState } from "react";

function Dashboard() {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("https://your-backend-url.com/api/cases/123");
        const data = await res.json();

        console.log("Fetched case data:", data); // 👈 Log the response

        setCaseData(data);
      } catch (err) {
        console.error("Error fetching case data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!caseData || caseData.length === 0) return <p>No data for this case</p>;

  return (
    <div>
      <h1>Case Details</h1>
      <pre>{JSON.stringify(caseData, null, 2)}</pre>
    </div>
  );
}

export default Dashboard;
